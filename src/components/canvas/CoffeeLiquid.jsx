import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import { useStore } from '@/store/useStore'

// ---------------------------------------------------------------------------
//  Subdivided disc geometry — concentric rings for smooth vertex displacement
// ---------------------------------------------------------------------------
function createSubdividedDisc(radius, rings, segments) {
  const vertices = []
  const indices = []
  const uvs = []

  // Center vertex
  vertices.push(0, 0, 0)
  uvs.push(0.5, 0.5)

  for (let r = 1; r <= rings; r++) {
    const ringRadius = (r / rings) * radius
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2
      const x = Math.cos(angle) * ringRadius
      const y = Math.sin(angle) * ringRadius
      vertices.push(x, y, 0)
      uvs.push(0.5 + (x / (radius * 2.0)), 0.5 + (y / (radius * 2.0)))
    }
  }

  for (let s = 0; s < segments; s++) {
    const next = (s + 1) % segments
    indices.push(0, s + 1, next + 1)
  }

  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const curr = 1 + (r - 1) * segments + s
      const next = 1 + (r - 1) * segments + ((s + 1) % segments)
      const outerCurr = 1 + r * segments + s
      const outerNext = 1 + r * segments + ((s + 1) % segments)
      indices.push(curr, outerCurr, outerNext)
      indices.push(curr, outerNext, next)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ---------------------------------------------------------------------------
//  GPGPU 2D wave equation — FBO ping-pong heightmap
//  Red channel  = current height
//  Green channel = previous frame height
// ---------------------------------------------------------------------------
const heightmapFragmentShader = `
  uniform vec2 uSpoonUV;
  uniform float uSpoonMoving;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 texel = 1.0 / resolution.xy;

    // Circular boundary kill-zone
    float distToCenter = distance(uv, vec2(0.5));
    if (distToCenter > 0.48) {
       gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
       return;
    }

    vec4 data = texture2D(uWater, uv);
    float current = data.r;
    float previous = data.g;

    // 4-neighbor Laplacian
    float left  = texture2D(uWater, uv - vec2(texel.x, 0.0)).r;
    float right = texture2D(uWater, uv + vec2(texel.x, 0.0)).r;
    float down  = texture2D(uWater, uv - vec2(0.0, texel.y)).r;
    float up    = texture2D(uWater, uv + vec2(0.0, texel.y)).r;

    // Wave equation: average neighbors minus previous
    float newHeight = (up + down + left + right) / 2.0 - previous;

    // Viscosity damping
    newHeight *= 0.98;

    // Spoon depression
    if (uSpoonMoving > 0.5) {
      float distToSpoon = distance(uv, uSpoonUV);
      if (distToSpoon < 0.02) {
        newHeight -= 0.05;
      }
    }

    // Smooth boundary attenuation
    newHeight *= smoothstep(0.48, 0.45, distToCenter);
    newHeight = clamp(newHeight, -0.05, 0.05);

    gl_FragColor = vec4(newHeight, current, 0.0, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Morph keyframes — synchronized with menu scroll (coffeeProgress 0→4)
// ---------------------------------------------------------------------------
const MORPH_COLORS = [
  new THREE.Color('#2A140A'), // 0: Espresso — extremely dark brown
  new THREE.Color('#38180A'), // 1: Mocha — deep chocolate brown
  new THREE.Color('#D4955A'), // 2: Latte — ultra-realistic rich golden caramel crema
  new THREE.Color('#8C4824'), // 3: Cappuccino — intense classic brown
  new THREE.Color('#3E2723'), // 4: Hot Chocolate — dark matte cocoa
]

const MORPH_KEYFRAMES = [
  // Espresso: Extremely dark, pure liquid reflection
  { roughness: 0.01, transmission: 0.05, foam: 1.5, clearcoat: 1.2, clearcoatRoughness: 0.0, thickness: 1.5 },
  // Mocha: Rich dark chocolate brown, basically opaque
  { roughness: 0.08, transmission: 0.0, foam: 0.4, clearcoat: 1.0, clearcoatRoughness: 0.0, thickness: 2.0 },
  // Latte: Ultra-realistic smooth milk/crema mix
  { roughness: 0.05, transmission: 0.02, foam: 0.6, clearcoat: 1.0, clearcoatRoughness: 0.02, thickness: 2.0 },
  // Cappuccino: Heavy microfoam, completely opaque
  { roughness: 0.15, transmission: 0.0, foam: 1.0, clearcoat: 0.8, clearcoatRoughness: 0.08, thickness: 2.5 },
  // Hot Chocolate: Dense, fully opaque cocoa reflection
  { roughness: 0.20, transmission: 0.0, foam: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.1, thickness: 3.0 },
]

const SHIMMER_FLOOR = {
  foam: 1.2,
  roughness: 0.06,
  clearcoat: 1.0,
  clearcoatRoughness: 0.025,
  reflectivity: 0.18,
  envMapIntensity: 0.35,
}

function lerpVal(a, b, t) {
  return a + (b - a) * t
}

// Scratch Color objects for lerp — never GC'd
const _colorA = new THREE.Color()
const _colorB = new THREE.Color()

// ---------------------------------------------------------------------------
//  CoffeeLiquid Component
// ---------------------------------------------------------------------------
export default function CoffeeLiquid({ radius = 1.12, stirring = false }) {
  const meshRef = useRef()
  const customMaterialRef = useRef()
  const prevSpoon = useRef(new THREE.Vector2())
  const timeRef = useRef(0)
  const { gl } = useThree()

  // Cappuccino base color per spec (#6F4E37) — initial only, overridden by morph
  const liquidColor = '#6F4E37'

  const geometry = useMemo(() => createSubdividedDisc(radius, 128, 128), [radius])

  // ---- GPGPU Computation Renderer (FBO ping-pong) ----
  const fbo = useMemo(() => {
    const size = 256
    const gpuCompute = new GPUComputationRenderer(size, size, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType || THREE.FloatType)
    } else {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const initialWater = gpuCompute.createTexture()
    const heightmapVariable = gpuCompute.addVariable('uWater', heightmapFragmentShader, initialWater)
    gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable])

    heightmapVariable.material.uniforms.uSpoonUV = { value: new THREE.Vector2(0.5, 0.5) }
    heightmapVariable.material.uniforms.uSpoonMoving = { value: 0.0 }

    const error = gpuCompute.init()
    if (error !== null) {
      console.error('FBO Init Error:', error)
    }

    return { gpuCompute, heightmapVariable }
  }, [gl])

  // ---- Per-frame: map spoon position → UV, step simulation, morph liquid ----
  useFrame((state, delta) => {
    if (!stirring || !fbo) return
    timeRef.current += delta
    const t = timeRef.current

    const spoonX = 0.45 + Math.cos(t * 1.8) * 0.45
    const spoonZ = Math.sin(t * 1.8) * 0.45

    const localSpoonX = spoonX
    const localSpoonY = -spoonZ

    const spoonU = (localSpoonX / (radius * 2.0)) + 0.5
    const spoonV = (localSpoonY / (radius * 2.0)) + 0.5

    const currentUV = new THREE.Vector2(spoonU, spoonV)
    const isMoving = currentUV.distanceTo(prevSpoon.current) > 0.0001 ? 1.0 : 0.0
    prevSpoon.current.copy(currentUV)

    fbo.heightmapVariable.material.uniforms.uSpoonUV.value.copy(currentUV)
    fbo.heightmapVariable.material.uniforms.uSpoonMoving.value = isMoving

    fbo.gpuCompute.compute()

    const renderTarget = fbo.gpuCompute.getCurrentRenderTarget(fbo.heightmapVariable)
    if (customMaterialRef.current) {
      customMaterialRef.current.uniforms.uHeightMap.value = renderTarget.texture
    }

    // ------------------------------------------------------------------
    //  Liquid morph — interpolate material props based on coffeeProgress
    // ------------------------------------------------------------------
    const progress = useStore.getState().coffeeProgress
    const clamped = Math.max(0, Math.min(4, progress))
    const idx = Math.min(Math.floor(clamped), 3)
    const frac = clamped - idx

    const from = MORPH_KEYFRAMES[idx]
    const to = MORPH_KEYFRAMES[idx + 1]

    // Update uProgress uniform — drives vertex displacement intensity
    if (customMaterialRef.current?.uniforms?.uProgress) {
      customMaterialRef.current.uniforms.uProgress.value = clamped / 4.0
    }

    // Update foam displacement uniform
    if (customMaterialRef.current?.uniforms?.uFoamIntensity) {
      customMaterialRef.current.uniforms.uFoamIntensity.value = Math.max(
        SHIMMER_FLOOR.foam,
        lerpVal(from.foam, to.foam, frac)
      )
    }

    // Update material visual properties
    const mat = meshRef.current?.material
    if (mat) {
      _colorA.copy(MORPH_COLORS[idx])
      _colorB.copy(MORPH_COLORS[idx + 1])
      mat.color.lerpColors(_colorA, _colorB, frac)
      mat.attenuationColor.lerpColors(_colorA, _colorB, frac)
      mat.roughness = Math.min(
        SHIMMER_FLOOR.roughness,
        lerpVal(from.roughness, to.roughness, frac)
      )
      mat.transmission = lerpVal(from.transmission, to.transmission, frac)
      mat.clearcoat = Math.max(
        SHIMMER_FLOOR.clearcoat,
        lerpVal(from.clearcoat, to.clearcoat, frac)
      )
      mat.clearcoatRoughness = Math.min(
        SHIMMER_FLOOR.clearcoatRoughness,
        lerpVal(from.clearcoatRoughness, to.clearcoatRoughness, frac)
      )
      mat.thickness = lerpVal(from.thickness, to.thickness, frac)
      mat.reflectivity = SHIMMER_FLOOR.reflectivity
      mat.envMapIntensity = SHIMMER_FLOOR.envMapIntensity
    }
  })

  // ---- onBeforeCompile: Worley noise + heightmap displacement + normal recalc ----
  const onBeforeCompile = (shader) => {
    shader.uniforms.uHeightMap = { value: null }
    shader.uniforms.uFoamIntensity = { value: 1.0 }
    shader.uniforms.uProgress = { value: 0.0 }
    customMaterialRef.current = shader

    const D = (radius * 2.0).toFixed(4)

    shader.vertexShader = `
      uniform sampler2D uHeightMap;
      uniform float uFoamIntensity;
      uniform float uProgress;

      // Worley noise (Manhattan distance) for chaotic microfoam unevenness
      vec2 random2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
      }

      float worleyManhattan(vec2 p) {
          vec2 i_st = floor(p);
          vec2 f_st = fract(p);
          float m_dist = 10.0;
          for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                  vec2 neighbor = vec2(float(x), float(y));
                  vec2 point = random2(i_st + neighbor);
                  vec2 diff = neighbor + point - f_st;
                  float dist = abs(diff.x) + abs(diff.y);
                  m_dist = min(m_dist, dist);
              }
          }
          return m_dist;
      }

      float getCombinedHeight(vec2 localPos) {
          vec2 uv = vec2(localPos.x / ${D} + 0.5, localPos.y / ${D} + 0.5);
          float baseH = texture2D(uHeightMap, uv).r;

          // Scale Worley detail by uProgress — more turbulent as drinks change
          float noiseScale = 40.0 + uProgress * 20.0;
          float noise = worleyManhattan(localPos * noiseScale);
          float detail = (1.0 - noise) * abs(baseH) * (0.3 + uProgress * 0.2);
          return baseH + detail * sign(baseH);
      }

      ${shader.vertexShader}
    `
      .replace(
        '#include <beginnormal_vertex>',
        `
      vec2 heightMapUV = vec2(position.x / ${D} + 0.5, position.y / ${D} + 0.5);

      // Central-difference normal recalculation from displacement
      float physOffset = ${D} / 256.0;
      float hL = getCombinedHeight(position.xy + vec2(-physOffset, 0.0)) * uFoamIntensity;
      float hR = getCombinedHeight(position.xy + vec2(physOffset, 0.0)) * uFoamIntensity;
      float hD = getCombinedHeight(position.xy + vec2(0.0, -physOffset)) * uFoamIntensity;
      float hU = getCombinedHeight(position.xy + vec2(0.0, physOffset)) * uFoamIntensity;

      vec3 objectNormal = normalize(vec3(-(hR - hL), -(hU - hD), physOffset * 2.0));
      `
      )
      .replace(
        '#include <begin_vertex>',
        `
      vec3 transformed = vec3(position);
      float h = getCombinedHeight(position.xy) * uFoamIntensity;
      transformed.z += h;
      `
      )
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, 1.52, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <meshPhysicalMaterial
        color={liquidColor}
        roughness={0.15}
        metalness={0}
        clearcoat={0.4}
        clearcoatRoughness={0.1}
        transmission={0}
        thickness={0}
        attenuationColor={liquidColor}
        attenuationDistance={0.5}
        ior={1.4}
        reflectivity={0.08}
        envMapIntensity={0.15}
        side={THREE.DoubleSide}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  )
}
