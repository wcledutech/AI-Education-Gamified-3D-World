// 场景基类：管理纸艺立体件（PopUp）、可点击对象、人物，以及展开/收拢动画。
import * as THREE from 'three';
import gsap from 'gsap';
import { PopUp } from '../book/PopUp.js';
import { addOutline, setSelected, blob, cyl, box, rbox, ball, group } from '../utils/three-helpers.js';
import { COLORS } from '../utils/config.js';

export class BaseScene {
  constructor(app, def) {
    this.app = app;
    this.def = def;
    this.key = def.key;
    this.group = new THREE.Group();
    this.popups = [];
    this.targets = [];
    this.byId = {};
    this.characters = {};
    this.active = false;
    this.selected = null;
  }

  /** 把对象装进一个立体折叠件并放到舞台上 */
  pop(obj, x, z, opts = {}) {
    const p = new PopUp(x, z, opts);
    if (obj) p.add(obj);
    this.group.add(p);
    this.popups.push(p);
    return p;
  }

  clickable(root, { id, label, hint = ['点击查看', 'Click to view'], onClick }) {
    addOutline(root);
    const t = { id, root, label, hint, onClick, active: true };
    root.userData.interactive = t;
    this.targets.push(t);
    if (id) this.byId[id] = t;
    return t;
  }

  addCharacter(ch, x, z, yaw = 0, order = 3) {
    ch.setYaw(yaw);
    const p = this.pop(ch.group, x, z, { order, dir: 'back' });
    ch.popup = p;
    ch.def = this.def; // 姓名与身份随语言从场景定义里取
    this.characters[ch.id] = ch;
    this.clickable(ch.group, {
      id: 'char:' + ch.id,
      label: () => `${ch.name} · ${ch.role}`,
      hint: ['点击对话', 'Click to talk'],
      onClick: () => this.onCharacter(ch),
    });
    return ch;
  }

  onCharacter(ch) {
    this.select(ch.group);
    ch.talk();
    this.app.say(this, ch.id);
  }

  select(root) {
    if (this.selected) setSelected(this.selected, false);
    this.selected = root || null;
    if (root) setSelected(root, true);
  }

  unfoldTimeline() {
    const tl = gsap.timeline();
    const counts = {};
    this.popups.forEach((p) => {
      const n = (counts[p.order] = (counts[p.order] || 0) + 1);
      tl.to(p, { fold: 1, duration: 0.8, ease: 'back.out(1.45)', onUpdate: () => p.apply() }, p.order * 0.22 + n * 0.05);
    });
    return tl;
  }
  foldTimeline() {
    const tl = gsap.timeline();
    const maxOrder = Math.max(0, ...this.popups.map((p) => p.order));
    this.popups.forEach((p, i) => {
      tl.to(p, { fold: 0, duration: 0.42, ease: 'power2.in', onUpdate: () => p.apply() }, (maxOrder - p.order) * 0.1 + (i % 5) * 0.02);
    });
    return tl;
  }

  activate() {
    this.active = true;
    this.app.interaction.setTargets(this.targets);
  }
  deactivate() {
    this.active = false;
    this.select(null);
    this.app.interaction.setTargets([]);
  }

  update(dt, t) {
    for (const k in this.characters) this.characters[k].update(t);
  }

  /** 在 2D 画布上绘制该场景的地面印刷；子类实现 */
  drawGround(ctx, w, h) {
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(0, 0, w, h);
  }
}

// ---------- 通用纸艺小件 ----------
export function tree(h = 1.3, color = COLORS.green) {
  const g = group(cyl(0.045, 0.07, h * 0.45, COLORS.brown, 0, 0, 0, 8));
  g.add(blob(h * 0.3, color, 0, h * 0.62, 0, 1));
  g.add(blob(h * 0.2, COLORS.greenDark, h * 0.13, h * 0.82, 0.04, 0));
  return g;
}
export function coneTree(h = 1.2, color = COLORS.greenDark) {
  const g = group(cyl(0.04, 0.06, h * 0.25, COLORS.brown, 0, 0, 0, 8));
  const mk = (r, hh, y) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 7), blob(0.1, color).material);
    m.position.y = y + hh / 2;
    m.castShadow = true;
    return m;
  };
  g.add(mk(h * 0.3, h * 0.45, h * 0.2), mk(h * 0.23, h * 0.4, h * 0.45), mk(h * 0.15, h * 0.32, h * 0.7));
  return g;
}
export function bush(r = 0.22, color = COLORS.green) {
  const g = group(blob(r, color, 0, r * 0.7, 0, 1));
  g.add(blob(r * 0.7, COLORS.greenDark, r * 0.8, r * 0.5, 0.02, 0));
  return g;
}
export function bench() {
  const g = group(rbox(0.9, 0.06, 0.3, COLORS.brown, 0, 0.26, 0, 0.02), rbox(0.9, 0.3, 0.05, COLORS.brown, 0, 0.36, -0.14, 0.02));
  [-0.36, 0.36].forEach((x) => g.add(box(0.06, 0.26, 0.26, COLORS.inkSoft, x, 0, 0)));
  return g;
}
/** 展示底座 */
export function pedestal(w = 0.6, h = 0.4, d = 0.6, color = COLORS.cream) {
  const g = group(rbox(w, h, d, color, 0, 0, 0, 0.04));
  g.add(rbox(w + 0.08, 0.05, d + 0.08, COLORS.sand, 0, h, 0, 0.02));
  return g;
}
export function flagPole(h = 1.0, color = COLORS.coral) {
  const g = group(cyl(0.015, 0.015, h, COLORS.ink, 0, 0, 0, 6), ball(0.03, COLORS.mustard, 0, h, 0, 8, 6));
  const f = box(0.3, 0.18, 0.012, color, 0.16, h - 0.24, 0);
  g.add(f);
  return g;
}
