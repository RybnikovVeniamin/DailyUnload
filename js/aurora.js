/**
 * Aurora shader for first poster — flowing curtains of light.
 * Based on aurora-preset.json from shader-tool.pages.dev.
 * Colors come from poster palette (getStableGradientData).
 */

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform float u_scale;
uniform float u_height;
uniform float u_curtains;
uniform float u_shimmer;
uniform float u_intensity;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_bgColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;
  float t = u_time * u_speed;

  vec2 center = vec2(aspect * 0.5, 0.5);
  uv = center + (uv - center) / u_scale;

  vec3 skyTop = u_bgColor + vec3(0.02, 0.01, 0.04);
  vec3 sky = mix(u_bgColor, skyTop, uv.y);

  float stars = pow(snoise(gl_FragCoord.xy * 0.35) * 0.5 + 0.5, 22.0) * 0.8;
  sky += vec3(stars);

  float aurora = 0.0;
  float colorMix = 0.0;

  for (float i = 0.0; i < 5.0; i++) {
    if (i >= u_curtains) break;
    float offset = i * 1.3;
    float freq = 1.5 + i * 0.4;

    float wave = snoise(vec2(uv.x * freq + t * 0.3 + offset, t * 0.15 + i)) * 0.15;
    wave += snoise(vec2(uv.x * freq * 2.0 - t * 0.2 + offset, t * 0.1 + i * 3.0)) * 0.08;

    float curtainCenter = u_height + wave + i * 0.06;

    float dist = uv.y - curtainCenter;
    float curtain = smoothstep(0.3, 0.0, abs(dist)) * smoothstep(-0.02, 0.05, dist);

    float shimmer = snoise(vec2(uv.x * 15.0 + i * 5.0, uv.y * 3.0 + t * u_shimmer)) * 0.5 + 0.5;
    shimmer = pow(shimmer, 2.0);
    curtain *= 0.6 + 0.4 * shimmer;

    float edgeFade = snoise(vec2(uv.x * 0.8 + t * 0.05 + i, i * 2.0)) * 0.5 + 0.5;
    curtain *= smoothstep(0.0, 0.3, edgeFade);

    aurora += curtain * (1.0 / (1.0 + i * 0.3));
    colorMix += curtain * (i / u_curtains);
  }

  aurora = clamp(aurora * u_intensity, 0.0, 1.0);
  colorMix = clamp(colorMix, 0.0, 1.0);

  vec3 auroraCol = mix(u_color1, u_color2, colorMix);
  auroraCol = mix(auroraCol, u_color3, pow(aurora, 2.5) * 0.6);

  vec3 col = sky + auroraCol * aurora;

  if (uv.y < 0.15) {
    float ref = (0.15 - uv.y) / 0.15;
    col += auroraCol * aurora * ref * 0.15;
  }

  gl_FragColor = vec4(col, 0.95);
}
`;

const staticFragmentSource = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_seed;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;
uniform vec2 u_glow1Pos;
uniform vec2 u_glow2Pos;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  vec3 skyTop = u_bgColor + vec3(0.02, 0.01, 0.04);
  vec3 sky = mix(u_bgColor, skyTop, uv.y);

  float stars = pow(snoise(gl_FragCoord.xy * 0.35 + u_seed * 10.0) * 0.5 + 0.5, 22.0) * 0.8;
  sky += vec3(stars);

  float d1 = length(uv - u_glow1Pos);
  float noiseWarp1 = snoise(uv * 3.0 + u_seed) * 0.12;
  float glow1 = smoothstep(0.65, 0.0, d1 + noiseWarp1);
  glow1 *= snoise(uv * 4.0 + u_seed * 2.0) * 0.25 + 0.75;

  float d2 = length(uv - u_glow2Pos);
  float noiseWarp2 = snoise(uv * 2.5 - u_seed * 1.5) * 0.12;
  float glow2 = smoothstep(0.55, 0.0, d2 + noiseWarp2);
  glow2 *= snoise(uv * 3.5 - u_seed * 3.0) * 0.25 + 0.75;

  vec3 col = sky;
  col += u_color1 * pow(glow1, 1.5) * 0.7;
  col += u_color2 * pow(glow2, 1.5) * 0.6;

  float edge = smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x)
             * smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
  col *= 0.4 + 0.6 * edge;

  vec2 grainUV = floor(uv * 200.0);
  float grain = (hash(grainUV + u_seed) - 0.5) * 0.28;
  col += vec3(grain);

  gl_FragColor = vec4(col, 0.95);
}
`;

function buildProgram(gl, fragSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertexShaderSource);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.warn('Vertex shader:', gl.getShaderInfoLog(vs));
    return null;
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragSource);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.warn('Fragment shader:', gl.getShaderInfoLog(fs));
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function setupQuad(gl) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);
  return buf;
}

let _staticGl = null;
let _staticProgram = null;
let _staticBuf = null;
let _staticOffscreen = null;

function ensureStaticRenderer() {
  if (_staticGl) return true;
  _staticOffscreen = document.createElement('canvas');
  _staticGl = _staticOffscreen.getContext('webgl', { alpha: true, preserveDrawingBuffer: true });
  if (!_staticGl) return false;
  _staticProgram = buildProgram(_staticGl, staticFragmentSource);
  if (!_staticProgram) { _staticGl = null; return false; }
  _staticBuf = setupQuad(_staticGl);
  return true;
}

export function renderStaticPoster(imgEl, color1, color2, glowX1, glowY1, glowX2, glowY2, seed, w, h) {
  if (!ensureStaticRenderer()) return;
  const gl = _staticGl;

  _staticOffscreen.width = w;
  _staticOffscreen.height = h;
  gl.viewport(0, 0, w, h);

  gl.useProgram(_staticProgram);

  const posLoc = gl.getAttribLocation(_staticProgram, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, _staticBuf);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(_staticProgram, 'u_resolution'), w, h);
  gl.uniform1f(gl.getUniformLocation(_staticProgram, 'u_seed'), seed);
  gl.uniform3fv(gl.getUniformLocation(_staticProgram, 'u_color1'), hexToRgb(color1));
  gl.uniform3fv(gl.getUniformLocation(_staticProgram, 'u_color2'), hexToRgb(color2));
  gl.uniform3fv(gl.getUniformLocation(_staticProgram, 'u_bgColor'), [0, 0, 0.02]);
  gl.uniform2f(gl.getUniformLocation(_staticProgram, 'u_glow1Pos'), glowX1 / 100, glowY1 / 100);
  gl.uniform2f(gl.getUniformLocation(_staticProgram, 'u_glow2Pos'), glowX2 / 100, glowY2 / 100);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  imgEl.src = _staticOffscreen.toDataURL();
}

export function releaseStaticRenderer() {
  if (_staticGl) {
    _staticGl.getExtension('WEBGL_lose_context')?.loseContext();
    _staticGl = null;
    _staticProgram = null;
    _staticBuf = null;
    _staticOffscreen = null;
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 0.5, 0.8];
}

function deriveHighlight(c1, c2) {
  return [
    Math.min(1, (c1[0] + c2[0]) * 0.65),
    Math.min(1, (c1[1] + c2[1]) * 0.65),
    Math.min(1, (c1[2] + c2[2]) * 0.65),
  ];
}

export function initAurora(canvas, color1, color2, options = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) return;

  const program = buildProgram(gl, fragmentShaderSource);
  if (!program) return;

  const buf = setupQuad(gl);

  const uColor1 = hexToRgb(color1);
  const uColor2 = hexToRgb(color2);
  const uColor3 = deriveHighlight(uColor1, uColor2);
  const uBgColor = options.bgColor || [0, 0, 0.02];

  const params = {
    speed: options.speed ?? 0.15,
    scale: options.scale ?? 1.4,
    height: options.height ?? 0.12,
    curtains: options.curtains ?? 4,
    shimmer: options.shimmer ?? 0.7,
    intensity: options.intensity ?? 2.2,
  };

  let startTime = performance.now();
  let rafId = null;

  function render() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform1f(timeLoc, (performance.now() - startTime) / 1000);
    gl.uniform2f(resLoc, w, h);

    gl.uniform1f(gl.getUniformLocation(program, 'u_speed'), params.speed);
    gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), params.scale);
    gl.uniform1f(gl.getUniformLocation(program, 'u_height'), params.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_curtains'), params.curtains);
    gl.uniform1f(gl.getUniformLocation(program, 'u_shimmer'), params.shimmer);
    gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), params.intensity);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color1'), uColor1);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color2'), uColor2);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color3'), uColor3);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_bgColor'), uBgColor);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    rafId = requestAnimationFrame(render);
  }

  render();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
