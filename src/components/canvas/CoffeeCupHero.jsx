'use client'

import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Center, Decal } from '@react-three/drei'
import CoffeeLiquid from './CoffeeLiquid'
import Spoon from './Spoon'

// ---------------------------------------------------------------------------
//  Procedural logo texture — rendered once via Canvas2D
// ---------------------------------------------------------------------------
function createLogoTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Subtle shadow
  ctx.shadowColor = 'rgba(56, 34, 15, 0.25)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  // Brand text
  ctx.font = 'italic 700 72px Georgia, "Times New Roman", serif'
  ctx.fillStyle = '#8B6914'
  ctx.fillText('caffenaline', canvas.width / 2, canvas.height / 2)

  // Decorative underline
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2 - 200, canvas.height / 2 + 48)
  ctx.bezierCurveTo(
    canvas.width / 2 - 80, canvas.height / 2 + 52,
    canvas.width / 2 + 80, canvas.height / 2 + 52,
    canvas.width / 2 + 200, canvas.height / 2 + 48,
  )
  ctx.stroke()

  // Diamond ornament
  const cx = canvas.width / 2
  const cy = canvas.height / 2 + 62
  ctx.fillStyle = '#8B6914'
  ctx.beginPath()
  ctx.moveTo(cx, cy - 5)
  ctx.lineTo(cx + 5, cy)
  ctx.lineTo(cx, cy + 5)
  ctx.lineTo(cx - 5, cy)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ---------------------------------------------------------------------------
//  Tri-Planar GLSL for the ceramic noise bump — injected via onBeforeCompile
// ---------------------------------------------------------------------------
function createCeramicOnBeforeCompile(noiseTexture) {
  return (shader) => {
    shader.uniforms.uNoiseMap = { value: noiseTexture }

    // ---------- vertex shader: pass world position + world normal ----------
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPos;
       varying vec3 vWorldNorm;`
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
       vWorldNorm = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);`
    )

    // ---------- fragment shader: tri-planar bump projection ---------------
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform sampler2D uNoiseMap;
       varying vec3 vWorldPos;
       varying vec3 vWorldNorm;

       // Tri-planar blending weights with sharpness exponent
       vec3 triPlanarWeights(vec3 n, float sharpness) {
         vec3 w = pow(abs(n), vec3(sharpness));
         return w / (w.x + w.y + w.z);
       }

       // Sample noise from 3 orthogonal projections and blend
       float triPlanarNoise(vec3 pos, vec3 norm, float scale) {
         vec3 w = triPlanarWeights(norm, 4.0);
         float sXY = texture2D(uNoiseMap, pos.xy * scale).r;
         float sXZ = texture2D(uNoiseMap, pos.xz * scale).r;
         float sYZ = texture2D(uNoiseMap, pos.yz * scale).r;
         return sXY * w.z + sXZ * w.y + sYZ * w.x;
       }`
    )

    // Inject bump perturbation into the normal calculation
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
       {
         // Central-difference bump from tri-planar noise
         float eps = 0.005;
         float scale = 2.5;
         float h  = triPlanarNoise(vWorldPos, vWorldNorm, scale);
         float hx = triPlanarNoise(vWorldPos + vec3(eps, 0.0, 0.0), vWorldNorm, scale);
         float hy = triPlanarNoise(vWorldPos + vec3(0.0, eps, 0.0), vWorldNorm, scale);
         vec3 bumpGrad = vec3((hx - h) / eps, (hy - h) / eps, 0.0);
         normal = normalize(normal - bumpGrad * 0.012);
       }`
    )
  }
}

function deterministicNoiseValue(index) {
  const seed = Math.sin((index + 1) * 12.9898) * 43758.5453
  return 200 + (seed - Math.floor(seed)) * 55
}

// ---------------------------------------------------------------------------
//  Scroll choreography constants
// ---------------------------------------------------------------------------
const HERO_X = 2.0      // Cup sits on the right during Hero + Menu
const STORY_X = -2.5    // Cup moves to the left during Brand Story
const INITIAL_ROT_Y = -0.15

// ---------------------------------------------------------------------------
//  Main Component
// ---------------------------------------------------------------------------
export default function CoffeeCupHero() {
  const outerGroupRef = useRef()
  const tiltGroupRef = useRef()
  const innerGroupRef = useRef()

  // ---- Master GSAP Scroll Choreography ----
  useEffect(() => {
    if (typeof window === 'undefined') return

    let frameId = 0
    let storyTrigger = null
    let menuTrigger = null

    const waitForGSAP = () => {
      if (!window.gsap || !window.ScrollTrigger) {
        frameId = requestAnimationFrame(waitForGSAP)
        return
      }

      const gsap = window.gsap
      const ScrollTrigger = window.ScrollTrigger
      if (!outerGroupRef.current) return

      // Stage 2: Hero → Brand Story — cup slides RIGHT → LEFT + rotates 360°
      storyTrigger = ScrollTrigger.create({
        trigger: '#story-section',
        start: 'top bottom',
        end: 'top top',
        scrub: 1,
        onUpdate: (self) => {
          if (!outerGroupRef.current) return
          const p = self.progress
          outerGroupRef.current.position.x = gsap.utils.interpolate(HERO_X, STORY_X, p)
          
          if (innerGroupRef.current) {
            innerGroupRef.current.rotation.y = gsap.utils.interpolate(
              INITIAL_ROT_Y,
              INITIAL_ROT_Y + Math.PI * 2,
              p
            )
          }

          // Delay Y-movement for the first 30% of scroll so the cup waits below the Hero text
          // before smoothly rising to meet the Brand Story layout (Y=0 -> Y=1.0)
          const yProgress = p < 0.3 ? 0 : (p - 0.3) / 0.7
          outerGroupRef.current.position.y = gsap.utils.interpolate(0, 1.0, Math.pow(yProgress, 2))

          // Lock the native flat tilt for Hero/Story sections
          if (tiltGroupRef.current) {
            tiltGroupRef.current.rotation.x = 0.2
          }
        },
      })

      // Stage 3: Brand Story → Menu — cup slides LEFT → RIGHT + rotates another 360°
      menuTrigger = ScrollTrigger.create({
        trigger: '#menu-section',
        start: 'top bottom',
        end: 'top top',
        scrub: 1,
        onUpdate: (self) => {
          if (!outerGroupRef.current) return
          const p = self.progress
          outerGroupRef.current.position.x = gsap.utils.interpolate(STORY_X, HERO_X, p)
          
          if (innerGroupRef.current) {
            innerGroupRef.current.rotation.y = gsap.utils.interpolate(
              INITIAL_ROT_Y + Math.PI * 2,
              INITIAL_ROT_Y + Math.PI * 4,
              p
            )
          }

          // Animate the tilt angle (x-axis) of the cup specifically for the Menu section
          if (tiltGroupRef.current) {
            tiltGroupRef.current.rotation.x = gsap.utils.interpolate(0.2, 0.5, p)
          }
        },
      })
    }

    frameId = requestAnimationFrame(waitForGSAP)

    return () => {
      cancelAnimationFrame(frameId)
      storyTrigger?.kill()
      menuTrigger?.kill()
    }
  }, [])

  // ---- Cup profile (LatheGeometry) ----
  const { cupPoints, handleCurve } = useMemo(() => {
    const cPoints = []

    cPoints.push(new THREE.Vector2(0, 0))
    cPoints.push(new THREE.Vector2(0.4, 0))

    for (let i = 0; i <= 20; i++) {
      const angle = -Math.PI / 2 + (Math.PI / 2) * (i / 20)
      cPoints.push(new THREE.Vector2(
        0.4 + Math.cos(angle) * 1.0,
        1.55 + Math.sin(angle) * 1.55,
      ))
    }
    cPoints.push(new THREE.Vector2(1.4, 1.55))
    cPoints.push(new THREE.Vector2(1.36, 1.55))

    for (let i = 20; i >= 0; i--) {
      const angle = -Math.PI / 2 + (Math.PI / 2) * (i / 20)
      cPoints.push(new THREE.Vector2(
        0.4 + Math.cos(angle) * 0.92,
        1.48 + Math.sin(angle) * 1.45,
      ))
    }
    cPoints.push(new THREE.Vector2(0, 0.05))

    const hCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.38, 1.35, 0),
      new THREE.Vector3(1.65, 1.30, 0),
      new THREE.Vector3(1.85, 1.1, 0),
      new THREE.Vector3(1.82, 0.75, 0),
      new THREE.Vector3(1.4, 0.4, 0),
      new THREE.Vector3(0.9, 0.20, 0),
      new THREE.Vector3(0.4, 0.1, 0),
      new THREE.Vector3(0.20, 0.10, 0),
    ], false, 'centripetal')

    return { cupPoints: cPoints, handleCurve: hCurve }
  }, [])

  // ---- Procedural noise DataTexture for tri-planar ceramic bump ----
  const noiseTexture = useMemo(() => {
    const size = 512
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size * size * 4; i += 4) {
      const val = deterministicNoiseValue(i)
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
      data[i + 3] = 255
    }
    const tex = new THREE.DataTexture(data, size, size)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }, [])

  // ---- Logo CanvasTexture ----
  const logoTexture = useMemo(() => createLogoTexture(), [])

  // ---- Ceramic onBeforeCompile (tri-planar bump injection) ----
  const ceramicOnBeforeCompile = useMemo(
    () => createCeramicOnBeforeCompile(noiseTexture),
    [noiseTexture],
  )

  // ---- Ceramic material props (spec: metalness 0, roughness 0.1, ior 1.5) ----
  const ceramicProps = useMemo(() => ({
    color: '#FAF8F5',
    roughness: 0.1,
    metalness: 0,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
    envMapIntensity: 2.0,
    side: THREE.DoubleSide,
  }), [])

  // Proportional radius for the smaller cup
  const liquidRadius = 1.36
  const liquidY = 1.52

  return (
    <group ref={outerGroupRef} position={[HERO_X, 0, 0]}>
      {/* Tilt group establishes the mathematical coordinate frame exclusively for X/Z camera tilt */}
      <group ref={tiltGroupRef} scale={0.6} rotation={[0.2, 0, 0.25]}>
        {/* Inner group handles the clean local 360 Y-spin WITHOUT wobbling the container tilt */}
        <group ref={innerGroupRef} rotation={[0, INITIAL_ROT_Y, 0]}>
          <Center>
            <group position={[0, 0, 0]}>

            {/* Cup Body — LatheGeometry with tri-planar ceramic shader */}
            <mesh castShadow receiveShadow>
              <latheGeometry args={[cupPoints, 64]} />
              <meshPhysicalMaterial
                {...ceramicProps}
                onBeforeCompile={ceramicOnBeforeCompile}
              />

              {/* Decal: "caffenaline" logo projected onto the curved surface */}
	              <Decal
	                position={[0, 1.16, 1.36]}
	                rotation={[0.16, 0, 0]}
	                scale={[2.95, 0.76, 0.48]}
	              >
                <meshPhysicalMaterial
                  map={logoTexture}
                  transparent
                  depthWrite={false}
                  roughness={0.15}
                  metalness={0.1}
                  clearcoat={0.6}
                  clearcoatRoughness={0.1}
                  polygonOffset
                  polygonOffsetFactor={-1}
                />
              </Decal>
            </mesh>

            {/* Cup Handle — same tri-planar ceramic material for uniform texture */}
            <mesh castShadow receiveShadow scale={[1, 1, 0.75]}>
              <tubeGeometry args={[handleCurve, 64, 0.12, 32, false]} />
              <meshPhysicalMaterial
                {...ceramicProps}
                onBeforeCompile={ceramicOnBeforeCompile}
              />
            </mesh>

            {/* Solid interior volume to mask cup bottom */}
            <mesh position={[0, 0.7, 0]}>
              <cylinderGeometry args={[1.0, 0.45, 1.4, 32]} />
              <meshBasicMaterial color="#38220f" />
            </mesh>

            {/* GPGPU Physics-based Liquid Plane */}
            <CoffeeLiquid radius={liquidRadius} stirring={true} />

            {/* Stirring spoon */}
            <Spoon liquidY={liquidY} />

            </group>
          </Center>
        </group>
      </group>
    </group>
  )
}
