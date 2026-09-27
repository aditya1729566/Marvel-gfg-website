"""Compare geometry/UV inventories after exporting and reimporting in Blender."""
import bpy, json, pathlib, sys
from mathutils import Vector
from mathutils.kdtree import KDTree
source, glb, report_path = sys.argv[sys.argv.index('--') + 1:]

def snapshot():
    result = {}
    for obj in bpy.data.objects:
        if obj.type != 'MESH': continue
        obj.data.calc_loop_triangles()
        points = {tuple(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices}
        uvs = {(loop.uv.x,loop.uv.y,0.0) for layer in obj.data.uv_layers for loop in layer.data}
        result[obj.name] = {'positions':points,'uvs':uvs,'triangles':len(obj.data.loop_triangles),
                            'uvLayerCount':len(obj.data.uv_layers), 'hasNormals':len(obj.data.corner_normals)>0}
    return result

bpy.ops.wm.open_mainfile(filepath=source)
before = snapshot()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
after = snapshot()
checks = []
def maximum_nearest_error(first, second):
    if not first and not second: return 0.0
    if not first or not second: return None
    maximum = 0.0
    for left,right in [(first,second),(second,first)]:
        tree = KDTree(len(right))
        for index,point in enumerate(right): tree.insert(point,index)
        tree.balance()
        for point in left: maximum = max(maximum,tree.find(point)[2])
    return maximum
for name, original in before.items():
    exported = after.get(name)
    uv_error = maximum_nearest_error(original['uvs'],exported['uvs']) if exported else None
    position_error = maximum_nearest_error(original['positions'],exported['positions']) if exported else None
    checks.append({'name':name, 'found':bool(exported),
                   'trianglesPreserved':bool(exported and original['triangles']==exported['triangles']),
                   'uvLayerCountPreserved':bool(exported and original['uvLayerCount']==exported['uvLayerCount']),
                   'uvValuesPreservedAt1e5':uv_error is not None and uv_error < 1e-5,
                   'worldVertexPositionsPreservedAt1e5':position_error is not None and position_error < 1e-5,
                   'maximumNearestUVError':uv_error, 'maximumNearestWorldVertexError':position_error,
                   'normalAttributePresent':bool(exported and exported['hasNormals'])})
report = {'source':source,'glb':glb,'checks':checks,
          'allTrianglesPreserved':all(item['trianglesPreserved'] for item in checks),
          'allUVLayersPreserved':all(item['uvLayerCountPreserved'] for item in checks),
          'allUVValuesPreservedAt1e5':all(item['uvValuesPreservedAt1e5'] for item in checks),
          'allWorldVertexSetsPreservedAt1e5':all(item['worldVertexPositionsPreservedAt1e5'] for item in checks),
          'allNormalAttributesPresent':all(item['normalAttributePresent'] for item in checks),
          'maximumUVError':max(item['maximumNearestUVError'] or 0 for item in checks),
          'maximumWorldVertexError':max(item['maximumNearestWorldVertexError'] or 0 for item in checks),
          'notes':['Two-way nearest-set comparisons tolerate floating-point export/import precision at 1e-5.',
                   'Normal attribute presence is verified; visual surface-normal fidelity still needs render inspection.']}
pathlib.Path(report_path).write_text(json.dumps(report,indent=2))
print(json.dumps({key:value for key,value in report.items() if key.startswith('all')}))
