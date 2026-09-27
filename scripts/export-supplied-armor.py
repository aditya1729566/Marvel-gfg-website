"""Export already-separate supplied armor. No mesh splitting or source overwrite."""
import bpy, json, pathlib, sys
from mathutils import Vector

source, destination, report_path = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=source)
meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
bone_count = sum(len(obj.data.bones) for obj in bpy.data.objects if obj.type == 'ARMATURE')
parts = ['helmet','faceplate','chest_plate','arc_reactor_housing','left_shoulder','right_shoulder','left_upper_arm','right_upper_arm','left_forearm','right_forearm','left_gauntlet','right_gauntlet','pelvis_armor','left_thigh','right_thigh','left_shin','right_shin','left_boot','right_boot','back_armor']
groups = {part: [] for part in parts}

def role(obj):
    name = obj.name.lower().replace(' ', '_')
    center = sum((obj.matrix_world @ Vector(corner) for corner in obj.bound_box), Vector()) / 8
    # Two knee insert source objects are both named .r; geometry resolves the side.
    side = ('left' if center.x > 0 else 'right') if '.l' in name or '.r' in name else None
    if name.startswith('h.head'): return 'helmet'
    if name.startswith(('h.mask','h.chin','h.eye')): return 'faceplate'
    if 'ark' in name: return 'arc_reactor_housing'
    if 'shoulder' in name and side: return f'{side}_shoulder'
    if 'arm_nuts' in name and side: return f'{side}_upper_arm'
    if '_fore_arm' in name and side: return f'{side}_forearm'
    if ('_arm.' in name or '_hand_y_1' in name) and side: return f'{side}_upper_arm'
    if '_albo' in name and side: return f'{side}_forearm'
    if '_hand' in name and side: return f'{side}_gauntlet'
    if '_shoe' in name and side: return f'{side}_boot'
    if '_u_leg' in name and side: return f'{side}_thigh'
    if any(pattern in name for pattern in ['_d_leg','_knee','_b_knee','_leg_circle','_l_circle','_r_circle']) and side: return f'{side}_shin'
    if 'sphere' in name: return 'left_upper_arm' if center.x > 0 else 'right_upper_arm'
    if any(pattern in name for pattern in ['_b_back','_back_y','_b_side','_b_neck','_bone']): return 'back_armor'
    if any(pattern in name for pattern in ['_abs','_belly','_stomach']): return 'pelvis_armor'
    if any(pattern in name for pattern in ['chest','neck','_c_nuts']): return 'chest_plate'
    return None

original = {}
unmapped = []
for obj in meshes:
    bpy.context.view_layer.update()
    obj.data.calc_loop_triangles()
    original[obj.name] = {'matrixWorld': [list(row) for row in obj.matrix_world],
                         'matrixLocal': [list(row) for row in obj.matrix_local],
                         'triangles': len(obj.data.loop_triangles),
                         'uvLayers': [layer.name for layer in obj.data.uv_layers],
                         'materials': [mat.name for mat in obj.data.materials]}
    part = role(obj)
    if part:
        groups[part].append(obj)
        obj['armor_part'] = part
    else: unmapped.append(obj.name)

# Rigid, unparented armor can safely acquire twenty transform-control wrappers.
# For any skeletal/parented source, retain the native hierarchy and tag its meshes.
wrappers = bone_count == 0 and all(obj.parent is None for obj in meshes)
if wrappers:
    for part, children in groups.items():
        if not children: continue
        parent = bpy.data.objects.new(part, None)
        bpy.context.scene.collection.objects.link(parent)
        centers = [sum((obj.matrix_world @ Vector(corner) for corner in obj.bound_box), Vector()) / 8 for obj in children]
        parent.location = sum(centers, Vector()) / len(centers)
        parent['armor_part'] = part
        parent['armor_control'] = True
        bpy.context.view_layer.update()
        for obj in children:
            world = obj.matrix_world.copy()
            obj.parent = parent
            obj.matrix_world = world
        parent['assembled_position'] = list(parent.location)
        parent['assembled_quaternion'] = [1.0,0.0,0.0,0.0]
        bpy.context.view_layer.update()

error = max((max(abs(obj.matrix_world[row][col] - original[obj.name]['matrixWorld'][row][col]) for row in range(4) for col in range(4)) for obj in meshes), default=0)
if error > 1e-5: raise RuntimeError(f'Original world transforms changed: {error}')
# glTF does not directly export Blender's legacy Glass BSDF. Translate its scalar
# properties to the equivalent Principled transmission inputs, avoiding a silent
# opaque default material over the source reactor lens. Source BLEND stays intact.
glass = bpy.data.materials.get('glss')
glass_conversion = False
if glass and glass.use_nodes:
    legacy = next((node for node in glass.node_tree.nodes if node.type == 'BSDF_GLASS'), None)
    if legacy:
        color, roughness, ior = list(legacy.inputs['Color'].default_value), legacy.inputs['Roughness'].default_value, legacy.inputs['IOR'].default_value
        principled = glass.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        principled.inputs['Base Color'].default_value = color
        principled.inputs['Roughness'].default_value = roughness
        principled.inputs['IOR'].default_value = ior
        principled.inputs['Transmission Weight'].default_value = 1.0
        output = next(node for node in glass.node_tree.nodes if node.type == 'OUTPUT_MATERIAL')
        glass.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])
        glass_conversion = True
pathlib.Path(destination).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=destination, export_format='GLB', export_extras=True,
                         export_texcoords=True, export_normals=True, export_skins=True,
                         export_all_influences=True, export_apply=False, export_animations=True)
report = {'source':source, 'destination':destination, 'meshCount':len(meshes),
          'boneCount':bone_count,'triangleCountBase':sum(obj['triangles'] for obj in original.values()),
          'originalMeshes':original, 'majorArmorParts':[{ 'part':part,'meshes':[obj.name for obj in children],
          'separatelySelectable':bool(children)} for part,children in groups.items()],
          'wrappersCreated':wrappers, 'maximumWorldTransformError':error, 'unmappedMeshes':unmapped,
          'glassShaderTranslatedToGLTFTransmission':glass_conversion,
          'limitations':['Logical role grouping is temporary: elbow/knee inserts accompany forearm/shin, abdominal plates accompany pelvis.',
                         'No high-resolution PBR texture maps were manufactured; source material properties are exported.',
                         'Original world transforms, UV attributes, material references and normals are retained. Wrapper parenting changes child local transforms while preserving assembled world placement.']}
pathlib.Path(report_path).write_text(json.dumps(report,indent=2))
print(json.dumps({'exported':destination,'meshes':len(meshes),'bones':bone_count,'wrappers':wrappers,'unmapped':unmapped}))
