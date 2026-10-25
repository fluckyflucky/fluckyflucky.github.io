<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ home?: boolean }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let quadBuffer: WebGLBuffer | null = null
let rafId = 0
let lastFrame = 0
let startTime = 0
let elapsedSeconds = 0
let pointerTarget: [number, number] = [-2, -2]
let pointerCurrent: [number, number] = [-2, -2]
let reducedMotion: MediaQueryList | null = null
let resizeObserver: ResizeObserver | null = null
let disposed = false
const rippleData = new Float32Array(6 * 4)
let rippleIndex = 0
let lastRippleAt = -1000

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float homeWater;
uniform vec4 ripples[6];

// Analytic slope and curvature avoid unstable pixel-sized finite differences.
void wave(inout vec2 slope, inout vec3 bend, vec2 p, vec2 direction,
          float frequency, float amplitude, float phase) {
  vec2 k = normalize(direction) * frequency;
  float angle = dot(p, k) + phase;
  slope += amplitude * k * cos(angle);
  bend -= amplitude * vec3(k.x*k.x, k.x*k.y, k.y*k.y) * sin(angle);
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

void renderHomeWater() {
  float aspect = resolution.x / resolution.y;
  float t = time * .32;
  vec2 p = uv * vec2(aspect, 1.0) * 2.8;
  vec2 slope = vec2(0.0);
  vec3 bend = vec3(0.0);
  // Broad waves carry the surface. Capillary detail affects reflection only:
  // it must not dominate the curvature used for the bed illumination.
  wave(slope, bend, p, vec2(1., .37), 6.3, .012, t * .83);
  wave(slope, bend, p, vec2(-.62, 1.), 10.7, .006, -t * .71 + 1.4);
  wave(slope, bend, p, vec2(.73, .68), 15.1, .003, t * 1.1 + 2.3);
  vec3 bedBend = bend;
  wave(slope, bend, p, vec2(-1., .23), 21.3, .00065, -t * 1.23 + .8);
  wave(slope, bend, p, vec2(.21, -1.), 33.1, .00022, t * 1.4 + 4.1);

  // Finite, expanding wave packets persist briefly after the pointer leaves.
  for (int i = 0; i < 6; i++) {
    float age = time - ripples[i].z;
    vec2 delta = (uv - ripples[i].xy) * vec2(aspect, 1.0) * 2.8;
    float radius = length(delta);
    float travel = radius - age * .48;
    float envelope = exp(-travel * travel * 14.0) * exp(-max(age, 0.0) * 1.1);
    float phase = travel * 24.0;
    float derivative = (24.0 * cos(phase) - 28.0 * travel * sin(phase)) * envelope;
    slope += delta / max(radius, .04) * derivative * ripples[i].w * step(0.0, age);
  }
  vec3 normal = normalize(vec3(-slope, 1.0));
  vec3 view = normalize(vec3((.40 - uv.x) * aspect * .80, -.50 - uv.y * .70, 1.10));
  vec3 reflected = reflect(-view, normal);
  vec3 transmitted = refract(-view, normal, 1.0 / 1.333);
  float fresnel = .0204 + .9796 * pow(1.0 - max(dot(view, normal), 0.0), 5.0);
  float depth = .65 + .18 * bedNoise(p * .7);
  vec2 bed = p + transmitted.xy * depth / max(-transmitted.z, .2);
  float sand = bedNoise(bed * 80.0);
  vec3 transmittance = exp(-vec3(2.6, .85, .60) * depth / max(-transmitted.z, .2));
  vec3 bottom = vec3(.008, .033, .042) * (.94 + sand * .12);
  float determinant = (1.0 + bedBend.x * .85) * (1.0 + bedBend.z * .85) - bedBend.y * bedBend.y * .7225;
  float caustic = min(1.0 / (abs(determinant) + .28), 2.4);

  // A canopy enters from the left. Broad clusters leave open, sunlit water.
  vec2 shadeUV = uv * vec2(aspect, 1.0) + slope * .22;
  shadeUV += vec2(sin(t * .25 + uv.y * 3.0), cos(t * .19)) * .009;
  float canopy = bedNoise(shadeUV * 5.0 + vec2(2.7, 1.3));
  float leaves = bedNoise(shadeUV * 36.0) * .65 + bedNoise(shadeUV * 71.0) * .35;
  float reach = 1.0 - smoothstep(.10, .85, shadeUV.x + shadeUV.y * .20);
  float foliage = smoothstep(.40, .66, canopy * .55 + leaves * .45) * reach;
  float branches = branchShadow(shadeUV, vec2(-.08, .14), vec2(.39, .72), .009);
  branches = max(branches, branchShadow(shadeUV, vec2(.10, .36), vec2(.46, .43), .004));
  branches = max(branches, branchShadow(shadeUV, vec2(.22, .52), vec2(.14, .94), .003));
  float shade = clamp(foliage * .76 + branches * .26 * reach, 0.0, .8);
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
  water *= exp(-shade * 2.0);

  // Finite solar disc, broadened by the pixel footprint to avoid unstable pinpricks.
  vec3 sun = normalize(vec3(.75, .65, 1.10));
  float alignment = max(dot(reflected, sun), 0.0);
  float footprint = 2.8 / max(resolution.y, 1.0);
  float exponent = min(1800.0, 1.0 / (footprint * footprint * 32.0));
  float glint = pow(alignment, exponent);
  float halo = pow(alignment, 80.0);
  water += vec3(.90, 1.0, 1.04) * (glint * 4.5 + halo * .065) * fresnel * (1.0 - shade);
  // Lighting is combined in linear space before display conversion.
  gl_FragColor = vec4(pow(max(water, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}

void main() {
  if (homeWater > .5) { renderHomeWater(); return; }
  float aspect = resolution.x / resolution.y;
  float t = time * .16;
  vec2 p = uv * vec2(aspect, 1.0) * 2.2;
  float hand = exp(-distance(uv, pointer) * 3.8);
  p += hand * vec2(.24, -.18);
  p += .12 * vec2(sin(p.y * 1.5 + t * .3), cos(p.x * 1.3 - t * .24));
  p += .035 * vec2(cos(p.x * 3.4 + p.y * 1.8 - t * .3), sin(p.y * 3.2 - p.x * 1.9 + t * .25));
  vec2 slope = vec2(0.0);
  vec3 bend = vec3(0.0);
  wave(slope, bend, p, vec2(1., .37), 4.2, .004, t * .58);
  wave(slope, bend, p, vec2(-.62, 1.), 6.1, .0025, -t * .47 + 1.4);
  wave(slope, bend, p, vec2(.73, .68), 9.4, .0010, t * .68 + 2.3);
  wave(slope, bend, p, vec2(-1., .23), 24.3, .00012, -t * .8 + .8);
  wave(slope, bend, p, vec2(.21, -1.), 39.1, .00006, t * .9 + 4.1);
  vec3 normal = normalize(vec3(-slope * 2.0, 1.0));
  float reflection = pow(max(dot(normal, normalize(vec3(-.3, .42, 1.0))), 0.0), 10.0);
  float flow = .5 + .5 * sin(p.x * .56 + p.y * .38 + sin(p.y * .75 - t * .22) * .32 - t * .14);
  float texture = .5 + .5 * sin(p.x * 116.0 + sin(p.y * 91.0 + t * .06) * 1.8) * sin(p.y * 128.0 - p.x * 37.0);
  vec3 deep = vec3(.047, .16, .20);
  vec3 blue = vec3(.063, .235, .28);
  vec3 water = mix(deep, blue, .12 + flow * .22);
  water += vec3(.025, .065, .07) * reflection * .12;
  water += vec3(.002, .007, .008) * (texture - .5);
  gl_FragColor = vec4(water, 1.0);
}`

function compileShader(context: WebGLRenderingContext, type: number, source: string) {
  const shader = context.createShader(type)
  if (!shader) return null
  context.shaderSource(shader, source)
  context.compileShader(shader)
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    context.deleteShader(shader)
    return null
  }
  return shader
}

function initialize() {
  const el = canvas.value
  if (!el) return false
  gl = el.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' })
  if (!gl) return false
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    return false
  }
  program = gl.createProgram()
  if (!program) return false
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
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
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  fallback.value = false
  return true
}

function resize() {
  if (!canvas.value || !gl || !program) return
  const ratio = Math.min(window.devicePixelRatio || 1, 1) * (props.home ? .9 : .66)
  canvas.value.width = Math.max(1, Math.round(window.innerWidth * ratio))
  canvas.value.height = Math.max(1, Math.round(window.innerHeight * ratio))
  gl.viewport(0, 0, canvas.value.width, canvas.value.height)
  if (!program) return
  const resolutionLocation = gl.getUniformLocation(program, 'resolution')
  if (resolutionLocation) gl.uniform2f(resolutionLocation, canvas.value.width, canvas.value.height)
  if (reducedMotion?.matches) drawStatic()
}

function drawAt(seconds: number) {
  if (!gl || !program || !canvas.value) return
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(program)
  gl.uniform1f(gl.getUniformLocation(program, 'time'), seconds)
  gl.uniform1f(gl.getUniformLocation(program, 'homeWater'), props.home ? 1 : 0)
  gl.uniform4fv(gl.getUniformLocation(program, 'ripples[0]'), rippleData)
  const pointerLocation = gl.getUniformLocation(program, 'pointer')
  if (pointerLocation) gl.uniform2f(pointerLocation, pointerCurrent[0], pointerCurrent[1])
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function drawStatic() {
  drawAt(0)
}

function tick(now: number) {
  rafId = 0
  if (disposed || document.hidden || reducedMotion?.matches) return
  if (now - lastFrame >= 1000 / 30) {
    lastFrame = now
    pointerCurrent[0] += (pointerTarget[0] - pointerCurrent[0]) * 0.05
    pointerCurrent[1] += (pointerTarget[1] - pointerCurrent[1]) * 0.05
    drawAt(elapsedSeconds + (now - startTime) / 1000)
  }
  rafId = requestAnimationFrame(tick)
}

function start() {
  if (disposed || document.hidden || reducedMotion?.matches || rafId || !gl || !program) return
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
  pointerTarget = [-2, -2]
  pointerCurrent = [-2, -2]
  rippleData.fill(0)
  if (reducedMotion?.matches) drawStatic()
  else start()
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || reducedMotion?.matches) return
  const next: [number, number] = [event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight]
  const distance = Math.hypot(next[0] - pointerTarget[0], next[1] - pointerTarget[1])
  const now = performance.now()
  if (props.home && now - lastRippleAt > 100 && distance > .002) {
    const seconds = elapsedSeconds + (rafId ? (now - startTime) / 1000 : 0)
    rippleData.set([next[0], next[1], seconds, Math.min(.004, .002 + distance * .02)], rippleIndex * 4)
    rippleIndex = (rippleIndex + 1) % 6
    lastRippleAt = now
  }
  pointerTarget = next
}

function handleContextLost(event: Event) {
  event.preventDefault()
  stop()
  fallback.value = true
  gl = null
  program = null
}

function handleContextRestored() {
  if (initialize()) {
    resize()
    handleVisibility()
  } else {
    fallback.value = true
  }
}

watch(() => props.home, () => {
  rippleData.fill(0)
  resize()
})

onMounted(() => {
  if (!initialize()) fallback.value = true
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', handleMotionChange)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('resize', resize, { passive: true })
  canvas.value?.addEventListener('webglcontextlost', handleContextLost)
  canvas.value?.addEventListener('webglcontextrestored', handleContextRestored)
  if (canvas.value) resizeObserver = new ResizeObserver(resize), resizeObserver.observe(document.documentElement)
  resize()
  if (reducedMotion.matches) drawStatic()
  else start()
})

onUnmounted(() => {
  disposed = true
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
  <canvas ref="canvas" class="liquid-water" :class="{ 'liquid-water-fallback': fallback }" aria-hidden="true" />
</template>

<style scoped>
.liquid-water { position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%; pointer-events: none; background: #0c2933; }
.liquid-water-fallback { background: linear-gradient(166deg, #0c2933, #103c48 76%, #0d303b); }
</style>
