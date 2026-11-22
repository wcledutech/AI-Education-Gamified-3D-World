// 低多边形纸艺人物：完整的头部、躯干与四肢，带简单的待机、挥手、指向与点头动作。
import * as THREE from 'three';
import gsap from 'gsap';
import { COLORS } from '../utils/config.js';
import { mat, rbox, cyl, ball, shadow } from '../utils/three-helpers.js';

function arm(color, handColor, len = 0.3) {
  const pivot = new THREE.Group();
  const upper = shadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.072, len, 4, 10), mat(color)));
  upper.position.y = -len / 2 - 0.04;
  const hand = ball(0.078, handColor, 0, -len - 0.13, 0, 12, 10);
  pivot.add(upper, hand);
  return pivot;
}

class Character {
  constructor(info) {
    Object.assign(this, info);
    this.group = new THREE.Group();
    this.rig = new THREE.Group(); // 身体整体（用于呼吸起伏）
    this.group.add(this.rig);
    this.phase = Math.random() * 6;
    this.baseYaw = 0;
    this.acting = false;
  }
  setYaw(y) {
    this.baseYaw = y;
    this.group.rotation.y = y;
  }
  update(t) {
    this.rig.position.y = Math.sin(t * 1.8 + this.phase) * 0.012;
    if (this.head) this.head.rotation.z = Math.sin(t * 0.9 + this.phase) * 0.035;
    if (!this.acting) {
      this.armL.rotation.x = Math.sin(t * 1.3 + this.phase) * 0.06;
      this.armR.rotation.x = -Math.sin(t * 1.3 + this.phase) * 0.06;
    }
  }
  _act(build) {
    gsap.killTweensOf([this.armL.rotation, this.armR.rotation, this.group.rotation, this.head.rotation]);
    this.acting = true;
    const tl = gsap.timeline({ onComplete: () => (this.acting = false) });
    build(tl);
    return tl;
  }
  /** 转身面向某个偏航角，再转回来 */
  turn(yaw, hold = 1.6) {
    gsap.to(this.group.rotation, { y: yaw, duration: 0.45, ease: 'power2.out' });
    gsap.to(this.group.rotation, { y: this.baseYaw, duration: 0.6, ease: 'power2.inOut', delay: hold + 0.45 });
  }
  wave() {
    return this._act((tl) => {
      tl.to(this.armR.rotation, { z: 2.5, x: 0, duration: 0.35, ease: 'back.out(1.6)' })
        .to(this.armR.rotation, { z: 2.05, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(this.armR.rotation, { z: this.armRest, duration: 0.4, ease: 'power2.inOut' });
    });
  }
  /** 抬手指向前方/侧方 */
  point(side = 1) {
    const a = side > 0 ? this.armR : this.armL;
    return this._act((tl) => {
      tl.to(a.rotation, { x: -1.35, z: side * 0.35, duration: 0.4, ease: 'back.out(1.5)' })
        .to(this.head.rotation, { x: -0.08, duration: 0.3 }, 0)
        .to(a.rotation, { x: -1.2, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(a.rotation, { x: 0, z: side > 0 ? this.armRest : -this.armRest, duration: 0.45, ease: 'power2.inOut' })
        .to(this.head.rotation, { x: 0, duration: 0.3 }, '<');
    });
  }
  nod() {
    return this._act((tl) => {
      tl.to(this.head.rotation, { x: 0.22, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(this.armL.rotation, { z: -0.7, x: -0.5, duration: 0.3, ease: 'power2.out' }, 0)
        .to(this.armL.rotation, { z: -this.armRest, x: 0, duration: 0.4, ease: 'power2.inOut' }, 0.8);
    });
  }
  talk() {
    const n = (this._n = ((this._n || 0) + 1) % 3);
    if (n === 0) return this.point(1);
    if (n === 1) return this.nod();
    return this.wave();
  }
}

/** 学生 / 教师等人物 */
export function makeHuman(info, look = {}) {
  const L = { skin: '#F3D2B8', hair: '#4A3B32', top: COLORS.tech, bottom: '#5E6E75', shoes: COLORS.ink, hairStyle: 'short', pack: null, glasses: false, coat: null, scale: 0.84, ...look };
  const ch = new Character(info);
  const r = ch.rig;
  // 腿与鞋
  [-0.11, 0.11].forEach((x) => {
    r.add(rbox(0.16, 0.38, 0.18, L.bottom, x, 0.06, 0, 0.05));
    r.add(rbox(0.18, 0.09, 0.26, L.shoes, x, 0, 0.035, 0.04));
  });
  // 躯干
  r.add(rbox(0.48, 0.5, 0.3, L.top, 0, 0.42, 0, 0.11));
  if (L.coat) {
    r.add(rbox(0.52, 0.62, 0.33, L.coat, 0, 0.33, -0.012, 0.1));
    r.add(rbox(0.16, 0.4, 0.04, L.top, 0, 0.5, 0.155, 0.02));
  }
  // 头
  const head = new THREE.Group();
  head.position.y = 1.2;
  const skull = ball(0.27, L.skin, 0, 0, 0, 20, 16);
  skull.scale.y = 0.96;
  head.add(skull);
  const hairMat = mat(L.hair, { roughness: 0.95 });
  const cap = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.288, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat));
  cap.rotation.x = -0.32;
  cap.position.y = 0.012;
  head.add(cap);
  if (L.hairStyle === 'bob' || L.hairStyle === 'pony') {
    const backHair = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.295, 18, 12, Math.PI * 1.02, Math.PI * 0.96, 0.2, Math.PI * 0.62), hairMat));
    head.add(backHair);
  }
  if (L.hairStyle === 'pony') {
    const tail = ball(0.11, L.hair, 0, -0.02, -0.33, 10, 8);
    tail.scale.set(0.8, 1.5, 0.8);
    head.add(tail);
  }
  if (L.hairStyle === 'bun') head.add(ball(0.12, L.hair, 0, 0.26, -0.12, 10, 8));
  // 五官
  const dark = mat('#2E3438', { roughness: 0.6 });
  [-0.098, 0.098].forEach((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), dark);
    e.position.set(x, 0.0, 0.248);
    e.scale.set(1, 1.25, 0.6);
    head.add(e);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), mat('#EFAF9F', { roughness: 1 }));
    cheek.position.set(x * 1.65, -0.07, 0.232);
    cheek.rotation.y = x > 0 ? 0.55 : -0.55;
    head.add(cheek);
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 12, Math.PI), dark);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.08, 0.258);
  head.add(smile);
  if (L.glasses) {
    [-0.098, 0.098].forEach((x) => {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.01, 6, 16), mat('#4A4038'));
      g.position.set(x, 0.0, 0.262);
      head.add(g);
    });
  }
  r.add(head);
  ch.head = head;
  // 手臂
  ch.armRest = 0.14;
  ch.armL = arm(L.coat || L.top, L.skin);
  ch.armL.position.set(-0.3, 0.87, 0);
  ch.armL.rotation.z = -ch.armRest;
  ch.armR = arm(L.coat || L.top, L.skin);
  ch.armR.position.set(0.3, 0.87, 0);
  ch.armR.rotation.z = ch.armRest;
  r.add(ch.armL, ch.armR);
  if (L.pack) {
    r.add(rbox(0.38, 0.4, 0.15, L.pack, 0, 0.47, -0.21, 0.06));
    r.add(rbox(0.22, 0.12, 0.05, COLORS.cream, 0, 0.52, -0.3, 0.02));
  }
  if (L.prop === 'clipboard') {
    const board = rbox(0.2, 0.26, 0.025, COLORS.brown, 0, -0.56, 0.06, 0.01);
    board.add(rbox(0.16, 0.2, 0.01, COLORS.cream, 0, -0.1, 0.016, 0.005));
    ch.armL.add(board);
  }
  ch.group.scale.setScalar(L.scale);
  return ch;
}

/** AI 讲解员 / AI 助手：圆角机器人 */
export function makeRobot(info, look = {}) {
  const L = { body: COLORS.cream, accent: COLORS.tech, light: '#BFE3D0', scale: 0.86, ...look };
  const ch = new Character(info);
  const r = ch.rig;
  r.add(cyl(0.2, 0.27, 0.14, COLORS.techDark, 0, 0, 0, 20));
  r.add(cyl(0.16, 0.2, 0.08, COLORS.ink, 0, 0.12, 0, 20));
  r.add(rbox(0.54, 0.54, 0.42, L.body, 0, 0.18, 0, 0.17));
  r.add(rbox(0.3, 0.2, 0.03, L.accent, 0, 0.36, 0.205, 0.04));
  const heart = ball(0.045, COLORS.coral, 0, 0.46, 0.225, 10, 8, { emissive: COLORS.coral, emissiveIntensity: 0.35 });
  r.add(heart);
  ch.heart = heart;
  const head = new THREE.Group();
  head.position.y = 1.03;
  head.add(rbox(0.66, 0.48, 0.48, L.body, 0, -0.24, 0, 0.17));
  head.add(rbox(0.5, 0.31, 0.04, COLORS.ink, 0, -0.16, 0.225, 0.08, { roughness: 0.5 }));
  const eyeMat = mat(L.light, { emissive: L.light, emissiveIntensity: 0.7, roughness: 0.4 });
  ch.eyes = [-0.12, 0.12].map((x) => {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 14), eyeMat);
    e.rotation.x = Math.PI / 2;
    e.position.set(x, 0.01, 0.25);
    head.add(e);
    return e;
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 6, 12, Math.PI), eyeMat);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.07, 0.25);
  head.add(mouth);
  [-1, 1].forEach((s) => {
    const ear = cyl(0.09, 0.09, 0.06, L.accent, 0, 0, 0, 14);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(s * 0.35, 0, 0);
    head.add(ear);
  });
  head.add(cyl(0.014, 0.014, 0.18, COLORS.ink, 0, 0.24, 0, 8));
  head.add(ball(0.05, COLORS.coral, 0, 0.45, 0, 10, 8, { emissive: COLORS.coral, emissiveIntensity: 0.3 }));
  r.add(head);
  ch.head = head;
  ch.armRest = 0.22;
  ch.armL = arm(L.body, L.accent, 0.24);
  ch.armL.position.set(-0.33, 0.62, 0);
  ch.armL.rotation.z = -ch.armRest;
  ch.armR = arm(L.body, L.accent, 0.24);
  ch.armR.position.set(0.33, 0.62, 0);
  ch.armR.rotation.z = ch.armRest;
  r.add(ch.armL, ch.armR);
  ch.group.scale.setScalar(L.scale);
  const baseUpdate = ch.update.bind(ch);
  ch.update = (t) => {
    baseUpdate(t);
    // 眨眼
    const k = (t + ch.phase) % 3.6;
    const s = k < 0.12 ? 0.15 : 1;
    ch.eyes.forEach((e) => (e.scale.z = s));
  };
  return ch;
}
