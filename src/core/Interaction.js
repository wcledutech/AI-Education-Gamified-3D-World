// 三维点击检测：Raycaster + 悬停轮廓 + 悬停提示。区分“拖动视角”和“单击对象”。
import * as THREE from 'three';
import { setHover } from '../utils/three-helpers.js';
import { tx } from '../utils/i18n.js';

export class Interaction {
  constructor(dom, camera, tooltipEl) {
    this.dom = dom;
    this.camera = camera;
    this.tooltip = tooltipEl;
    this.targets = []; // { root, label, onClick, enabled() }
    this.enabled = false;
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.hovered = null;
    this.down = null;
    this.pointer = null;

    dom.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    dom.addEventListener('pointerup', (e) => {
      const d = this.down;
      this.down = null;
      if (!d || !this.enabled) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 600) return;
      const hit = this.pick(e.clientX, e.clientY);
      if (hit) hit.onClick?.(hit);
    });
    dom.addEventListener('pointermove', (e) => {
      this.pointer = { x: e.clientX, y: e.clientY };
    });
    dom.addEventListener('pointerleave', () => {
      this.pointer = null;
      this.setHovered(null);
    });
  }

  /** 注册一个可点击对象；返回注销函数 */
  add(root, { label = '', onClick, hint = ['点击查看', 'Click to view'] } = {}) {
    const t = { root, label, onClick, hint, active: true };
    root.userData.interactive = t;
    this.targets.push(t);
    return t;
  }
  clear() {
    this.setHovered(null);
    this.targets.length = 0;
  }
  setTargets(list) {
    this.setHovered(null);
    this.targets = list;
  }

  pick(x, y) {
    const r = this.dom.getBoundingClientRect();
    this.ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const roots = this.targets.filter((t) => t.active && t.root.visible).map((t) => t.root);
    if (!roots.length) return null;
    const hits = this.ray.intersectObjects(roots, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData.interactive && o.userData.interactive.active) return o.userData.interactive;
        o = o.parent;
      }
    }
    return null;
  }

  setHovered(t) {
    if (this.hovered === t) return;
    if (this.hovered) setHover(this.hovered.root, false);
    this.hovered = t;
    if (t) setHover(t.root, true);
    this.dom.style.cursor = t ? 'pointer' : '';
    if (this.tooltip) {
      const label = t && tx(t.label);
      if (label) {
        this.tooltip.innerHTML = `<b>${label}</b><span>${tx(t.hint)}</span>`;
        this.tooltip.classList.add('show');
      } else this.tooltip.classList.remove('show');
    }
  }

  update() {
    if (!this.enabled || !this.pointer || this.down) {
      if (!this.enabled && this.hovered) this.setHovered(null);
      return;
    }
    const hit = this.pick(this.pointer.x, this.pointer.y);
    this.setHovered(hit);
    if (hit && this.tooltip) {
      this.tooltip.style.transform = `translate(${this.pointer.x + 14}px, ${this.pointer.y + 16}px)`;
    }
  }
}
