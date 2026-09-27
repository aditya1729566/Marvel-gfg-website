"""Blender background import / explicit split / GLB export. Original input is never written.

blender --background --python scripts/preprocess-armor.py -- input.fbx output.glb \
  --split material --mapping armor-map.json --report import-report.json

Use --split loose for topology islands. Material separation does NOT establish
anatomical segmentation; map verified object names after inspecting the first report.
"""
import argparse
import json
import pathlib
import sys
import bpy


def inventory():
    meshes, materials, bones, images = [], set(), set(), []
    for obj in bpy.data.objects:
        if obj.type == 'ARMATURE':
            bones.update((obj.name, bone.name) for bone in obj.data.bones)
        if obj.type != 'MESH':
            continue
        obj.data.calc_loop_triangles()
        names = [slot.material.name if slot.material else None for slot in obj.material_slots]
        materials.update(name for name in names if name)
        meshes.append({'name': obj.name, 'vertices': len(obj.data.vertices),
                       'triangles': len(obj.data.loop_triangles), 'materials': names,
                       'uvLayers': [layer.name for layer in obj.data.uv_layers],
                       'armorPart': obj.get('armor_part'),
                       'parent': obj.parent.name if obj.parent else None,
                       'matrixLocal': [list(row) for row in obj.matrix_local],
                       'matrixWorld': [list(row) for row in obj.matrix_world],
                       'armatureModifiers': [modifier.object.name for modifier in obj.modifiers
                                             if modifier.type == 'ARMATURE' and modifier.object]})
    for image in bpy.data.images:
        if image.type == 'IMAGE':
            images.append({'name': image.name, 'path': image.filepath,
                           'width': image.size[0], 'height': image.size[1]})
    return {'meshes': meshes, 'materialNames': sorted(materials), 'boneCount': len(bones),
            'bones': [{'armature': armature, 'name': name} for armature, name in sorted(bones)],
            'textures': images, 'triangleCount': sum(mesh['triangles'] for mesh in meshes)}


argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('destination')
parser.add_argument('--split', choices=['none', 'material', 'loose'], default='none')
parser.add_argument('--mapping', help='JSON object mapping canonical part names to verified object names (string or array)')
parser.add_argument('--report', default='import-report.json')
args = parser.parse_args(argv)
source, destination = pathlib.Path(args.source).resolve(), pathlib.Path(args.destination).resolve()
if source == destination:
    raise ValueError('Output must not overwrite source')
bpy.ops.wm.read_factory_settings(use_empty=True)
suffix = source.suffix.lower()
if suffix == '.blend':
    bpy.ops.wm.open_mainfile(filepath=str(source))
elif suffix in ['.glb', '.gltf']:
    bpy.ops.import_scene.gltf(filepath=str(source))
elif suffix == '.fbx':
    bpy.ops.import_scene.fbx(filepath=str(source))
else:
    raise ValueError('Supported input: BLEND, FBX, GLB, glTF')
before = inventory()
if args.split != 'none':
    # Edit-mode separation preserves source loop UVs, face material assignments,
    # vertex groups and the object's armature modifiers. No apply-transform,
    # remesh, decimation, normal recalculation or skeleton rewriting is performed.
    for obj in list(bpy.data.objects):
        if obj.type != 'MESH':
            continue
        bpy.ops.object.select_all(action='DESELECT')
        obj.hide_set(False)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.separate(type='MATERIAL' if args.split == 'material' else 'LOOSE')
        bpy.ops.object.mode_set(mode='OBJECT')
mapping = json.loads(pathlib.Path(args.mapping).read_text()) if args.mapping else {}
parts = ['helmet','faceplate','chest_plate','arc_reactor_housing','left_shoulder','right_shoulder',
         'left_upper_arm','right_upper_arm','left_forearm','right_forearm','left_gauntlet','right_gauntlet',
         'pelvis_armor','left_thigh','right_thigh','left_shin','right_shin','left_boot','right_boot','back_armor']
selected = {}
for part, value in mapping.items():
    if part not in parts:
        raise ValueError(f'Unknown canonical armor part: {part}')
    names = [value] if isinstance(value, str) else value
    for name in names:
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != 'MESH':
            raise ValueError(f'Part {part} references missing mesh object {name}')
        if name in selected:
            raise ValueError(f'Mesh {name} assigned to multiple armor parts')
        selected[name] = part
        obj['armor_part'] = part
        obj['assembled_position'] = list(obj.location)
        obj['assembled_quaternion'] = list(obj.rotation_quaternion if obj.rotation_mode == 'QUATERNION' else obj.rotation_euler.to_quaternion())
after = inventory()
report = {'source': str(source), 'destination': str(destination), 'split': args.split,
          'before': before, 'after': after,
          'armorParts': [{'part': part, 'selectableMeshes': [name for name, assigned in selected.items() if assigned == part],
                          'verifiedSeparateObject': any(assigned == part for assigned in selected.values())} for part in parts],
          'checks': {'triangleCountPreserved': before['triangleCount'] == after['triangleCount'],
                     'boneCountPreserved': before['boneCount'] == after['boneCount'],
                     'materialNamesPreserved': before['materialNames'] == after['materialNames']},
          'limitations': ['Material/topology islands are not automatically anatomical armor parts.',
                         'Visually inspect normals, rig deformation, UV seams, original transforms and PBR textures after round-trip.',
                         'Only explicit mappings are advertised as selectable major parts.']}
if not all(report['checks'].values()):
    pathlib.Path(args.report).write_text(json.dumps(report, indent=2))
    raise RuntimeError('Integrity check failed: refusing GLB export')
destination.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(destination), export_format='GLB', export_extras=True,
                         export_texcoords=True, export_normals=True, export_skins=True,
                         export_all_influences=True, export_apply=False)
report['exported'] = destination.is_file()
pathlib.Path(args.report).write_text(json.dumps(report, indent=2))
print(json.dumps({'exported': report['exported'], 'triangles': after['triangleCount'], 'bones': after['boneCount']}))
