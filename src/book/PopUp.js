// 纸艺立体机构。
// PopUp：平行四边形折叠——竖直方向被“剪切”压平到纸页上，是立体书最常见的展开机构。
// Stage：跨越书脊的升降纸台。Wings：从左右书页立起的两张内页（承载 HTML 教材界面）。
import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { STAGE, WING, PAGE_TOP, COLORS } from '../utils/config.js';
import { shadow } from '../utils/three-helpers.js';

const DIRS = { back: [0, -1], front: [0, 1], left: [-1, 0], right: [1, 0] };

export class PopUp extends THREE.Group {
  /** dir: 折叠时倒向的方向 */
  constructor(x = 0, z = 0, { dir = 'back', yaw = 0, order = 0 } = {}) {
    super();
    this.matrixAutoUpdate = false;
    this.base = new THREE.Vector3(x, 0, z);
    this.yaw = yaw;
    this.dirVec = DIRS[dir] || DIRS.back;
    this.order = order;
    this.fold = 0;
    this._m = new THREE.Matrix4();
    this._r = new THREE.Matrix4();
    this.apply();
  }
  /** fold: 0 完全压平（隐藏），1 完全立起；可略大于 1 形成回弹 */
  apply() {
    const t = this.fold;
    const phi = (t * Math.PI) / 2;
    const s = Math.max(Math.sin(phi), 0.02);
    const c = Math.cos(phi);
    const [dx, dz] = this.dirVec;
    // 剪切：y' = y·sinφ，水平方向偏移 y·cosφ
    this._m.set(1, c * dx, 0, 0, 0, s, 0, 0, 0, c * dz, 1, 0, 0, 0, 0, 1);
    this._r.makeRotationY(this.yaw);
    this.matrix.makeTranslation(this.base.x, this.base.y, this.base.z).multiply(this._m).multiply(this._r);
    this.visible = t > 0.015;
    this.matrixWorldNeedsUpdate = true;
  }
  setFold(t) {
    this.fold = t;
    this.apply();
  }
}

export class Stage {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, PAGE_TOP, STAGE.CZ);
    const side = new THREE.MeshStandardMaterial({ color: COLORS.cream, roughness: 0.95 });
    this.topMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 });
    const plate = shadow(new THREE.Mesh(new THREE.BoxGeometry(STAGE.SX, STAGE.TH, STAGE.SZ), [side, side, this.topMat, side, side, side]));
    plate.position.y = -STAGE.TH / 2;
    this.plate = new THREE.Group();
    this.plate.add(plate);
    // 纸台下方的折叠支撑
    this.legs = [];
    const lm = new THREE.MeshStandardMaterial({ color: COLORS.paperShade, roughness: 0.95 });
    [
      [-STAGE.SX / 2 + 0.5, 0],
      [STAGE.SX / 2 - 0.5, 0],
      [0, STAGE.SZ / 2 - 0.4],
      [0, -STAGE.SZ / 2 + 0.4],
    ].forEach(([x, z], i) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(i < 2 ? 0.05 : STAGE.SX - 1.6, 1, i < 2 ? STAGE.SZ - 1.2 : 0.05), lm);
      leg.position.set(x, 0, z);
      this.group.add(leg);
      this.legs.push(leg);
    });
    /** 场景内容挂在这里（原点 = 台面中心） */
    this.content = new THREE.Group();
    this.plate.add(this.content);
    this.group.add(this.plate);
    this.lift = 0;
    this.setLift(0);
  }
  setGround(tex) {
    this.topMat.map = tex;
    this.topMat.needsUpdate = true;
  }
  setLift(t) {
    this.lift = t;
    const h = STAGE.TH + t * STAGE.LIFT;
    this.plate.position.y = h;
    this.legs.forEach((l) => {
      l.scale.y = Math.max(h - STAGE.TH, 0.001);
      l.position.y = (h - STAGE.TH) / 2;
    });
    this.group.visible = t > 0.01;
  }
}

export class Wings {
  constructor(leftEl, rightEl) {
    this.items = [leftEl, rightEl].map((el, i) => {
      const sgn = i === 0 ? -1 : 1;
      const group = new THREE.Group();
      group.position.set(sgn * WING.X, PAGE_TOP, WING.Z);
      group.rotation.y = -sgn * WING.YAW;
      const hinge = new THREE.Group();
      const board = shadow(new THREE.Mesh(new THREE.BoxGeometry(WING.W, WING.H, WING.TH), new THREE.MeshStandardMaterial({ color: COLORS.paper, roughness: 0.95 })));
      board.position.set(0, WING.H / 2, -WING.TH / 2);
      // 背后的纸质撑脚
      const strut = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.5, WING.H * 0.6, 0.04), new THREE.MeshStandardMaterial({ color: COLORS.paperShade, roughness: 0.95 })));
      strut.position.set(0, WING.H * 0.3, -WING.TH - 0.02);
      const css = new CSS3DObject(el);
      css.position.set(0, WING.H / 2, 0.012);
      hinge.add(board, strut, css);
      group.add(hinge);
      return { sgn, group, hinge, css, el, board };
    });
    this.t = 0;
    this.setFold(0);
    this.cssW = 0;
  }
  get groups() {
    return this.items.map((w) => w.group);
  }
  /** t: 0 平贴书页（隐藏），1 立起 */
  setFold(t) {
    this.t = t;
    // 页面内容随纸页立起逐渐显现；完全立起后才接受点击
    const opacity = Math.min(1, Math.max(0, (t - 0.1) / 0.45));
    this.items.forEach((w) => {
      w.hinge.rotation.x = -Math.PI / 2 + t * (Math.PI / 2 - WING.LEAN);
      w.group.visible = t > 0.01;
      w.el.style.opacity = opacity;
      w.el.classList.toggle('shown', t > 0.92);
    });
  }
  /** 依据内页在屏幕上的实际宽度，设置 HTML 的像素尺寸，使文字接近 1:1 清晰显示 */
  layout(camera, viewW) {
    const a = new THREE.Vector3(WING.X - WING.W / 2, PAGE_TOP + 3, WING.Z).project(camera);
    const b = new THREE.Vector3(WING.X + WING.W / 2, PAGE_TOP + 3, WING.Z).project(camera);
    const px = (Math.abs(b.x - a.x) * viewW) / 2;
    const cssW = Math.round(THREE.MathUtils.clamp(px, 350, 470));
    if (cssW === this.cssW) return;
    this.cssW = cssW;
    const inset = 0.94;
    const cssH = Math.round((cssW * WING.H) / WING.W);
    this.items.forEach((w) => {
      w.el.style.width = `${cssW}px`;
      w.el.style.height = `${cssH}px`;
      w.css.scale.setScalar((WING.W * inset) / cssW);
    });
  }
}
