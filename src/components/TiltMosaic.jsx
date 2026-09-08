import { useEffect, useRef } from "react"

const MAX_DPR = 2
const HOVER_RATE = 6
const DRIFT_X = 0.34
const DRIFT_Y = 0.26
const DRIFT_RATE_X = 0.25
const DRIFT_RATE_Y = 0.39
const SLOPE_PEAK = 0.649519

function parseColor(input, fallback) {
  if (!input) return fallback
  const str = String(input).trim()

  if (str.charAt(0) === "#") {
    let hex = str.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255]
    }
    return fallback
  }

  const parts = str.match(/[\d.]+/g)
  if (parts && parts.length >= 3) {
    return [
      Math.min(255, parseFloat(parts[0])) / 255,
      Math.min(255, parseFloat(parts[1])) / 255,
      Math.min(255, parseFloat(parts[2])) / 255,
    ]
  }
  return fallback
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function num(v, fallback) {
  return typeof v === "number" && isFinite(v) ? v : fallback
}

const VERT_SRC = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uDpr;

uniform vec3  uBg;
uniform vec3  uBase;
uniform vec3  uAccent;
uniform vec2  uFocus;
uniform float uSpacing;
uniform float uHalf;
uniform float uRound;
uniform float uAmp;
uniform float uReach;
uniform float uGrain;

const vec3 LIGHT = vec3(-0.4879, 0.6505, 0.5817);
const vec3 VIEW  = vec3(0.0, 0.0, 1.0);
const float SHINE = 34.0;

float h21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float filmGrain(vec2 fragCoord, float t, float dpr) {
    vec2 cell = floor(fragCoord / max(dpr, 1.0));
    return h21(cell + floor(t * 24.0) * 13.7) - 0.5;
}

float roundedBox(vec2 q, float half_, float r) {
    vec2 d = abs(q) - vec2(half_ - r);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;

    vec2 p = vec2(uv.x * aspect, uv.y);
    float aa = 1.4 / uRes.y;

    vec2 c = (floor(p / uSpacing) + 0.5) * uSpacing;
    vec2 q = p - c;

    vec2 rv = c - uFocus;
    float d = length(rv);
    vec2 u = d > 1e-6 ? rv / d : vec2(0.0);
    float x = d / max(uReach, 1e-4);
    float denom = 1.0 + x * x;
    float slope = -2.0 * uAmp * x / (max(uReach, 1e-4) * denom * denom);
    vec3 n = normalize(vec3(-slope * u, 1.0));

    float sd = roundedBox(q, uHalf, uRound);

    float bevelWidth = max(uHalf * 0.22, aa * 2.0);
    float bev = smoothstep(-bevelWidth, 0.0, sd);
    vec2 outward = length(q) > 1e-6 ? normalize(q) : vec2(0.0);
    vec3 rim = normalize(vec3(outward * 1.25, 0.55));
    vec3 nn = normalize(mix(n, rim, bev * 0.85));

    vec3 halfVec = normalize(LIGHT + VIEW);
    float diff = clamp(dot(nn, LIGHT), 0.0, 1.0);
    float spec = pow(clamp(dot(nn, halfVec), 0.0, 1.0), SHINE);

    vec3 tile = uBase * (0.10 + 0.62 * diff) + uAccent * spec * 1.7;

    float cov = 1.0 - smoothstep(-aa, aa, sd);
    vec3 col = mix(uBg, tile, cov);

    col += (h21(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0);
    col += filmGrain(gl_FragCoord.xy, uTime, uDpr) * uGrain;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function compileShader(gl, type, src) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("TiltMosaic shader:", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export default function TiltMosaic(props) {
  const {
    background = "#06070A",
    baseColor = "#1700FF",
    accentColor = "#DDF2FF",
    density = 38,
    gap = 0,
    rounded = 100,
    tilt = 45,
    reach = 100,
    hover = 100,
    speed = 100,
    grain = 100,
    style,
  } = props

  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const propsRef = useRef(props)
  propsRef.current = props
  const pointerRef = useRef({ rawX: 0.5, rawY: 0.5, on: 0, onTarget: 0 })

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      preserveDrawingBuffer: false,
    })
    if (!gl) {
      console.error("TiltMosaic: WebGL unavailable")
      return
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("TiltMosaic link:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const loc = (name) => gl.getUniformLocation(program, name)
    const uRes = loc("uRes")
    const uTime = loc("uTime")
    const uDpr = loc("uDpr")
    const uBg = loc("uBg")
    const uBase = loc("uBase")
    const uAccent = loc("uAccent")
    const uFocus = loc("uFocus")
    const uSpacing = loc("uSpacing")
    const uHalf = loc("uHalf")
    const uRound = loc("uRound")
    const uAmp = loc("uAmp")
    const uReach = loc("uReach")
    const uGrain = loc("uGrain")

    let cssWidth = root.offsetWidth || 1
    let cssHeight = root.offsetHeight || 1
    const resizeObserver = new ResizeObserver(() => {
      cssWidth = root.offsetWidth || 1
      cssHeight = root.offsetHeight || 1
    })
    resizeObserver.observe(root)

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let raf = 0
    let last = performance.now()
    let clock = 0

    const render = (now) => {
      raf = requestAnimationFrame(render)

      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const p = propsRef.current
      const rate = reduceMotion ? 0 : clamp(num(p.speed, 50), 0, 100) / 50
      clock = (clock + dt * rate) % 3600

      const pointer = pointerRef.current
      pointer.on += (pointer.onTarget - pointer.on) * (1 - Math.exp(-HOVER_RATE * dt))

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const bufferWidth = Math.max(1, Math.round(cssWidth * dpr))
      const bufferHeight = Math.max(1, Math.round(cssHeight * dpr))
      if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
        canvas.width = bufferWidth
        canvas.height = bufferHeight
        gl.viewport(0, 0, bufferWidth, bufferHeight)
      }
      const aspect = bufferWidth / bufferHeight

      // Auto sweep: light moves left to right, up and down continuously
      const sweepX = aspect * (0.1 + 0.8 * ((Math.sin(clock * 0.4) + 1) / 2))
      const sweepY = 0.1 + 0.8 * ((Math.sin(clock * 0.25 + 2.0) + 1) / 2)
      const focusX = sweepX
      const focusY = sweepY

      const densityVal = Math.round(clamp(num(p.density, 22), 6, 60))
      const spacing = 1 / densityVal
      const half = (spacing * 0.5) * (1 - clamp(num(p.gap, 12), 0, 60) / 100)
      const reachVal = clamp(num(p.reach, 24), 5, 100) / 100

      const tiltRad = (clamp(num(p.tilt, 26), 0, 45) * Math.PI) / 180
      const amp = (Math.tan(tiltRad) * reachVal) / SLOPE_PEAK

      gl.uniform2f(uRes, bufferWidth, bufferHeight)
      gl.uniform1f(uTime, clock)
      gl.uniform1f(uDpr, dpr)

      const bg = parseColor(p.background, [0.024, 0.027, 0.039])
      const base = parseColor(p.baseColor, [0.322, 0.365, 0.475])
      const accent = parseColor(p.accentColor, [0.867, 0.949, 1.0])
      gl.uniform3f(uBg, bg[0], bg[1], bg[2])
      gl.uniform3f(uBase, base[0], base[1], base[2])
      gl.uniform3f(uAccent, accent[0], accent[1], accent[2])

      gl.uniform2f(
        uFocus,
        focusX,
        focusY
      )
      gl.uniform1f(uSpacing, spacing)
      gl.uniform1f(uHalf, half)
      gl.uniform1f(uRound, half * (clamp(num(p.rounded, 18), 0, 100) / 100))
      gl.uniform1f(uAmp, amp)
      gl.uniform1f(uReach, reachVal)
      gl.uniform1f(uGrain, (clamp(num(p.grain, 0), 0, 100) / 100) * 0.09)

      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const readPointer = (event) => {
      const rect = root.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const pointer = pointerRef.current
      pointer.rawX = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      pointer.rawY = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    }

    const readPointerWindow = (event) => {
      const rect = root.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const pointer = pointerRef.current
      pointer.rawX = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      pointer.rawY = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    }

    const onMove = (event) => {
      readPointerWindow(event)
      pointerRef.current.onTarget = 1
    }
    const onLeave = () => {
      pointerRef.current.onTarget = 0
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerenter", onMove)
    window.addEventListener("pointerleave", onLeave)
    window.addEventListener("blur", onLeave)

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerenter", onMove)
      window.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("blur", onLeave)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        isolation: "isolate",
        background,
        touchAction: "none",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          filter: "blur(3px)",
        }}
      />
    </div>
  )
}
