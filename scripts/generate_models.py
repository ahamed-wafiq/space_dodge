import bpy
import math

# Clear all mesh objects from scene
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    
    if emission:
        # Check Blender 4.x / 5.x Principled BSDF input naming
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = emission_strength
    return mat

# ==========================================
# 1. BUILD SPACESHIP (IMAGE 2 REFERENCE)
# ==========================================
def build_spaceship(export_path):
    # Clear objects
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    mat_hull = create_pbr_material("Hull_Graphite", (0.09, 0.11, 0.14, 1.0), metallic=0.85, roughness=0.22)
    mat_silver = create_pbr_material("Hull_Silver", (0.75, 0.78, 0.82, 1.0), metallic=0.92, roughness=0.18)
    mat_canopy = create_pbr_material("Cockpit_Glass", (0.02, 0.20, 0.28, 1.0), metallic=0.2, roughness=0.05)
    mat_cyan_neon = create_pbr_material("Neon_Cyan", (0.0, 0.95, 1.0, 1.0), metallic=0.0, roughness=0.1, emission=(0.0, 0.95, 1.0, 1.0), emission_strength=4.0)
    mat_orange_neon = create_pbr_material("Neon_Orange", (1.0, 0.45, 0.05, 1.0), metallic=0.0, roughness=0.1, emission=(1.0, 0.45, 0.05, 1.0), emission_strength=4.5)
    mat_exhaust = create_pbr_material("Thruster_Core", (0.2, 0.8, 1.0, 1.0), metallic=0.1, roughness=0.2, emission=(0.2, 0.8, 1.0, 1.0), emission_strength=6.0)

    # 1. Central Aerodynamic Fuselage
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.92, depth=3.8, location=(0, 0, 0))
    fuselage = bpy.context.object
    fuselage.name = "Ship_Fuselage"
    fuselage.rotation_euler = (math.radians(90), 0, 0)
    fuselage.scale = (1.4, 0.44, 1.0)
    fuselage.data.materials.append(mat_hull)

    # 2. Sleek Tapered Nose
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.92, radius2=0.08, depth=2.4, location=(0, -2.7, 0.02))
    nose = bpy.context.object
    nose.name = "Ship_Nose"
    nose.rotation_euler = (math.radians(-90), 0, 0)
    nose.scale = (1.35, 0.40, 1.0)
    nose.data.materials.append(mat_silver)

    # 3. Cockpit Canopy Glass
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.58, location=(0, -0.6, 0.32))
    canopy = bpy.context.object
    canopy.name = "Ship_Canopy"
    canopy.scale = (0.78, 2.1, 0.52)
    canopy.data.materials.append(mat_canopy)

    # 4. Swept Delta Wings
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, -0.06))
    wings = bpy.context.object
    wings.name = "Ship_Wings"
    wings.scale = (5.8, 1.75, 0.12)
    wings.data.materials.append(mat_hull)

    # Wingtip Stabilizers
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 2.92, 0.35, 0.38))
        w_tip = bpy.context.object
        w_tip.scale = (0.12, 1.45, 0.8)
        w_tip.rotation_euler = (0, 0, math.radians(-15 * side))
        w_tip.data.materials.append(mat_silver)

        # Neon wing light strip
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 2.0, 0.32, 0.02))
        strip = bpy.context.object
        strip.scale = (1.8, 0.08, 0.08)
        strip.data.materials.append(mat_cyan_neon)

    # 5. Dual Heavy Turbine Engines (Left and Right)
    for side in [-1, 1]:
        x_pos = side * 1.08
        # Outer Engine Casing
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.46, depth=2.5, location=(x_pos, 1.15, 0.06))
        eng = bpy.context.object
        eng.rotation_euler = (math.radians(90), 0, 0)
        eng.data.materials.append(mat_silver)

        # Cooling Rib Ring
        bpy.ops.mesh.primitive_torus_add(major_radius=0.47, minor_radius=0.06, location=(x_pos, 0.1, 0.06))
        ring = bpy.context.object
        ring.rotation_euler = (math.radians(90), 0, 0)
        ring.data.materials.append(mat_cyan_neon)

        # Exhaust Nozzle Cowling
        bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.48, radius2=0.34, depth=0.65, location=(x_pos, 2.45, 0.06))
        nozzle = bpy.context.object
        nozzle.rotation_euler = (math.radians(-90), 0, 0)
        nozzle.data.materials.append(mat_hull)

        # Glowing Thruster Interior Core
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.30, depth=0.15, location=(x_pos, 2.72, 0.06))
        core = bpy.context.object
        core.rotation_euler = (math.radians(90), 0, 0)
        core.data.materials.append(mat_exhaust)

    # Rotate 180 on Z so forward direction faces -Z in Three.js
    for obj in bpy.data.objects:
        obj.rotation_euler.z += math.pi

    # Export GLB
    bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
    print("Exported spaceship to:", export_path)

# ==========================================
# 2. BUILD ANCIENT ALIEN GATE (IMAGE 1)
# ==========================================
def build_alien_gate(export_path):
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    mat_stone = create_pbr_material("AncientStone", (0.16, 0.18, 0.22, 1.0), metallic=0.15, roughness=0.85)
    mat_carved = create_pbr_material("CarvedStone", (0.12, 0.14, 0.18, 1.0), metallic=0.25, roughness=0.75)
    mat_rune = create_pbr_material("RuneGlow", (0.0, 0.95, 1.0, 1.0), metallic=0.0, roughness=0.1, emission=(0.0, 0.95, 1.0, 1.0), emission_strength=4.5)
    mat_amber = create_pbr_material("AmberCore", (1.0, 0.55, 0.1, 1.0), metallic=0.0, roughness=0.1, emission=(1.0, 0.55, 0.1, 1.0), emission_strength=5.0)

    # Gateway Dimensions: Doorway is 6.0 units wide, 7.5 units high
    col_width = 2.4
    col_height = 15.0
    door_width = 6.4

    # Left Column (Tiered Carved Monolith)
    for side in [-1, 1]:
        cx = side * (door_width / 2 + col_width / 2)
        # Main Pillar
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, 0, col_height / 2))
        col = bpy.context.object
        col.scale = (col_width, 3.4, col_height)
        col.data.materials.append(mat_stone)

        # Flanking Stepped Buttress
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 1.4, 0, 6.0))
        buttress = bpy.context.object
        buttress.scale = (1.2, 2.8, 12.0)
        buttress.data.materials.append(mat_carved)

        # Glowing Alien Rune Inscription Strip
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx - side * 0.9, 0, 6.5))
        rune = bpy.context.object
        rune.scale = (0.25, 0.15, 9.0)
        rune.data.materials.append(mat_rune)

    # Top Arch Lintel (Crossbeam)
    lintel_w = door_width + col_width * 2 + 2.0
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 13.8))
    lintel = bpy.context.object
    lintel.scale = (lintel_w, 3.8, 3.2)
    lintel.data.materials.append(mat_stone)

    # Upper Stepped Cornice
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 16.0))
    cornice = bpy.context.object
    cornice.scale = (lintel_w - 2.5, 3.4, 1.8)
    cornice.data.materials.append(mat_carved)

    # Central Amber/Cyan Glyph Relic
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.35, location=(0, 0, 11.8))
    glyph = bpy.context.object
    glyph.scale = (1.4, 0.5, 1.4)
    glyph.data.materials.append(mat_amber)

    bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
    print("Exported alien gate to:", export_path)

# ==========================================
# 3. BUILD STRATIFIED ROCK PILLAR
# ==========================================
def build_rock_pillar(export_path):
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    mat_rock = create_pbr_material("CanyonBasalt", (0.18, 0.15, 0.22, 1.0), metallic=0.12, roughness=0.9)
    mat_edge = create_pbr_material("StrataHighlight", (0.28, 0.24, 0.32, 1.0), metallic=0.2, roughness=0.8)

    # Multi-tiered faceted stone pillar
    bpy.ops.mesh.primitive_cylinder_add(vertices=9, radius=1.8, depth=22.0, location=(0, 0, 11.0))
    pillar = bpy.context.object
    pillar.scale = (1.0, 1.25, 1.0)
    pillar.data.materials.append(mat_rock)

    # Interlocking strata shelves
    for z in [4.5, 9.5, 15.0, 19.5]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=7, radius=2.2, depth=1.2, location=(0, 0, z))
        strata = bpy.context.object
        strata.scale = (1.1, 1.3, 1.0)
        strata.rotation_euler = (0.05, 0.08, z * 0.4)
        strata.data.materials.append(mat_edge)

    bpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB')
    print("Exported rock pillar to:", export_path)

if __name__ == "__main__":
    build_spaceship(r"c:\Users\Mohideen A Kader\OneDrive\Desktop\spacegame\public\models\spaceship.glb")
    build_alien_gate(r"c:\Users\Mohideen A Kader\OneDrive\Desktop\spacegame\public\models\alien_gate.glb")
    build_rock_pillar(r"c:\Users\Mohideen A Kader\OneDrive\Desktop\spacegame\public\models\rock_pillar.glb")
