// 场景一：AI 智慧城市——人工智能在哪里？
import * as THREE from 'three';
import gsap from 'gsap';
import { BaseScene, tree, coneTree, bush, bench, pedestal, flagPole } from './BaseScene.js';
import { COLORS, STAGE, FONT_CN } from '../utils/config.js';
import { mat, box, rbox, cyl, ball, prism, group, sign, CanvasPanel, roundRect, shadow } from '../utils/three-helpers.js';
import { makeHuman, makeRobot } from '../characters/CharacterFactory.js';
import { T } from '../utils/i18n.js';

const glow = (color, k = 0) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.6 });

export class SmartCityScene extends BaseScene {
  build() {
    this.buildBuildings();
    this.buildDevices();
    this.buildProps();
    const d = this.def.characters;
    this.addCharacter(makeHuman(d.student, { top: COLORS.mustard, bottom: '#5E6E75', hair: '#4A3B32', pack: COLORS.coral }), -0.8, 2.4, 0.3);
    this.addCharacter(makeRobot(d.guide), 0.65, 2.5, -0.3);
  }

  // ---------- 建筑 ----------
  buildBuildings() {
    // 智慧小屋
    const home = group(rbox(1.9, 1.25, 1.3, '#F4E9D6', 0, 0, 0, 0.03));
    home.add(prism(2.2, 0.78, 1.5, COLORS.coral, 0, 1.25, 0));
    home.add(rbox(0.36, 0.62, 0.05, COLORS.coralDark, -0.5, 0, 0.66, 0.02));
    [0.2, 0.62].forEach((x) => {
      home.add(rbox(0.36, 0.38, 0.03, COLORS.cream, x, 0.52, 0.655, 0.02));
      home.add(rbox(0.28, 0.3, 0.04, COLORS.tech, x, 0.56, 0.66, 0.02));
    });
    home.add(box(0.2, 0.5, 0.2, '#D9CDB8', 0.62, 1.45, -0.25));
    const solar = box(0.7, 0.03, 0.42, COLORS.techDark, -0.52, 1.62, 0.36);
    solar.rotation.z = 0.615;
    solar.rotation.order = 'YXZ';
    home.add(solar);
    const hs = sign(['智慧小屋', 'Smart Home'], { w: 0.9, h: 0.24, bg: COLORS.cream, border: COLORS.coralDark });
    hs.position.set(0.1, 1.05, 0.67);
    home.add(hs);
    this.pop(home, -2.55, -2.6, { order: 0 });

    // 图像识别站
    const lab = group(rbox(2.0, 1.7, 1.2, '#E4EEF0', 0, 0, 0, 0.03));
    lab.add(rbox(2.12, 0.16, 1.3, COLORS.tech, 0, 1.7, 0, 0.03));
    lab.add(rbox(1.3, 0.62, 0.04, '#BFD8E2', 0, 0.62, 0.6, 0.02));
    lab.add(rbox(0.4, 0.5, 0.05, COLORS.cream, -0.72, 0, 0.6, 0.02));
    [-0.4, 0, 0.4].forEach((x) => lab.add(box(0.02, 0.62, 0.05, COLORS.cream, x, 0.62, 0.61)));
    const ls = sign(['图像识别站', 'Image Recognition'], { w: 1.2, h: 0.26, bg: COLORS.cream, border: COLORS.techDark });
    ls.position.set(0, 1.46, 0.61);
    lab.add(ls);
    const eye = cyl(0.26, 0.26, 0.06, COLORS.cream, 0, 0, 0, 24);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(0.6, 2.2, 0);
    eye.add(cyl(0.13, 0.13, 0.07, COLORS.ink, 0, -0.035, 0, 20));
    lab.add(eye, cyl(0.02, 0.02, 0.3, COLORS.ink, 0.6, 1.86, 0, 6));
    this.pop(lab, 0.25, -2.75, { order: 0 });

    // 学校
    const school = group(rbox(1.9, 1.95, 1.2, COLORS.sand, 0, 0, 0, 0.03));
    school.add(rbox(2.02, 0.12, 1.3, '#D2C4A6', 0, 1.95, 0, 0.02));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) school.add(rbox(0.34, 0.34, 0.04, COLORS.tech, -0.55 + c * 0.55, 0.78 + r * 0.56, 0.6, 0.02));
    school.add(rbox(0.5, 0.56, 0.05, COLORS.greenDark, 0, 0, 0.6, 0.02));
    const ss = sign(['明理中学', 'Mingli School'], { w: 0.9, h: 0.22, bg: COLORS.cream, border: COLORS.greenDark });
    ss.position.set(0, 0.66, 0.635);
    school.add(ss);
    const fp = flagPole(0.8);
    fp.position.set(0.7, 2.07, 0.2);
    school.add(fp);
    this.pop(school, 2.7, -2.65, { order: 0 });
  }

  // ---------- 七种设备 ----------
  buildDevices() {
    const reg = (id, root, x, z, opts = {}) => {
      const dev = this.def.devices.find((d) => d.id === id);
      const p = this.pop(root, x, z, { order: 1, ...opts });
      this.clickable(root, { id, label: () => this.def.devices.find((d) => d.id === id).name, hint: ['点击观察它怎样工作', 'Click to see how it works'], onClick: () => this.onDevice(id) });
      return p;
    };

    // 1 智能音箱
    const sp = group(pedestal(0.56, 0.4, 0.56));
    sp.add(cyl(0.19, 0.21, 0.4, '#71858F', 0, 0.45, 0, 22));
    this.spRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 28), glow(COLORS.mint, 0.25));
    this.spRing.rotation.x = Math.PI / 2;
    this.spRing.position.y = 0.86;
    sp.add(this.spRing);
    this.waves = [0, 1, 2].map(() => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 32), new THREE.MeshBasicMaterial({ color: COLORS.techDark, transparent: true, opacity: 0 }));
      w.position.set(0, 0.68, 0.22);
      w.userData.noOutline = true;
      sp.add(w);
      return w;
    });
    reg('speaker', sp, -3.05, -1.2);

    // 2 定时台灯
    const lamp = group(pedestal(0.56, 0.4, 0.56));
    lamp.add(cyl(0.13, 0.15, 0.04, COLORS.ink, -0.08, 0.45, 0, 18));
    const armL = cyl(0.016, 0.016, 0.42, COLORS.ink, 0, 0, 0, 6);
    armL.position.set(-0.03, 0.68, 0);
    armL.rotation.z = -0.3;
    lamp.add(armL);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.17, 0.2, 16, 1, true), mat(COLORS.mustard, { side: THREE.DoubleSide }));
    shade.position.set(0.07, 0.92, 0);
    shade.rotation.z = -0.5;
    shadow(shade);
    lamp.add(shade);
    this.bulbMat = glow('#FFF3C4', 0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), this.bulbMat);
    bulb.position.set(0.1, 0.86, 0);
    lamp.add(bulb);
    lamp.add(rbox(0.24, 0.24, 0.1, COLORS.cream, 0.16, 0.45, 0.16, 0.03));
    this.clock = new CanvasPanel(0.2, 0.2, { ppu: 400 });
    this.clock.mesh.position.set(0.16, 0.57, 0.212);
    lamp.add(this.clock.mesh);
    this.drawClock(17.5);
    reg('lamp', lamp, -1.95, -1.1);

    // 3 图像识别亭
    const kiosk = group(rbox(0.5, 0.1, 0.4, COLORS.sand, 0, 0, 0, 0.03), box(0.1, 0.72, 0.1, COLORS.inkSoft, 0, 0.1, -0.05));
    const frame = rbox(0.92, 0.7, 0.06, COLORS.ink, 0, 0.72, 0, 0.04);
    frame.rotation.x = -0.18;
    kiosk.add(frame);
    this.kioskScreen = new CanvasPanel(0.82, 0.6, { ppu: 300, lit: false });
    this.kioskScreen.mesh.position.set(0, 0, 0.032);
    frame.add(this.kioskScreen.mesh);
    const cam = rbox(0.16, 0.1, 0.1, COLORS.tech, 0, 0.36, 0.02, 0.03);
    cam.add(cyl(0.03, 0.03, 0.04, COLORS.ink, 0, -0.02, 0.06, 10));
    frame.add(cam);
    this.drawKiosk(0);
    reg('imaging', kiosk, 0.25, -1.4);

    // 4 人脸识别门禁
    const gate = group(box(0.14, 0.62, 0.14, COLORS.inkSoft, -0.5, 0, 0), box(0.14, 0.62, 0.14, COLORS.inkSoft, 0.5, 0, 0));
    this.gateArm = new THREE.Group();
    this.gateArm.position.set(-0.5, 0.52, 0.08);
    const bar = rbox(0.96, 0.06, 0.05, COLORS.coral, 0.48, -0.03, 0, 0.02);
    this.gateArm.add(bar, rbox(0.14, 0.07, 0.052, COLORS.cream, 0.3, -0.035, 0.002, 0.01), rbox(0.14, 0.07, 0.052, COLORS.cream, 0.66, -0.035, 0.002, 0.01));
    gate.add(this.gateArm);
    gate.add(box(0.08, 0.86, 0.08, COLORS.ink, 0.86, 0, 0.08));
    const term = rbox(0.36, 0.44, 0.07, COLORS.cream, 0.86, 0.72, 0.1, 0.04);
    term.rotation.x = -0.12;
    gate.add(term);
    this.faceScreen = new CanvasPanel(0.3, 0.34, { ppu: 300, lit: false });
    this.faceScreen.mesh.position.set(0, 0.02, 0.037);
    term.add(this.faceScreen.mesh);
    this.drawFace(0);
    reg('face', gate, 2.55, -1.2);

    // 5 自动驾驶汽车
    this.car = new THREE.Group();
    const car = this.car;
    car.add(rbox(1.02, 0.26, 0.52, COLORS.cream, 0, 0.1, 0, 0.09));
    car.add(rbox(0.56, 0.22, 0.46, '#A9C9D6', -0.06, 0.34, 0, 0.08));
    car.add(rbox(0.5, 0.14, 0.47, COLORS.ink, -0.06, 0.37, 0, 0.04, { roughness: 0.4 }));
    car.add(rbox(0.04, 0.08, 0.36, COLORS.mustard, 0.5, 0.2, 0, 0.015));
    [
      [-0.32, 0.25],
      [0.32, 0.25],
      [-0.32, -0.25],
      [0.32, -0.25],
    ].forEach(([x, z]) => {
      const w = cyl(0.12, 0.12, 0.09, COLORS.ink, 0, 0, 0, 16);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.12, z);
      w.add(cyl(0.05, 0.05, 0.1, COLORS.warmGray, 0, -0.05, 0, 10));
      car.add(w);
    });
    this.lidar = group(cyl(0.075, 0.085, 0.07, COLORS.ink, 0, 0, 0, 14), box(0.03, 0.03, 0.17, COLORS.coral, 0, 0.07, 0));
    this.lidar.position.set(-0.06, 0.56, 0);
    car.add(this.lidar);
    const carWrap = group(car);
    reg('car', carWrap, -1.6, 0.3, { dir: 'front' });
    // 检测框（演示时出现在斑马线行人标志上）
    this.detect = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.9, 0.3)), new THREE.LineBasicMaterial({ color: COLORS.coralDark }));
    this.detect.position.set(1.35, 0.5, 1.2);
    this.detect.visible = false;
    this.group.add(this.detect);

    // 6 智能交通信号灯
    const sig = group(cyl(0.035, 0.05, 1.55, COLORS.inkSoft, 0, 0, 0, 10), cyl(0.12, 0.14, 0.06, COLORS.inkSoft, 0, 0, 0, 12));
    sig.add(rbox(0.22, 0.6, 0.17, COLORS.ink, 0, 1.2, 0.06, 0.05));
    this.lights = [
      [COLORS.coral, 1.64],
      [COLORS.mustard, 1.47],
      ['#8FCF9F', 1.3],
    ].map(([c, y]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), glow(c, 0.05));
      m.position.set(0, y, 0.15);
      sig.add(m);
      return m;
    });
    const armS = box(0.5, 0.035, 0.035, COLORS.inkSoft, -0.25, 1.86, 0);
    sig.add(armS);
    this.sigCam = group(rbox(0.2, 0.11, 0.12, COLORS.tech, 0, -0.055, 0, 0.03), cyl(0.035, 0.035, 0.05, COLORS.ink, 0, 0, 0, 10));
    this.sigCam.children[1].rotation.x = Math.PI / 2;
    this.sigCam.children[1].position.set(0, 0, 0.08);
    this.sigCam.position.set(-0.5, 1.82, 0);
    this.sigCam.rotation.x = 0.35;
    sig.add(this.sigCam);
    this.sigPanel = new CanvasPanel(0.46, 0.22, { ppu: 300, lit: false });
    this.sigPanel.mesh.position.set(0, 0.98, 0.1);
    sig.add(this.sigPanel.mesh);
    this.drawSignal(2, 'idle');
    this.setLight(2);
    reg('signal', sig, 2.2, 1.35);

    // 7 光控路灯
    const sl = group(cyl(0.035, 0.05, 1.7, COLORS.inkSoft, 0, 0, 0, 10), cyl(0.12, 0.14, 0.06, COLORS.inkSoft, 0, 0, 0, 12));
    sl.add(box(0.5, 0.04, 0.04, COLORS.inkSoft, 0.22, 1.68, 0));
    sl.add(rbox(0.32, 0.07, 0.16, COLORS.ink, 0.42, 1.6, 0, 0.03));
    this.slMat = glow('#FFF3C4', 0);
    const slLight = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.12), this.slMat);
    slLight.position.set(0.42, 1.59, 0);
    sl.add(slLight);
    sl.add(ball(0.05, COLORS.tech, 0, 1.76, 0, 10, 8));
    this.slSign = new CanvasPanel(0.42, 0.22, { ppu: 300, lit: false });
    this.slSign.mesh.position.set(0, 0.9, 0.06);
    sl.add(this.slSign.mesh);
    this.drawSky(false);
    reg('streetlamp', sl, -3.25, 1.5);
  }

  buildProps() {
    this.pop(tree(1.35), -1.2, -3.25, { order: 2 });
    this.pop(coneTree(1.3), 1.5, -3.3, { order: 2 });
    this.pop(tree(1.15, COLORS.greenDark), 3.45, 1.9, { order: 2, dir: 'right' });
    this.pop(coneTree(1.05), -3.4, 3.05, { order: 2, dir: 'left' });
    this.pop(bush(0.22), -3.45, -0.25, { order: 2 });
    this.pop(bush(0.2), 3.5, -0.9, { order: 2 });
    this.pop(bench(), 2.45, 3.05, { order: 2, yaw: -0.35 });
    // 斑马线行人标志
    const ped = group(cyl(0.025, 0.03, 0.75, COLORS.inkSoft, 0, 0, 0, 8));
    const ps = sign(['行人', 'WALK'], { w: 0.34, h: 0.34, bg: COLORS.tech, fg: '#FFFFFF', radius: 0.5 });
    ps.position.set(0, 0.86, 0.02);
    ped.add(ps);
    this.pop(ped, 1.35, 1.2, { order: 2 });
  }

  // ---------- 屏幕绘制 ----------
  drawClock(hour) {
    this.clock.draw((ctx, W) => {
      ctx.fillStyle = '#FBF8F0';
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, W / 2 - 2, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 4;
      ctx.stroke();
      const a = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2;
      const b = (hour % 1) * Math.PI * 2 - Math.PI / 2;
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(W / 2, W / 2);
      ctx.lineTo(W / 2 + Math.cos(a) * W * 0.22, W / 2 + Math.sin(a) * W * 0.22);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.coralDark;
      ctx.beginPath();
      ctx.moveTo(W / 2, W / 2);
      ctx.lineTo(W / 2 + Math.cos(b) * W * 0.34, W / 2 + Math.sin(b) * W * 0.34);
      ctx.stroke();
    });
  }
  drawKiosk(p) {
    this.kioskScreen.draw((ctx, W, H) => {
      ctx.fillStyle = '#EEF4F2';
      ctx.fillRect(0, 0, W, H);
      // 一片叶子
      ctx.save();
      ctx.translate(W * 0.36, H * 0.52);
      ctx.rotate(-0.5);
      ctx.fillStyle = '#8FAE8B';
      ctx.beginPath();
      ctx.ellipse(0, 0, W * 0.2, H * 0.17, 0, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = '#5F7F65';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-W * 0.24, 0);
      ctx.lineTo(W * 0.2, 0);
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * W * 0.06, 0);
        ctx.lineTo(i * W * 0.06 + W * 0.04, -H * 0.1);
        ctx.moveTo(i * W * 0.06, 0);
        ctx.lineTo(i * W * 0.06 + W * 0.04, H * 0.1);
      }
      ctx.stroke();
      ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = 'rgba(95,147,171,0.35)';
        ctx.fillRect(0, H * p - 6, W, 12);
      }
      if (p > 0) {
        ctx.strokeStyle = COLORS.coralDark;
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(W * 0.1, H * 0.2, W * 0.52, H * 0.64);
        ctx.setLineDash([]);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${H * 0.1}px ${FONT_CN}`;
      ctx.textAlign = 'left';
      ctx.fillText(T('输入图像', 'Input image'), W * 0.66, H * 0.3, W * 0.32);
      if (p >= 1) {
        ctx.fillStyle = COLORS.techDark;
        roundRect(ctx, W * 0.65, H * 0.42, W * 0.31, H * 0.34, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${H * 0.095}px ${FONT_CN}`;
        ctx.fillText(T('预测:叶片', 'Leaf'), W * 0.67, H * 0.55, W * 0.28);
        ctx.fillText(T('可能性 92%', '92% likely'), W * 0.67, H * 0.68, W * 0.28);
      } else {
        ctx.fillStyle = COLORS.inkSoft;
        ctx.font = `500 ${H * 0.085}px ${FONT_CN}`;
        ctx.fillText(p > 0 ? T('识别中…', 'Scanning…') : T('等待识别', 'Waiting'), W * 0.66, H * 0.5, W * 0.32);
      }
    });
  }
  drawFace(state) {
    this.faceScreen.draw((ctx, W, H) => {
      ctx.fillStyle = state === 2 ? '#DCEEDD' : '#E9EFF1';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.42, W * 0.2, H * 0.24, 0, 0, 6.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H * 1.02, W * 0.34, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      if (state >= 1) {
        ctx.strokeStyle = state === 2 ? COLORS.mintDark : COLORS.coralDark;
        ctx.lineWidth = 4;
        const x0 = W * 0.2;
        const x1 = W * 0.8;
        const y0 = H * 0.1;
        const y1 = H * 0.74;
        const k = W * 0.12;
        [
          [x0, y0, 1, 1],
          [x1, y0, -1, 1],
          [x0, y1, 1, -1],
          [x1, y1, -1, -1],
        ].forEach(([x, y, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(x + sx * k, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + sy * k);
          ctx.stroke();
        });
      }
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = 'center';
      ctx.font = `700 ${H * 0.1}px ${FONT_CN}`;
      ctx.fillText([T('请正对摄像头', 'Face the camera'), T('比对特征中…', 'Comparing…'), T('已登记·通过', 'Registered · OK')][state], W / 2, H * 0.93, W * 0.94);
    });
  }
  drawSignal(cars, text) {
    this.sigPanel.draw((ctx, W, H) => {
      ctx.fillStyle = '#F4F1E8';
      roundRect(ctx, 0, 0, W, H, 10);
      ctx.fill();
      ctx.fillStyle = COLORS.ink;
      ctx.textAlign = 'center';
      ctx.font = `700 ${H * 0.3}px ${FONT_CN}`;
      ctx.fillText(T(`识别到 ${cars} 辆车`, `${cars} cars detected`), W / 2, H * 0.38, W * 0.94);
      ctx.fillStyle = COLORS.techDark;
      const msg = { idle: T('绿灯 20 秒', 'Green: 20 s'), calc: T('计算配时…', 'Adjusting…'), extend: T('延长绿灯 35 秒', 'Green: 35 s') }[text] || text;
      ctx.fillText(msg, W / 2, H * 0.8, W * 0.94);
    });
  }
  drawSky(night) {
    this.slSign.draw((ctx, W, H) => {
      ctx.fillStyle = night ? '#5E6E75' : '#F4F1E8';
      roundRect(ctx, 0, 0, W, H, 10);
      ctx.fill();
      ctx.fillStyle = night ? '#FFF3C4' : COLORS.mustard;
      ctx.beginPath();
      ctx.arc(W * 0.2, H / 2, H * 0.26, 0, 6.3);
      ctx.fill();
      if (night) {
        ctx.fillStyle = '#5E6E75';
        ctx.beginPath();
        ctx.arc(W * 0.26, H * 0.42, H * 0.22, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = night ? '#fff' : COLORS.ink;
      ctx.font = `700 ${H * 0.28}px ${FONT_CN}`;
      ctx.textAlign = 'left';
      ctx.fillText(night ? T('亮度低→开灯', 'Dark → on') : T('亮度高→关灯', 'Bright → off'), W * 0.38, H * 0.6, W * 0.6);
    });
  }
  setLight(i) {
    this.lights.forEach((m, k) => (m.material.emissiveIntensity = k === i ? 0.95 : 0.04));
  }

  // ---------- 交互 ----------
  onDevice(id) {
    this.select(this.byId[id].root);
    this.demo(id);
    this.ui.onDevice(id);
  }
  highlight(id) {
    const t = this.byId[id];
    if (t) this.select(t.root);
  }

  /** 每种设备的“输入→处理→输出”三维演示 */
  demo(id) {
    if (this._demo) this._demo.progress(1).kill();
    const tl = (this._demo = gsap.timeline());
    const p = { v: 0 };
    switch (id) {
      case 'speaker':
        this.waves.forEach((w, i) => {
          tl.fromTo(w.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 2.2, y: 2.2, z: 2.2, duration: 1.1, ease: 'power1.out' }, i * 0.3);
          tl.fromTo(w.material, { opacity: 0.9 }, { opacity: 0, duration: 1.1 }, i * 0.3);
        });
        tl.to(this.spRing.material, { emissiveIntensity: 1.1, duration: 0.25, yoyo: true, repeat: 5 }, 0.6);
        tl.to(this.spRing.material, { emissiveIntensity: 0.25, duration: 0.3 });
        break;
      case 'lamp':
        tl.to(p, { v: 1, duration: 1.6, ease: 'none', onUpdate: () => this.drawClock(17.5 + p.v * 1.5) });
        tl.to(this.bulbMat, { emissiveIntensity: 1.3, duration: 0.2 });
        tl.to(p, { v: 2, duration: 1.8, ease: 'none', onUpdate: () => this.drawClock(19 + (p.v - 1) * 3) }, '+=0.9');
        tl.to(this.bulbMat, { emissiveIntensity: 0, duration: 0.2 });
        tl.add(() => this.drawClock(17.5), '+=0.8');
        break;
      case 'imaging':
        tl.to(p, { v: 0.99, duration: 1.4, ease: 'none', onUpdate: () => this.drawKiosk(Math.max(p.v, 0.01)) });
        tl.add(() => this.drawKiosk(1));
        tl.add(() => this.drawKiosk(0), '+=4');
        break;
      case 'face':
        tl.add(() => this.drawFace(1));
        tl.add(() => this.drawFace(2), 1.1);
        tl.to(this.gateArm.rotation, { z: 1.35, duration: 0.6, ease: 'back.out(1.4)' }, 1.2);
        tl.to(this.gateArm.rotation, { z: 0, duration: 0.6, ease: 'power2.inOut' }, 3.4);
        tl.add(() => this.drawFace(0));
        break;
      case 'car':
        tl.to(this.lidar.rotation, { y: Math.PI * 6, duration: 3.4, ease: 'none' }, 0);
        tl.to(this.car.position, { x: 1.55, duration: 1.5, ease: 'power2.inOut' }, 0);
        tl.add(() => (this.detect.visible = true), 0.9);
        tl.to(this.detect.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 0.2, yoyo: true, repeat: 5 }, 0.9);
        tl.add(() => (this.detect.visible = false), 2.6);
        tl.to(this.car.position, { x: 0, duration: 1.6, ease: 'power2.inOut' }, 2.8);
        tl.set(this.lidar.rotation, { y: 0 });
        break;
      case 'signal':
        tl.to(this.sigCam.rotation, { y: 0.6, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
        [3, 5, 8].forEach((n, i) => tl.add(() => this.drawSignal(n, n > 5 ? 'extend' : 'calc'), 0.5 + i * 0.6));
        tl.add(() => this.setLight(1), 0.2);
        tl.add(() => this.setLight(2), 1.9);
        tl.add(() => {
          this.drawSignal(2, 'idle');
        }, 5);
        break;
      case 'streetlamp':
        tl.add(() => this.drawSky(true));
        tl.to(this.slMat, { emissiveIntensity: 1.3, duration: 0.3 }, 0.5);
        tl.add(() => this.drawSky(false), 3);
        tl.to(this.slMat, { emissiveIntensity: 0, duration: 0.3 }, 3.2);
        break;
      default:
    }
  }

  deactivate() {
    if (this._demo) this._demo.progress(1).kill();
    super.deactivate();
  }

  // ---------- 地面印刷 ----------
  drawGround(ctx, w, h, P) {
    const X = (x) => (x + STAGE.UX / 2) * P;
    const Z = (z) => (z + STAGE.UZ / 2) * P;
    ctx.fillStyle = '#EFE9DA';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,135,105,0.14)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 38) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    // 草地
    ctx.fillStyle = '#D3E2CB';
    roundRect(ctx, X(-3.7), Z(-3.6), 2.75 * P, 2.95 * P, 26);
    ctx.fill();
    roundRect(ctx, X(1.5), Z(-3.6), 2.2 * P, 2.0 * P, 26);
    ctx.fill();
    roundRect(ctx, X(-3.7), Z(1.2), 1.1 * P, 2.4 * P, 26);
    ctx.fill();
    roundRect(ctx, X(2.9), Z(1.2), 0.85 * P, 1.2 * P, 22);
    ctx.fill();
    // 道路
    ctx.fillStyle = '#C6C2B7';
    ctx.fillRect(0, Z(-0.4), w, 1.4 * P);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, Z(-0.4), w, 4);
    ctx.fillRect(0, Z(1.0) - 4, w, 4);
    for (let x = 12; x < w; x += 64) {
      if (x > X(0.8) && x < X(1.95)) continue;
      ctx.fillRect(x, Z(0.3) - 3, 34, 6);
    }
    // 斑马线
    for (let i = 0; i < 6; i++) ctx.fillRect(X(0.95) + i * 14, Z(-0.3), 8, 1.2 * P);
    // 入户小路
    ctx.fillStyle = '#F6F1E4';
    ctx.fillRect(X(-3.3), Z(-1.9), 0.42 * P, 1.5 * P);
    ctx.fillRect(X(-0.7), Z(-2.15), 0.42 * P, 1.75 * P);
    ctx.fillRect(X(2.5), Z(-2.0), 0.46 * P, 1.6 * P);
    // 小广场
    ctx.fillStyle = '#F6F1E4';
    ctx.beginPath();
    ctx.arc(X(0), Z(2.5), 1.55 * P, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(135,181,201,0.6)';
    ctx.lineWidth = 3;
    [1.5, 1.1, 0.7].forEach((r) => {
      ctx.beginPath();
      ctx.arc(X(0), Z(2.5), r * P, 0, 6.3);
      ctx.stroke();
    });
    // 设备编号印记
    const marks = [
      ['1', -3.05, -0.72],
      ['2', -1.95, -0.62],
      ['3', 0.25, -0.86],
      ['4', 2.55, -0.72],
      ['5', -1.6, 1.0],
      ['6', 2.2, 1.78],
      ['7', -3.25, 1.92],
    ];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    marks.forEach(([n, x, z]) => {
      ctx.fillStyle = COLORS.coralDark;
      ctx.beginPath();
      ctx.arc(X(x), Z(z), 13, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `700 17px ${FONT_CN}`;
      ctx.fillText(n, X(x), Z(z) + 1);
    });
  }
}
