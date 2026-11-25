<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)
const ready = ref(false)
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let quadBuffer: WebGLBuffer | null = null
let rafId = 0
let initIdleId = 0
let initTimerId = 0
let linkRafId = 0
let loadHandler: (() => void) | null = null
let lastFrame = 0
let startTime = 0
let elapsedSeconds = 0
let lastWidth = 0
let lastHeight = 0
let currentAspect = 1
let reducedMotion: MediaQueryList | null = null
let resizeObserver: ResizeObserver | null = null
let disposed = false
const MAX_RIPPLES = 20
const MAX_WATER_PIXELS = 1280 * 720
let rippleCapacity = MAX_RIPPLES
const rippleData = new Float32Array(MAX_RIPPLES * 4)
const packedRipples = new Float32Array(MAX_RIPPLES * 4)
let packedUpload = packedRipples
let rippleOrigin: [number, number] = [-2, -2]
let rippleIndex = 0
let lastRippleAt = -1000
let lastRippleSeconds = -10
let uniforms: Record<'aspect' | 'sunExponent' | 'time' | 'rippleCount' | 'ripples', WebGLUniformLocation | null> | null = null

const vertexSource = `
attribute vec2 position;
uniform float aspect;
varying vec2 uv;
varying vec2 uvAspect;
varying vec2 worldPos;
void main() {
  uv = position * 0.5 + 0.5;
  uvAspect = uv * vec2(aspect, 1.0);
  worldPos = uvAspect * 2.8;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
varying vec2 uvAspect;
varying vec2 worldPos;
uniform float time;
uniform float sunExponent;
uniform int rippleCount;
uniform vec4 ripples[RIPPLE_CAPACITY];

// Analytic slope and curvature avoid unstable pixel-sized finite differences.
void wave(inout vec2 slope, inout vec3 bend, vec2 p, vec2 direction,
          float frequency, float amplitude, float phase) {
  vec2 k = normalize(direction) * frequency;
  float angle = dot(p, k) + phase;
  slope += amplitude * k * cos(angle);
  bend -= amplitude * vec3(k.x*k.x, k.x*k.y, k.y*k.y) * sin(angle);
}

void capillaryWave(inout vec2 slope, vec2 p, vec2 direction,
                   float frequency, float amplitude, float phase) {
  vec2 k = normalize(direction) * frequency;
  slope += amplitude * k * cos(dot(p, k) + phase);
}

float bedNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec3 k = vec3(127.1, 311.7, 43758.5453);
  float a = fract(sin(dot(cell, k.xy)) * k.z);
  float b = fract(sin(dot(cell + vec2(1., 0.), k.xy)) * k.z);
  float c = fract(sin(dot(cell + vec2(0., 1.), k.xy)) * k.z);
  float d = fract(sin(dot(cell + vec2(1., 1.), k.xy)) * k.z);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float branchShadow(vec2 p, vec2 a, vec2 b, float width) {
  vec2 segment = b - a;
  float along = clamp(dot(p - a, segment) / dot(segment, segment), 0.0, 1.0);
  return 1.0 - smoothstep(width, width + .024, length(p - a - segment * along));
}

void main() {
  float t = time * .32;
  vec2 p = worldPos;
  vec2 slope = vec2(0.0);
  vec3 bend = vec3(0.0);
  // Broad waves carry the surface. Capillary detail affects reflection only:
  // it must not dominate the curvature used for the bed illumination.
  wave(slope, bend, p, vec2(1., .37), 6.3, .012, t * .83);
  wave(slope, bend, p, vec2(-.62, 1.), 10.7, .006, -t * .71 + 1.4);
  wave(slope, bend, p, vec2(.73, .68), 15.1, .003, t * 1.1 + 2.3);
  vec3 bedBend = bend;
  capillaryWave(slope, p, vec2(-1., .23), 21.3, .00065, -t * 1.23 + .8);
  capillaryWave(slope, p, vec2(.21, -1.), 33.1, .00022, t * 1.4 + 4.1);
  // Resting water stays below the slope needed to reflect the sun into the eye.
  slope *= .20;
  bedBend *= .20;
  float surfaceHeight = 0.0;

  // Finite, expanding wave packets persist briefly after the pointer leaves.
  if (rippleCount > 0) {
    for (int i = 0; i < RIPPLE_CAPACITY; i++) {
      if (i >= rippleCount) break;
      vec4 r = ripples[i];
      vec2 delta = p - r.xy;
      float distSq = dot(delta, delta);
      float maxR = r.z + 0.85;
      if (distSq > maxR * maxR) continue;
      // A smooth radial height field has no cusp at the point of contact.
      float radius = sqrt(distSq + .0025);
      float travel = radius - r.z;
      if (abs(travel) > 0.85) continue;
      float amplitude = exp(-travel * travel * 10.0) * r.w;
      float phase = travel * 18.0;
      float s = sin(phase);
      float c = cos(phase);
      float derivative = (18.0 * c - 20.0 * travel * s) * amplitude;
      float secondDerivative = ((400.0 * travel * travel - 344.0) * s - 720.0 * travel * c) * amplitude;
      vec2 radial = delta / radius;
      surfaceHeight += s * amplitude;
      slope += radial * derivative;
      // Hessian of the same radial height field: curved wave flanks focus and
      // spread transmitted light, including where the solar glint is not visible.
      vec3 outer = vec3(radial.x * radial.x, radial.x * radial.y, radial.y * radial.y);
      vec3 curvature = outer * secondDerivative + (vec3(1.0, 0.0, 1.0) - outer) * derivative / radius;
      bedBend += curvature * .25;
    }
  }
  vec3 normal = normalize(vec3(-slope, 1.0));
  // A distant, near-overhead eye keeps the reflection angle similar across
  // the viewport. The previous wide-angle eye confined sunlight to one corner.
  vec3 view = normalize(vec3(0.0, -.36, 1.35));
  vec3 reflected = reflect(-view, normal);
  vec3 transmitted = refract(-view, normal, 1.0 / 1.333);
  float om = 1.0 - max(dot(view, normal), 0.0);
  float om2 = om * om;
  float fresnel = .0204 + .9796 * om2 * om2 * om;
  float depth = .65 + .18 * bedNoise(p * .7) + surfaceHeight;
  float rayLen = depth / max(-transmitted.z, .2);
  vec2 bed = p + transmitted.xy * rayLen;
  float sand = bedNoise(bed * 80.0);
  vec3 transmittance = exp(-vec3(2.6, .85, .60) * rayLen);
  vec3 bottom = vec3(.008, .033, .042) * (.94 + sand * .12);
  float determinant = (1.0 + bedBend.x * .85) * (1.0 + bedBend.z * .85) - bedBend.y * bedBend.y * .7225;
  float caustic = min(1.0 / (abs(determinant) + .28), 2.4);

  // A canopy enters from the left. Broad clusters leave open, sunlit water.
  vec2 shadeUV = uvAspect + slope * .22;
  shadeUV += vec2(sin(t * .25 + uv.y * 3.0), cos(t * .19)) * .009;
  float reach = 1.0 - smoothstep(.10, .85, shadeUV.x + shadeUV.y * .20);
  float shade = 0.0;
  if (reach > 0.0) {
    float canopy = bedNoise(shadeUV * 5.0 + vec2(2.7, 1.3));
    float leaves = bedNoise(shadeUV * 36.0) * .65 + bedNoise(shadeUV * 71.0) * .35;
    float foliage = smoothstep(.40, .66, canopy * .55 + leaves * .45) * reach;
    float branches = branchShadow(shadeUV, vec2(-.08, .14), vec2(.39, .72), .009);
    branches = max(branches, branchShadow(shadeUV, vec2(.10, .36), vec2(.46, .43), .004));
    branches = max(branches, branchShadow(shadeUV, vec2(.22, .52), vec2(.14, .94), .003));
    shade = clamp(foliage * .76 + branches * .26 * reach, 0.0, .8);
  }
  bottom *= (1.0 - shade * .62) * (.66 + caustic * .34);
  vec3 underwater = bottom * transmittance + vec3(.003, .014, .019) * (1.0 - transmittance);
  float focusedLight = smoothstep(1.15, 2.4, caustic);
  underwater += vec3(.006, .024, .027) * focusedLight * (1.0 - shade) * transmittance;

  // Sample a soft sky in reflection space, not as a moving screen overlay.
  vec2 skyUV = reflected.xy / max(reflected.z + .4, .2);
  float cloud = bedNoise(skyUV * 5.0 + vec2(3.2, 1.7)) * .65;
  cloud += bedNoise(skyUV * 11.0 + vec2(1.0, 4.0)) * .35;
  cloud = smoothstep(.42, .70, cloud);
  vec3 sky = mix(vec3(.035, .15, .24), vec3(.10, .28, .38), cloud);
  vec3 water = mix(underwater, sky, fresnel);
  // Preserve canopy contrast after the sky/volume fill and display conversion.
  if (shade > 0.0) water *= exp(-shade * 2.0);

  // Sunlight uses the same normal as refraction and sky reflection, including
  // pointer waves. Separate high-frequency normals made the glints look striped.
  // Off-axis illumination: an undisturbed plane misses the solar reflection.
  // Passing wave slopes catch it on one flank, rather than lighting entire rings.
  vec3 sun = normalize(vec3(.16, .46, 1.35));
  float alignment = max(dot(reflected, sun), 0.0);
  if (alignment > 0.97 && shade < 0.999) {
    float glint = pow(alignment, sunExponent);
    float sunlight = glint * 3.6 * fresnel * (1.0 - shade);
    water += vec3(.98, 1.0, .96) * sunlight / (1.0 + sunlight * 1.5);
  }
  // Lighting is combined in linear space before display conversion.
  gl_FragColor = vec4(pow(max(water, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`

function createShader(context: WebGLRenderingContext, type: number, source: string) {
  const shader = context.createShader(type)
  if (!shader) return null
  context.shaderSource(shader, source)
  context.compileShader(shader)
  return shader
}

function finishSetup(vs: WebGLShader, fs: WebGLShader) {
  if (disposed || !gl || !program) return false
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    program = null
    return false
  }
  quadBuffer = gl.createBuffer()
  if (!quadBuffer) return false
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.useProgram(program)
  // Locations belong to the linked program; rebuild them after context restoration.
  uniforms = {
    aspect: gl.getUniformLocation(program, 'aspect'),
    sunExponent: gl.getUniformLocation(program, 'sunExponent'),
    time: gl.getUniformLocation(program, 'time'),
    rippleCount: gl.getUniformLocation(program, 'rippleCount'),
    ripples: gl.getUniformLocation(program, 'ripples[0]'),
  }
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  fallback.value = false
  resize()
  if (reducedMotion?.matches) {
    drawStatic()
  } else {
    drawAt(elapsedSeconds)
    lastFrame = performance.now()
    start()
  }
  ready.value = true
  return true
}

function initialize() {
  const el = canvas.value
  if (!el) return false
  gl = el.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
  if (!gl) return false
  lastWidth = 0
  lastHeight = 0
  // Leave room for the other uniforms on implementations with smaller budgets.
  rippleCapacity = Math.max(1, Math.min(MAX_RIPPLES, gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) - 8))
  packedUpload = packedRipples.subarray(0, rippleCapacity * 4)
  rippleIndex = 0
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource.replaceAll('RIPPLE_CAPACITY', String(rippleCapacity)))
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    return false
  }
  program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return false
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  const parallelCompile = gl.getExtension('KHR_parallel_shader_compile')
  if (parallelCompile) {
    const context = gl
    const prog = program
    const poll = () => {
      linkRafId = 0
      if (disposed || gl !== context || program !== prog) return
      if (!context.getProgramParameter(prog, parallelCompile.COMPLETION_STATUS_KHR)) {
        linkRafId = requestAnimationFrame(poll)
        return
      }
      if (!finishSetup(vs, fs)) fallback.value = true
    }
    linkRafId = requestAnimationFrame(poll)
    return true
  }

  return finishSetup(vs, fs)
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function resize() {
  if (!canvas.value || !gl || !program || !uniforms) return
  const ratio = Math.min(window.devicePixelRatio || 1, 1) * .8
  let width = Math.max(1, Math.round(window.innerWidth * ratio))
  let height = Math.max(1, Math.round(window.innerHeight * ratio))
  const pixels = width * height
  if (pixels > MAX_WATER_PIXELS) {
    const scale = Math.sqrt(MAX_WATER_PIXELS / pixels)
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }
  if (width === lastWidth && height === lastHeight) return
  lastWidth = width
  lastHeight = height
  // Reassigning even an unchanged canvas dimension reallocates its drawing buffer.
  if (canvas.value.width !== width) canvas.value.width = width
  if (canvas.value.height !== height) canvas.value.height = height
  gl.viewport(0, 0, width, height)
  currentAspect = width / height
  gl.uniform1f(uniforms.aspect, currentAspect)
  const footprint = 2.8 / Math.max(height, 1)
  gl.uniform1f(uniforms.sunExponent, Math.min(1800, 1 / (footprint * footprint * 20)))
  if (reducedMotion?.matches) drawStatic()
}

function drawAt(seconds: number) {
  if (!gl || !program || !canvas.value || !uniforms) return
  // This context is private; the opaque fullscreen quad overwrites every pixel.
  gl.uniform1f(uniforms.time, seconds)
  let activeCount = 0
  if (seconds - lastRippleSeconds < 2.35) {
    for (let i = 0; i < rippleCapacity; i++) {
      const src = i * 4
      const strength = rippleData[src + 3]
      if (strength <= 0) continue
      const age = seconds - rippleData[src + 2]
      if (age <= 0 || age >= 2.3) continue
      const decayedAmp = strength * Math.exp(-age * .85) * smoothstep(0, .10, age) * (1 - smoothstep(1.5, 2.3, age))
      if (decayedAmp <= 0) continue
      const dst = activeCount * 4
      packedRipples[dst] = rippleData[src] * currentAspect * 2.8
      packedRipples[dst + 1] = rippleData[src + 1] * 2.8
      packedRipples[dst + 2] = age * .384
      packedRipples[dst + 3] = decayedAmp
      activeCount++
    }
  }
  gl.uniform1i(uniforms.rippleCount, activeCount)
  if (activeCount > 0) {
    gl.uniform4fv(uniforms.ripples, packedUpload)
  }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function drawStatic() {
  drawAt(0)
}

function tick(now: number) {
  rafId = 0
  if (disposed || document.hidden || reducedMotion?.matches) return
  if (now - lastFrame >= 30) {
    lastFrame = now
    drawAt(elapsedSeconds + (now - startTime) / 1000)
  }
  rafId = requestAnimationFrame(tick)
}

function start() {
  if (disposed || document.hidden || reducedMotion?.matches || rafId || !gl || !program || !uniforms) return
  startTime = performance.now()
  rafId = requestAnimationFrame(tick)
}

function stop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    elapsedSeconds += (performance.now() - startTime) / 1000
  }
  rafId = 0
}

function handleVisibility() {
  if (document.hidden) stop()
  else if (reducedMotion?.matches) drawStatic()
  else start()
}

function handleMotionChange() {
  stop()
  rippleData.fill(0)
  rippleOrigin = [-2, -2]
  lastRippleSeconds = -10
  if (reducedMotion?.matches) drawStatic()
  else start()
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || reducedMotion?.matches || !uniforms) return
  const x = event.clientX / window.innerWidth
  const y = 1 - event.clientY / window.innerHeight
  const hasOrigin = rippleOrigin[0] >= 0
  const distance = hasOrigin ? Math.hypot((x - rippleOrigin[0]) * window.innerWidth / window.innerHeight, y - rippleOrigin[1]) : 0
  const now = performance.now()
  // Measure travel since the last emitted packet, not the last DOM event.
  // Fade within one buffer cycle even on devices with fewer uniform slots.
  const interval = Math.max(50, 2300 / rippleCapacity)
  if (now - lastRippleAt >= interval && (!hasOrigin || distance > .003)) {
    const seconds = elapsedSeconds + (rafId ? (now - startTime) / 1000 : 0)
    const offset = rippleIndex * 4
    rippleData[offset] = x
    rippleData[offset + 1] = y
    rippleData[offset + 2] = seconds
    rippleData[offset + 3] = Math.min(.0072, (.0055 + distance * .024) * .8)
    rippleIndex = (rippleIndex + 1) % rippleCapacity
    lastRippleAt = now
    lastRippleSeconds = seconds
    rippleOrigin[0] = x
    rippleOrigin[1] = y
  }
}

function handleContextLost(event: Event) {
  event.preventDefault()
  if (linkRafId) {
    cancelAnimationFrame(linkRafId)
    linkRafId = 0
  }
  stop()
  ready.value = false
  fallback.value = true
  gl = null
  program = null
  uniforms = null
  lastWidth = 0
  lastHeight = 0
}

function handleContextRestored() {
  if (!initialize()) {
    fallback.value = true
  }
}

function boot() {
  if (disposed) return
  if (!initialize()) fallback.value = true
}

function scheduleBoot() {
  if (disposed || initIdleId || initTimerId) return
  if (typeof window.requestIdleCallback === 'function') {
    initIdleId = window.requestIdleCallback(() => {
      initIdleId = 0
      boot()
    }, { timeout: 250 })
  } else {
    initTimerId = globalThis.setTimeout(() => {
      initTimerId = 0
      boot()
    }, 80)
  }
}

onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('resize', resize, { passive: true })
  canvas.value?.addEventListener('webglcontextlost', handleContextLost)
  canvas.value?.addEventListener('webglcontextrestored', handleContextRestored)
  if (canvas.value) resizeObserver = new ResizeObserver(resize), resizeObserver.observe(canvas.value)
  if (document.readyState === 'complete') {
    scheduleBoot()
  } else {
    loadHandler = () => {
      loadHandler = null
      scheduleBoot()
    }
    window.addEventListener('load', loadHandler, { once: true })
  }
})

onUnmounted(() => {
  disposed = true
  if (loadHandler) {
    window.removeEventListener('load', loadHandler)
    loadHandler = null
  }
  if (initIdleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(initIdleId)
  if (initTimerId) clearTimeout(initTimerId)
  if (linkRafId) cancelAnimationFrame(linkRafId)
  stop()
  resizeObserver?.disconnect()
  reducedMotion?.removeEventListener('change', handleMotionChange)
  document.removeEventListener('visibilitychange', handleVisibility)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('resize', resize)
  canvas.value?.removeEventListener('webglcontextlost', handleContextLost)
  canvas.value?.removeEventListener('webglcontextrestored', handleContextRestored)
  if (gl && quadBuffer) gl.deleteBuffer(quadBuffer)
  if (gl && program) gl.deleteProgram(program)
})
</script>

<template>
  <canvas ref="canvas" class="liquid-water" :class="{ ready, 'liquid-water-fallback': fallback }" aria-hidden="true" />
</template>

<style scoped>
.liquid-water { position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%; pointer-events: none; background: #0c2933; opacity: 0; transition: opacity .25s ease; }
.liquid-water.ready { opacity: 1; }
.liquid-water-fallback { opacity: 1; background: linear-gradient(166deg, #0c2933, #103c48 76%, #0d303b); }
</style>
