// 单张书页：多段网格，翻转时带有自然的弯曲与“页尾拖后”效果。
// p = 0 平躺在右侧，p = 1 平躺在左侧。正面（朝上于右侧）与背面使用不同贴图。
import * as THREE from 'three';
import { BOOK, PAGE_TOP } from '../utils/config.js';

const SEG = 26;

export class PageLeaf {
  constructor() {
    const { W, D } = BOOK;
    const count = (SEG + 1) * 2;
    this.pos = new Float32Array(count * 3);
    this.nor = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    const idx = [];
    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j < 2; j++) {
        const k = i * 2 + j;
        uv[k * 2] = i / SEG;
        uv[k * 2 + 1] = j === 0 ? 1 : 0;
        this.pos[k * 3 + 2] = j === 0 ? -D / 2 : D / 2;
      }
      if (i < SEG) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2 + 1;
        const d = (i + 1) * 2;
        idx.push(a, b, c, a, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.geometry = g;
    this.frontMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.FrontSide });
    this.backMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, side: THREE.BackSide });
    this.group = new THREE.Group();
    const f = new THREE.Mesh(g, this.frontMat);
    const b = new THREE.Mesh(g, this.backMat);
    [f, b].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      this.group.add(m);
    });
    this.group.position.set(0, PAGE_TOP + 0.007, 0);
    this.group.visible = false;
    this.W = W;
    this.set(0);
  }

  setMaps(front, back) {
    this.frontMat.map = front || null;
    this.backMat.map = back || null;
    this.frontMat.needsUpdate = true;
    this.backMat.needsUpdate = true;
  }

  /** p ∈ [0,1]：翻页进度 */
  set(p) {
    this.p = p;
    const alpha = Math.PI * p;
    const curl = 0.85 * Math.sin(alpha);
    const ds = this.W / SEG;
    let x = 0;
    let y = 0;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const th = alpha - curl * Math.pow(u, 1.25);
      if (i > 0) {
        const um = (i - 0.5) / SEG;
        const tm = alpha - curl * Math.pow(um, 1.25);
        x += Math.cos(tm) * ds;
        y += Math.sin(tm) * ds;
      }
      for (let j = 0; j < 2; j++) {
        const k = (i * 2 + j) * 3;
        this.pos[k] = x;
        this.pos[k + 1] = Math.max(y, 0);
        this.nor[k] = -Math.sin(th);
        this.nor[k + 1] = Math.cos(th);
        this.nor[k + 2] = 0;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }
}
