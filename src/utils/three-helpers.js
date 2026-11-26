// 三维建模小工具：统一的纸艺材质、基础几何体、画布贴图与轮廓强调。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FONT_CN } from './config.js';
import { T } from './i18n.js';

const matCache = new Map();
/** 带缓存的哑光“纸张”材质 */
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...o }));
  }
  return matCache.get(key);
}
const asMat = (c, o) => (c && c.isMaterial ? c : mat(c, o));

export function shadow(m, cast = true, recv = true) {
  m.castShadow = cast;
  m.receiveShadow = recv;
  return m;
}

/** 长方体，y 为底面高度 */
export function box(w, h, d, color, x = 0, y = 0, z = 0, o) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), asMat(color, o));
  m.position.set(x, y + h / 2, z);
  return shadow(m);
}
/** 圆角长方体，y 为底面高度 */
export function rbox(w, h, d, color, x = 0, y = 0, z = 0, r = 0.05, o) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), asMat(color, o));
  m.position.set(x, y + h / 2, z);
  return shadow(m);
}
/** 圆柱/圆台，y 为底面高度 */
export function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 18, o) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), asMat(color, o));
  m.position.set(x, y + h / 2, z);
  return shadow(m);
}
/** 球体，y 为球心高度 */
export function ball(r, color, x = 0, y = 0, z = 0, ws = 16, hs = 12, o) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), asMat(color, o));
  m.position.set(x, y, z);
  return shadow(m);
}
/** 低多边形“纸团”——用于树冠等 */
export function blob(r, color, x = 0, y = 0, z = 0, detail = 1) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(color, { flatShading: true }));
  m.position.set(x, y, z);
  return shadow(m);
}
/** 三棱柱（人字形屋顶），y 为底面高度 */
export function prism(w, h, d, color, x = 0, y = 0, z = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(g, asMat(color));
  m.position.set(x, y, z);
  return shadow(m);
}
export function group(...children) {
  const g = new THREE.Group();
  children.forEach((c) => c && g.add(c));
  return g;
}

// ---------- 画布贴图 ----------
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}
export function canvasTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
/** 自动换行绘制文字，返回结束的 y */
export function wrapText(ctx, text, x, y, maxW, lineH, maxLines = 99) {
  // 中文按字换行；英文单词、数字等连续的西文字符不拆开
  const tokens = text.match(/[\x21-\x7e]+|\s|[^\x00-\x7f]/g) || [];
  let line = '';
  let n = 0;
  const flush = () => {
    ctx.fillText(line.trimEnd(), x, y);
    y += lineH;
    n += 1;
    line = '';
  };
  for (const tk of tokens) {
    const isSpace = /^\s$/.test(tk);
    if (tk === '\n' || (line && ctx.measureText(line + tk).width > maxW)) {
      flush();
      if (n >= maxLines) return y;
      if (isSpace) continue;
    }
    if (line || !isSpace) line += tk;
  }
  if (line.trim()) {
    ctx.fillText(line.trimEnd(), x, y);
    y += lineH;
  }
  return y;
}

/** 可重绘的“屏幕/印刷面”平面。draw(ctx, W, H) */
export class CanvasPanel {
  constructor(w, h, { ppu = 200, lit = true } = {}) {
    this.canvas = makeCanvas(w * ppu, h * ppu);
    this.ctx = this.canvas.getContext('2d');
    this.tex = canvasTex(this.canvas);
    const material = lit
      ? new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.9 })
      : new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    this.mesh.userData.noOutline = true;
    this.mesh.receiveShadow = lit;
    PANELS.add(this);
  }
  /** 记住绘制函数；切换语言时会用它重画一遍 */
  draw(fn) {
    this._fn = fn;
    return this.redraw();
  }
  redraw() {
    if (!this._fn) return this;
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this._fn(ctx, canvas.width, canvas.height);
    this.tex.needsUpdate = true;
    return this;
  }
}
const PANELS = new Set();
/** 重画全部带文字的画布（语言切换后调用） */
export function redrawAllPanels() {
  PANELS.forEach((p) => p.redraw());
}

/** 文字标牌。text 可以是字符串，也可以是 [中文, English] */
export function sign(textIn, { w = 1.2, h = 0.32, bg = '#F7F2E6', fg = '#34434A', font = FONT_CN, weight = 700, size = 0.6, border = null, radius = 0.25, lit = true } = {}) {
  const p = new CanvasPanel(w, h, { ppu: 220, lit });
  p.draw((ctx, W, H) => {
    const text = Array.isArray(textIn) ? T(textIn[0], textIn[1]) : textIn;
    if (bg) {
      ctx.fillStyle = bg;
      roundRect(ctx, 2, 2, W - 4, H - 4, H * radius);
      ctx.fill();
      if (border) {
        ctx.strokeStyle = border;
        ctx.lineWidth = Math.max(3, H * 0.05);
        ctx.stroke();
      }
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let px = H * size;
    ctx.font = `${weight} ${px}px ${font}`;
    const tw = ctx.measureText(text).width;
    if (tw > W * 0.9) {
      px *= (W * 0.9) / tw;
      ctx.font = `${weight} ${px}px ${font}`;
    }
    ctx.fillText(text, W / 2, H / 2 + px * 0.04);
  });
  p.mesh.material.alphaTest = 0.5;
  return p.mesh;
}

// ---------- 轮廓强调（沿法线外扩的背面壳） ----------
function outlineMaterial(color, thickness) {
  return new THREE.ShaderMaterial({
    uniforms: { thickness: { value: thickness }, color: { value: new THREE.Color(color) } },
    vertexShader: `uniform float thickness; void main(){ vec3 p = position + normalize(normal) * thickness; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 color;
void main(){
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`,
    side: THREE.BackSide,
  });
}
const OUTLINE_HOVER = outlineMaterial('#FFFDF2', 0.028);
const OUTLINE_SELECT = outlineMaterial('#F0A98F', 0.04);

export function addOutline(root) {
  const pairs = [];
  root.traverse((o) => {
    if (o.isMesh && !o.userData.noOutline && !o.userData.isOutline) pairs.push(o);
  });
  const shells = pairs.map((o) => {
    const m = new THREE.Mesh(o.geometry, OUTLINE_HOVER);
    m.visible = false;
    m.userData.isOutline = true;
    m.raycast = () => {};
    o.add(m);
    return m;
  });
  root.userData.outlines = shells;
  root.userData.outlineState = { hover: false, select: false };
}
function applyOutline(root) {
  const s = root.userData.outlineState;
  if (!s) return;
  const on = s.hover || s.select;
  const material = s.select ? OUTLINE_SELECT : OUTLINE_HOVER;
  root.userData.outlines.forEach((m) => {
    m.visible = on;
    m.material = material;
  });
}
export function setHover(root, on) {
  if (!root?.userData.outlineState) return;
  root.userData.outlineState.hover = on;
  applyOutline(root);
}
export function setSelected(root, on) {
  if (!root?.userData.outlineState) return;
  root.userData.outlineState.select = on;
  applyOutline(root);
}

/** 释放一棵对象树占用的几何体/贴图 */
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    ms.forEach((m) => {
      if (m.map) m.map.dispose();
    });
  });
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};
