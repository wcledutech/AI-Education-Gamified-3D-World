// 场景二：AI 训练实验室——人工智能怎样学会识别？
// 三维对象与真实实验状态绑定：样本卡片的位置反映当前训练数据，主机屏幕显示真实的训练数值。
import * as THREE from 'three';
import gsap from 'gsap';
import { BaseScene, pedestal } from './BaseScene.js';
import { PopUp } from '../book/PopUp.js';
import { COLORS, STAGE, FONT_CN, FONT_KAI } from '../utils/config.js';
import { mat, box, rbox, cyl, ball, group, sign, CanvasPanel, canvasTex, roundRect, shadow } from '../utils/three-helpers.js';
import { makeHuman } from '../characters/CharacterFactory.js';

const STAND = { x: -1.85, y: 0.5, z: -1.5, lean: 0.3 };
const TRAY = { cat: [-2.72, 0.56, 0.5], dog: [-0.98, 0.56, 0.5] };
const EASEL = [-1.85, 1.02, 0.68];
const RACK = { x: 2.5, y: 0.1, z: 2.98, lean: 0.95 };
const TESTPOS = [1.9, 0.9, 0.5];
const LABEL_COLOR = { cat: COLORS.techDark, dog: COLORS.coralDark };

export class AITrainingScene extends BaseScene {
  build() {
    this.dataset = this.app.dataset;
    this.buildRoom();
    this.buildStations();
    this.buildCards();
    const d = this.def.characters;
    this.addCharacter(makeHuman(d.student, { top: COLORS.mint, bottom: '#6B7C86', hair: '#3E3530', hairStyle: 'bob', pack: null }), -0.4, 2.5, 0.25);
    this.addCharacter(makeHuman(d.mentor, { top: COLORS.cream, coat: '#F4F1EA', bottom: '#4E5D66', hair: '#5A4A40', glasses: true, prop: 'clipboard', scale: 0.92 }), 0.72, 2.62, -0.2);
  }

  station(root, x, z, id, label, opts = {}) {
    const p = this.pop(root, x, z, { order: 1, ...opts });
    this.clickable(root, { id, label, hint: '点击了解它的作用', onClick: () => this.ui.onStation(id) });
    return p;
  }

  buildRoom() {
    // 背景墙（一整块立起的纸板）
    const wall = group(rbox(7.3, 2.5, 0.08, '#F1EADB', 0, 0, 0, 0.03));
    const poster = new CanvasPanel(3.0, 1.1, { ppu: 150 });
    poster.draw((ctx, W, H) => {
      ctx.fillStyle = '#FBF8F0';
      roundRect(ctx, 0, 0, W, H, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52,67,74,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      const steps = ['数据', '标签', '训练', '模型', '预测'];
      const cols = [COLORS.tech, COLORS.mint, COLORS.coral, COLORS.mustard, COLORS.green];
      steps.forEach((s, i) => {
        const x = W * (0.1 + i * 0.2);
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        ctx.arc(x, H * 0.55, H * 0.2, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = COLORS.ink;
        ctx.font = `700 ${H * 0.17}px ${FONT_CN}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s, x, H * 0.56);
        if (i < 4) {
          ctx.strokeStyle = COLORS.inkSoft;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + H * 0.25, H * 0.55);
          ctx.lineTo(x + W * 0.2 - H * 0.25, H * 0.55);
          ctx.stroke();
        }
      });
      ctx.fillStyle = COLORS.inkSoft;
      ctx.font = `600 ${H * 0.12}px ${FONT_KAI}`;
      ctx.fillText('机器学习：让计算机从数据中找到规律', W / 2, H * 0.14);
    });
    poster.mesh.position.set(1.9, 1.75, 0.05);
    wall.add(poster.mesh);
    wall.add(rbox(7.3, 0.5, 0.1, '#D9CDB8', 0, 0, 0.01, 0.02));
    // 窗
    wall.add(rbox(1.5, 1.0, 0.03, COLORS.cream, -2.4, 1.2, 0.045, 0.03));
    wall.add(rbox(1.36, 0.86, 0.035, '#CFE3EC', -2.4, 1.27, 0.05, 0.02));
    wall.add(box(0.03, 0.86, 0.04, COLORS.cream, -2.4, 1.27, 0.055));
    this.pop(wall, 0, -3.55, { order: 0 });
  }

  buildStations() {
    // --- 样本展示台 ---
    const stand = new THREE.Group();
    const board = rbox(3.2, 2.62, 0.06, '#E7EEF0', 0, 0, 0, 0.03);
    board.position.set(0, STAND.y + (2.62 / 2) * Math.cos(STAND.lean), -(2.62 / 2) * Math.sin(STAND.lean) - 0.035);
    board.rotation.x = -STAND.lean;
    stand.add(board);
    stand.add(rbox(3.2, 0.5, 0.5, COLORS.sand, 0, 0, -0.2, 0.03));
    [-1.4, 1.4].forEach((x) => {
      const leg = box(0.06, 2.4, 0.06, COLORS.warmGray, x, 0, -0.95);
      leg.rotation.x = 0.12;
      stand.add(leg);
    });
    const hs = sign('训练样本 · 20 张', { w: 1.5, h: 0.24, bg: COLORS.cream, border: COLORS.techDark });
    hs.position.set(0, 0.26, 0.055);
    stand.add(hs);
    this.station(stand, STAND.x, STAND.z, 'stand', '数据样本展示台');

    // --- 图像标注工作台 + 两个收纳盒 ---
    const table = group(rbox(3.4, 0.5, 1.0, '#EADFCB', 0, 0, 0, 0.04), rbox(3.5, 0.06, 1.08, COLORS.sand, 0, 0.5, 0, 0.02));
    const tray = (x, cls, name) => {
      const c = LABEL_COLOR[cls];
      const t = group(rbox(1.36, 0.04, 0.86, c, x, 0.56, 0, 0.02));
      t.add(rbox(1.36, 0.16, 0.04, c, x, 0.56, 0.43, 0.02), rbox(1.36, 0.3, 0.04, c, x, 0.56, -0.43, 0.02));
      t.add(rbox(0.04, 0.2, 0.86, c, x - 0.68, 0.56, 0, 0.02), rbox(0.04, 0.2, 0.86, c, x + 0.68, 0.56, 0, 0.02));
      const s = sign(name, { w: 0.5, h: 0.26, bg: COLORS.cream, border: c, font: FONT_KAI });
      s.position.set(x, 0.3, 0.505);
      t.add(s);
      return t;
    };
    table.add(tray(-0.87, 'cat', '猫'), tray(0.87, 'dog', '狗'));
    // 标注位小画架
    table.add(rbox(0.3, 0.06, 0.22, COLORS.ink, 0, 0.56, 0.2, 0.02));
    const back = rbox(0.1, 0.5, 0.03, COLORS.inkSoft, 0, 0.6, 0.1, 0.01);
    back.rotation.x = -0.25;
    table.add(back);
    this.station(table, -1.85, 0.5, 'label', '图像标注工作台');

    // --- AI 训练主机 ---
    const host = group(rbox(1.3, 2.0, 0.8, '#6E828C', 0, 0, 0, 0.05));
    host.add(rbox(1.14, 0.78, 0.04, COLORS.ink, 0, 1.08, 0.4, 0.04, { roughness: 0.5 }));
    this.hostScreen = new CanvasPanel(1.04, 0.68, { ppu: 260, lit: false });
    this.hostScreen.mesh.position.set(0, 1.47, 0.425);
    host.add(this.hostScreen.mesh);
    this.leds = [...Array(6)].map((_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: COLORS.mint, emissive: COLORS.mint, emissiveIntensity: 0.05 }));
      m.position.set(-0.45 + i * 0.18, 0.9, 0.41);
      host.add(m);
      return m;
    });
    for (let i = 0; i < 4; i++) host.add(rbox(1.0, 0.05, 0.03, '#566A74', 0, 0.2 + i * 0.14, 0.4, 0.01));
    const hsg = sign('AI 训练主机', { w: 0.9, h: 0.2, bg: COLORS.cream, border: COLORS.ink });
    hsg.position.set(0, 2.14, 0.3);
    host.add(hsg, box(0.04, 0.1, 0.04, COLORS.ink, 0, 2.0, 0.3));
    this.station(host, 1.3, -2.55, 'host', 'AI 训练主机');
    this.drawHost({ state: 'idle' });

    // --- 模型（纸艺“神经网络”）---
    const model = group(pedestal(0.8, 0.5, 0.7));
    this.net = new THREE.Group();
    this.net.position.y = 1.2;
    const layers = [3, 4, 2];
    const cols = [COLORS.tech, COLORS.coral, COLORS.mint];
    const nodes = layers.map((n, li) =>
      [...Array(n)].map((_, i) => {
        const y = (i - (n - 1) / 2) * 0.27;
        const m = ball(0.085, cols[li], (li - 1) * 0.3, y, 0, 12, 10, { emissive: cols[li], emissiveIntensity: 0.05 });
        this.net.add(m);
        return m;
      })
    );
    this.netNodes = nodes.flat();
    const linkMat = mat(COLORS.inkSoft);
    for (let li = 0; li < 2; li++)
      nodes[li].forEach((a) =>
        nodes[li + 1].forEach((b) => {
          const d = b.position.clone().sub(a.position);
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, d.length(), 5), linkMat);
          l.position.copy(a.position).add(d.clone().multiplyScalar(0.5));
          l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
          this.net.add(l);
        })
      );
    model.add(this.net);
    const ms = sign('模型', { w: 0.5, h: 0.2, bg: COLORS.cream, border: COLORS.coralDark });
    ms.position.set(0, 0.26, 0.36);
    model.add(ms);
    this.station(model, 3.0, -2.0, 'model', '模型训练设备');

    // --- 测试平台 + 预测结果显示屏 ---
    const test = group(rbox(1.1, 0.5, 0.85, '#DCE9DF', 0, 0, 0, 0.04), rbox(1.2, 0.06, 0.95, COLORS.mintDark, 0, 0.5, 0, 0.02));
    [-0.5, 0.5].forEach((x) => test.add(box(0.06, 1.0, 0.06, COLORS.inkSoft, x, 0.56, -0.2)));
    test.add(rbox(1.12, 0.1, 0.14, COLORS.inkSoft, 0, 1.5, -0.2, 0.03));
    this.scanLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.05), new THREE.MeshStandardMaterial({ color: COLORS.mint, emissive: COLORS.mint, emissiveIntensity: 0.1 }));
    this.scanLight.position.set(0, 1.49, -0.2);
    test.add(this.scanLight);
    const ts = sign('测试平台', { w: 0.7, h: 0.2, bg: COLORS.cream, border: COLORS.mintDark });
    ts.position.set(0, 0.26, 0.43);
    test.add(ts);
    test.add(box(0.06, 1.0, 0.06, COLORS.inkSoft, 1.22, 0, -0.3));
    const frame = rbox(1.4, 0.92, 0.06, COLORS.ink, 1.22, 0.92, -0.26, 0.04, { roughness: 0.5 });
    frame.rotation.y = -0.3;
    test.add(frame);
    this.resultScreen = new CanvasPanel(1.28, 0.8, { ppu: 240, lit: false });
    this.resultScreen.mesh.position.set(0, 0, 0.035);
    frame.add(this.resultScreen.mesh);
    this.station(test, 1.9, 0.5, 'test', '测试平台');
    this.drawResult(null);

    // --- 测试样本架 ---
    const rack = new THREE.Group();
    const rb = rbox(2.2, 0.98, 0.05, '#DCE9DF', 0, 0, 0, 0.02);
    rb.position.set(0, RACK.y + 0.47 * Math.cos(RACK.lean), -0.47 * Math.sin(RACK.lean) - 0.03);
    rb.rotation.x = -RACK.lean;
    rack.add(rb, box(2.2, 0.12, 0.1, COLORS.mintDark, 0, 0, 0.03));
    const rs = sign('测试样本 · 10 张（不参与训练）', { w: 1.9, h: 0.16, bg: COLORS.cream, fg: COLORS.ink });
    rs.rotation.x = -Math.PI / 2;
    rs.position.set(0, 0.012, 0.22);
    rack.add(rs);
    this.station(rack, RACK.x, RACK.z, 'rack', '测试样本架', { dir: 'front' });
  }

  // ---------- 样本卡片 ----------
  buildCards() {
    this.cardsPop = new PopUp(0, 0, { order: 2 });
    this.group.add(this.cardsPop);
    this.popups.push(this.cardsPop);
    this.cards = {};
    const side = mat(COLORS.cream);
    const mk = (s, size) => {
      const front = new THREE.MeshStandardMaterial({ map: canvasTex(s.canvas), roughness: 0.9 });
      const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.02), [side, side, side, side, front, side]));
      const tag = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.14, 0.024), new THREE.MeshStandardMaterial({ color: COLORS.tech, roughness: 0.9 }));
      tag.position.y = size * 0.5 + size * 0.05;
      tag.visible = false;
      tag.userData.noOutline = true;
      m.add(tag);
      const card = { id: s.id, mesh: m, tag, front, sample: s, where: 'home' };
      this.cards[s.id] = card;
      this.cardsPop.add(m);
      this.clickable(m, { id: s.id, label: s.set === 'train' ? `训练样本 ${s.id}` : `测试样本 ${s.id}`, hint: s.set === 'train' ? '点击选择并标注' : '点击送去测试', onClick: () => this.ui.onSample(s.id) });
      return card;
    };
    this.dataset.train.forEach((s, i) => {
      const c = mk(s, 0.5);
      c.home = this.standSlot(i);
      this.place(c, c.home, 0);
    });
    this.dataset.test.forEach((s, i) => {
      const c = mk(s, 0.36);
      c.home = this.rackSlot(i);
      this.place(c, c.home, 0);
    });
  }
  standSlot(i) {
    const c = i % 5;
    const r = Math.floor(i / 5);
    const v = 0.38 + (3 - r) * 0.585;
    return { pos: [STAND.x + (c - 2) * 0.59, STAND.y + v * Math.cos(STAND.lean), STAND.z - v * Math.sin(STAND.lean) + 0.02], rx: -STAND.lean, scale: 1 };
  }
  rackSlot(i) {
    const c = i % 5;
    const r = Math.floor(i / 5);
    const v = 0.24 + (1 - r) * 0.42;
    return { pos: [RACK.x + (c - 2) * 0.42, RACK.y + v * Math.cos(RACK.lean) + 0.03, RACK.z - v * Math.sin(RACK.lean)], rx: -RACK.lean, scale: 1 };
  }
  traySlot(cls, k) {
    const [x, y, z] = TRAY[cls];
    return { pos: [x + (k % 2 ? 0.32 : -0.32), y + 0.3, z - 0.3 + Math.floor(k / 2) * 0.072], rx: -0.22, scale: 1 };
  }
  place(card, slot, duration = 0.55, delay = 0) {
    const m = card.mesh;
    gsap.killTweensOf([m.position, m.rotation, m.scale]);
    if (!duration) {
      m.position.set(...slot.pos);
      m.rotation.set(slot.rx, 0, 0);
      m.scale.setScalar(slot.scale);
      return;
    }
    const [x, y, z] = slot.pos;
    gsap.to(m.position, { x, z, duration, delay, ease: 'power2.inOut' });
    gsap.to(m.position, { y: Math.max(y, m.position.y) + 0.5, duration: duration / 2, delay, ease: 'power2.out' });
    gsap.to(m.position, { y, duration: duration / 2, delay: delay + duration / 2, ease: 'power2.in' });
    gsap.to(m.rotation, { x: slot.rx, y: 0, z: 0, duration, delay, ease: 'power2.inOut' });
    gsap.to(m.scale, { x: slot.scale, y: slot.scale, z: slot.scale, duration, delay, ease: 'power2.inOut' });
  }

  /**
   * 让训练卡片的位置反映“当前实际用于训练的数据”。
   * @param labels {id: 'cat'|'dog'}  @param excluded [id]（被移出训练集的样本）  @param focusId 正在标注的样本
   */
  syncCards(labels, excluded = [], focusId = null, animate = true) {
    const count = { cat: 0, dog: 0 };
    this.dataset.train.forEach((s, i) => {
      const card = this.cards[s.id];
      const label = labels[s.id];
      const out = excluded.includes(s.id);
      let slot;
      let where;
      if (s.id === focusId) {
        slot = { pos: EASEL, rx: -0.25, scale: 1.3 };
        where = 'easel';
      } else if (label && !out) {
        slot = this.traySlot(label, count[label]++);
        where = label + ':' + (count[label] - 1);
      } else {
        slot = card.home;
        where = 'home';
      }
      card.tag.visible = !!label;
      if (label) card.tag.material.color.set(LABEL_COLOR[label]);
      card.front.color.set(out ? '#9A9A9A' : '#FFFFFF');
      if (card.where !== where) {
        card.where = where;
        this.place(card, slot, animate ? 0.55 : 0, animate ? (i % 6) * 0.03 : 0);
      }
    });
  }

  /** 把一张测试卡送上测试平台（其余放回样本架） */
  showTest(id, result) {
    this.dataset.test.forEach((s) => {
      const card = this.cards[s.id];
      const on = s.id === id;
      const where = on ? 'platform' : 'home';
      if (card.where !== where) {
        card.where = where;
        this.place(card, on ? { pos: TESTPOS, rx: -0.12, scale: 1.7 } : card.home, 0.5);
      }
    });
    if (id) {
      gsap.fromTo(this.scanLight.material, { emissiveIntensity: 1.2 }, { emissiveIntensity: 0.1, duration: 0.9 });
    }
    this.drawResult(result);
  }

  // ---------- 屏幕 ----------
  drawHost(info) {
    this.hostInfo = info;
    this.hostScreen.draw((ctx, W, H) => {
      ctx.fillStyle = '#22303A';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#BFE3D0';
      ctx.font = `700 ${H * 0.12}px ${FONT_CN}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const title = { idle: '等待训练数据', training: '正在训练…', done: '训练完成', error: '训练失败' }[info.state];
      ctx.fillText(title, W * 0.06, H * 0.17);
      ctx.font = `500 ${H * 0.085}px ${FONT_CN}`;
      ctx.fillStyle = '#E8F1EC';
      if (info.state === 'idle') {
        ctx.fillText('标注样本后点击“开始训练”', W * 0.06, H * 0.34);
        return;
      }
      if (info.state === 'error') {
        ctx.fillStyle = '#F2B8A8';
        ctx.fillText(String(info.message || '').slice(0, 22), W * 0.06, H * 0.34);
        return;
      }
      ctx.fillText(`第 ${info.epoch}/${info.total} 轮   损失 ${info.loss.toFixed(3)}`, W * 0.06, H * 0.32);
      ctx.fillText(`训练集正确率 ${(info.acc * 100).toFixed(0)}%   样本 ${info.samples}`, W * 0.06, H * 0.44);
      // 真实的损失曲线
      const hist = info.history || [];
      const x0 = W * 0.06;
      const y0 = H * 0.92;
      const gw = W * 0.88;
      const gh = H * 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0 - gh, gw, gh);
      if (hist.length > 1) {
        const mx = Math.max(...hist, 0.7);
        ctx.strokeStyle = '#E6A18C';
        ctx.lineWidth = 4;
        ctx.beginPath();
        hist.forEach((v, i) => {
          const x = x0 + (i / (info.total - 1)) * gw;
          const y = y0 - (v / mx) * gh * 0.94;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
    });
  }
  drawResult(r) {
    this.resultScreen.draw((ctx, W, H) => {
      ctx.fillStyle = '#F4F1E8';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLORS.inkSoft;
      ctx.font = `600 ${H * 0.11}px ${FONT_CN}`;
      ctx.fillText('预测结果显示屏', W / 2, H * 0.13);
      if (!r) {
        ctx.fillStyle = COLORS.ink;
        ctx.font = `600 ${H * 0.12}px ${FONT_CN}`;
        ctx.fillText('把测试样本放上平台', W / 2, H * 0.5);
        return;
      }
      const name = { cat: '猫', dog: '狗' };
      ctx.fillStyle = LABEL_COLOR[r.pred];
      ctx.font = `700 ${H * 0.26}px ${FONT_KAI}`;
      ctx.fillText(`预测：${name[r.pred]}`, W / 2, H * 0.4);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `600 ${H * 0.115}px ${FONT_CN}`;
      ctx.fillText(`置信度 ${(r.conf * 100).toFixed(0)}%    实际：${name[r.actual]}`, W / 2, H * 0.64);
      ctx.fillStyle = r.correct ? COLORS.mintDark : COLORS.coralDark;
      roundRect(ctx, W * 0.28, H * 0.75, W * 0.44, H * 0.17, 14);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(r.correct ? '预测正确' : '预测错误', W / 2, H * 0.84);
    });
  }

  /** 训练状态（由真实训练过程驱动） */
  setTraining(on) {
    this.trainingOn = on;
    if (!on) {
      this.leds.forEach((m) => (m.material.emissiveIntensity = 0.05));
      this.netNodes.forEach((m) => (m.material.emissiveIntensity = 0.05));
    }
  }

  highlight(id) {
    const t = this.byId[id];
    if (t) this.select(t.root);
  }

  update(dt, t) {
    super.update(dt, t);
    if (this.trainingOn) {
      this.net.rotation.y += dt * 1.6;
      this.leds.forEach((m, i) => (m.material.emissiveIntensity = 0.15 + 0.9 * Math.max(0, Math.sin(t * 9 - i * 0.9))));
      this.netNodes.forEach((m, i) => (m.material.emissiveIntensity = 0.1 + 0.5 * Math.max(0, Math.sin(t * 6 + i))));
    }
  }

  drawGround(ctx, w, h, P) {
    const X = (x) => (x + STAGE.UX / 2) * P;
    const Z = (z) => (z + STAGE.UZ / 2) * P;
    ctx.fillStyle = '#F1ECDF';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,135,105,0.18)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= w; i += 76) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    const zone = (x, z, ww, dd, color, label) => {
      ctx.fillStyle = color;
      roundRect(ctx, X(x), Z(z), ww * P, dd * P, 24);
      ctx.fill();
      ctx.fillStyle = 'rgba(52,67,74,0.6)';
      ctx.font = `700 22px ${FONT_CN}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, X(x) + 14, Z(z + dd) - 34);
    };
    zone(-3.65, -3.0, 3.6, 4.35, 'rgba(135,181,201,0.28)', '① 数据区：样本与标注');
    zone(0.3, -3.3, 3.35, 2.35, 'rgba(230,161,140,0.26)', '② 训练区');
    zone(1.05, -0.2, 2.6, 3.75, 'rgba(184,214,191,0.42)', '③ 测试区');
    // 流程箭头
    ctx.strokeStyle = 'rgba(52,67,74,0.45)';
    ctx.fillStyle = 'rgba(52,67,74,0.45)';
    ctx.lineWidth = 5;
    const arrow = (x1, z1, x2, z2) => {
      ctx.beginPath();
      ctx.moveTo(X(x1), Z(z1));
      ctx.lineTo(X(x2), Z(z2));
      ctx.stroke();
      const a = Math.atan2(Z(z2) - Z(z1), X(x2) - X(x1));
      ctx.beginPath();
      ctx.moveTo(X(x2), Z(z2));
      ctx.lineTo(X(x2) - 16 * Math.cos(a - 0.5), Z(z2) - 16 * Math.sin(a - 0.5));
      ctx.lineTo(X(x2) - 16 * Math.cos(a + 0.5), Z(z2) - 16 * Math.sin(a + 0.5));
      ctx.closePath();
      ctx.fill();
    };
    arrow(-0.3, -1.6, 0.5, -1.9);
    arrow(1.9, -0.85, 1.9, -0.3);
    ctx.fillStyle = '#F6F1E4';
    ctx.beginPath();
    ctx.arc(X(0.15), Z(2.6), 1.0 * P, 0, 6.3);
    ctx.fill();
  }
}
