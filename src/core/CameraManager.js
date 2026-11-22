// 摄像机：限制范围的环绕观察、预设视角（合书 / 展开 / 专注实验 / 左右页特写）与平滑过渡。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { WING, PAGE_TOP } from '../utils/config.js';

const FOV = 32;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export class CameraManager {
  constructor(domElement) {
    this.camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.5, 200);
    this.controls = new OrbitControls(this.camera, domElement);
    const c = this.controls;
    c.enablePan = false;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.rotateSpeed = 0.5;
    c.zoomSpeed = 0.6;
    c.minPolarAngle = 0.62;
    c.maxPolarAngle = 1.33;
    c.minAzimuthAngle = -0.62;
    c.maxAzimuthAngle = 0.62;
    c.minDistance = 9;
    c.maxDistance = 42;
    this.aspect = 16 / 9;
    this.mode = 'closed';
    this.autoRotate = false;
    this.autoT = 0;
    this.busy = false;
    this.applyView(this.view('closed'));
  }

  /** 根据画面比例计算各预设视角 */
  view(name) {
    const a = this.aspect;
    const fitW = (w) => w / (2 * TAN * a);
    const fitH = (h) => h / (2 * TAN);
    switch (name) {
      case 'closed':
        return { target: [0, 0.6, 0.2], radius: Math.max(fitW(14), fitH(13.5)), polar: 0.86, azimuth: 0 };
      case 'center':
        return { target: [0, 1.5, -0.4], radius: Math.max(fitW(10.5), fitH(8.6)), polar: 1.0, azimuth: 0 };
      case 'left':
      case 'right': {
        const sgn = name === 'left' ? -1 : 1;
        const yaw = -sgn * WING.YAW;
        // 立页中心与朝向
        const cy = PAGE_TOP + (WING.H / 2) * Math.cos(WING.LEAN);
        const back = (WING.H / 2) * Math.sin(WING.LEAN);
        const cx = sgn * WING.X - Math.sin(yaw) * back;
        const cz = WING.Z - Math.cos(yaw) * back;
        const radius = Math.max(fitW(WING.W * 1.12), fitH(WING.H * 1.1));
        return { target: [cx, cy, cz], radius, polar: Math.PI / 2 - WING.LEAN + 0.02, azimuth: yaw };
      }
      default: // open
        return { target: [0, 2.05, 0.9], radius: Math.max(fitW(21.6), fitH(12.4)), polar: 1.075, azimuth: 0 };
    }
  }

  applyView(v) {
    this.controls.target.set(...v.target);
    this.camera.position.setFromSphericalCoords(v.radius, v.polar, v.azimuth).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
  }

  current() {
    const off = this.camera.position.clone().sub(this.controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    return { target: this.controls.target.toArray(), radius: s.radius, polar: s.phi, azimuth: s.theta };
  }

  /** 平滑切换到某个预设视角 */
  /** 生成一台处于某个预设视角的独立相机（用于预热渲染与布局计算） */
  makeCamera(name) {
    const v = this.view(name);
    const cam = this.camera.clone();
    const target = new THREE.Vector3(...v.target);
    cam.position.setFromSphericalCoords(v.radius, v.polar, v.azimuth).add(target);
    cam.lookAt(target);
    cam.updateMatrixWorld();
    return cam;
  }

  goto(name, duration = 1.2, ease = 'power2.inOut') {
    this.mode = name;
    const from = this.current();
    const to = this.view(name);
    const p = { t: 0 };
    this.busy = true;
    this.controls.enabled = false;
    gsap.killTweensOf(this._p || {});
    this._p = p;
    const lerp = (a, b, t) => a + (b - a) * t;
    return new Promise((resolve) => {
      gsap.to(p, {
        t: 1,
        duration,
        ease,
        onUpdate: () => {
          this.applyView({
            target: from.target.map((v, i) => lerp(v, to.target[i], p.t)),
            radius: lerp(from.radius, to.radius, p.t),
            polar: lerp(from.polar, to.polar, p.t),
            azimuth: lerp(from.azimuth, to.azimuth, p.t),
          });
        },
        onComplete: () => {
          this.busy = false;
          this.controls.enabled = true;
          resolve();
        },
      });
    });
  }

  resize(w, h) {
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    if (!this.busy) this.applyView(this.view(this.mode));
  }

  update(dt) {
    if (this.busy) return;
    if (this.autoRotate) {
      // 在限制范围内缓慢左右环视
      this.autoT += dt;
      const v = this.current();
      v.azimuth = Math.sin(this.autoT * 0.35) * 0.42;
      this.applyView(v);
    }
    this.controls.update();
  }
}
