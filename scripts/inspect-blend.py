import bpy, json, pathlib, sys
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=args[0])
result = {'objects': [], 'materials': [], 'armatures': [], 'images': []}
low, high = Vector((1e12,1e12,1e12)), Vector((-1e12,-1e12,-1e12))
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.data.calc_loop_triangles()
        corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        for corner in corners:
            for i in range(3): low[i], high[i] = min(low[i],corner[i]), max(high[i],corner[i])
        result['objects'].append({'name':obj.name,'mesh':obj.data.name,'vertices':len(obj.data.vertices),
          'triangles':len(obj.data.loop_triangles),'parent':obj.parent.name if obj.parent else None,
          'parentType':obj.parent_type,'parentBone':obj.parent_bone,'materials':[m.name for m in obj.data.materials],
          'uvLayers':[layer.name for layer in obj.data.uv_layers], 'location':list(obj.location),
          'worldCenter':list(sum(corners,Vector())/8),'bounds':[list(corner) for corner in corners],
          'modifiers':[{'name':m.name,'type':m.type,'levels':getattr(m,'levels',None)} for m in obj.modifiers]})
    if obj.type == 'ARMATURE': result['armatures'].append({'name':obj.name,'bones':[bone.name for bone in obj.data.bones]})
for mat in bpy.data.materials:
    result['materials'].append({'name':mat.name,'useNodes':mat.use_nodes,
       'nodes':[{'name':node.name,'type':node.type,'inputs':{socket.name:list(socket.default_value) if hasattr(socket.default_value,'__len__') else socket.default_value for socket in node.inputs if hasattr(socket,'default_value') and (isinstance(socket.default_value,(float,int)) or hasattr(socket.default_value,'__len__'))}} for node in mat.node_tree.nodes] if mat.node_tree else []})
result['images']=[{'name':i.name,'path':i.filepath,'size':list(i.size),'packed':bool(i.packed_file)} for i in bpy.data.images]
result['worldBounds']={'min':list(low),'max':list(high),'dimensions':list(high-low)}
result['triangleCountBase']=sum(obj['triangles'] for obj in result['objects'])
pathlib.Path(args[1]).write_text(json.dumps(result,indent=2))
print(json.dumps({'meshes':len(result['objects']),'bones':sum(len(a['bones']) for a in result['armatures']),'triangles':result['triangleCountBase'],'bounds':result['worldBounds']}))
