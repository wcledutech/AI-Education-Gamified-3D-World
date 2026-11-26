// 场景三：AI 判断中心——人工智能说的都对吗？（纸艺展馆风格）
import * as THREE from 'three';
import gsap from 'gsap';
import { BaseScene, pedestal, tree } from './BaseScene.js';
import { COLORS, STAGE, FONT_CN, FONT_KAI } from '../utils/config.js';
import { box, rbox, cyl, ball, group, sign, CanvasPanel, roundRect, wrapText } from '../utils/three-helpers.js';
import { makeHuman, makeRobot } from '../characters/CharacterFactory.js';
import { T } from '../utils/i18n.js';

const VERDICT_ANGLE = { no: 1.05, unsure: 0, yes: -1.05 };

export class AIVerificationScene extends BaseScene {
  build() {
    this.buildHall();
    this.buildStations();
    const d = this.def.characters;
    this.addCharacter(makeHuman(d.student, { top: COLORS.coral, bottom: '#56666F', hair: '#2F2A28', hairStyle: 'pony' }), -1.45, 2.5, 0.3);
    this.addCharacter(makeHuman(d.teacher, { top: '#7F9C8A', coat: '#8FAE9A', bottom: '#4E5D66', hair: '#6B5B4E', hairStyle: 'bun', glasses: true, scale: 0.92 }), -0.3, 2.7, 0.05);
    this.addCharacter(makeRobot(d.assistant, { accent: COLORS.coral, light: '#FBE3B0' }), 1.95, -1.3, -0.35, 2);
  }

  station(root, x, z, id, label, opts = {}) {
    const p = this.pop(root, x, z, { order: 1, ...opts });
    this.clickable(root, { id, label, hint: ['点击了解它的作用', 'Click to learn what it does'], onClick: () => this.ui.onStation(id) });
    return p;
  }

  buildHall() {
    const wall = group(rbox(7.3, 2.7, 0.08, '#F1EADB', 0, 0, 0, 0.03));
    [-3.3, 3.3].forEach((x) => wall.add(rbox(0.4, 2.7, 0.2, '#E2D6BE', x, 0, 0.06, 0.04)));
    wall.add(rbox(7.3, 0.36, 0.2, '#E2D6BE', 0, 2.5, 0.06, 0.04));
    const banner = sign(['AI 判断中心 · 先核验，再相信', 'AI Fact-Check Center · check first, then trust'], { w: 4.2, h: 0.34, bg: COLORS.cream, border: COLORS.coralDark, font: FONT_KAI });
    banner.position.set(0, 2.14, 0.17);
    wall.add(banner);
    this.pop(wall, 0, -3.56, { order: 0 });
  }

  buildStations() {
    // --- 书籍资料柜 ---
    const shelf = group(rbox(1.7, 2.2, 0.55, COLORS.brown, 0, 0, 0, 0.03));
    const bookCols = [COLORS.tech, COLORS.coral, COLORS.mint, COLORS.mustard, COLORS.cream, COLORS.greenDark, COLORS.techDark];
    for (let r = 0; r < 3; r++) {
      shelf.add(box(1.54, 0.56, 0.06, '#8E6B4C', 0, 0.2 + r * 0.66, 0.26));
      let x = -0.7;
      let k = r * 3;
      while (x < 0.62) {
        const w = 0.1 + ((k * 7) % 5) * 0.022;
        const h = 0.36 + ((k * 5) % 4) * 0.045;
        shelf.add(rbox(w, h, 0.3, bookCols[k % bookCols.length], x + w / 2, 0.22 + r * 0.66, 0.2, 0.012));
        x += w + 0.016;
        k += 1;
      }
    }
    const shs = sign(['资料柜', 'Archive'], { w: 0.7, h: 0.2, bg: COLORS.cream, border: COLORS.brown });
    shs.position.set(0, 2.32, 0.2);
    shelf.add(shs, box(0.04, 0.12, 0.04, COLORS.brown, 0, 2.2, 0.2));
    this.station(shelf, -2.7, -2.8, 'shelf', ['书籍资料柜', 'Book archive']);

    // --- 信息展示屏（显示当前 AI 回答）---
    const scr = group(rbox(1.2, 0.1, 0.5, COLORS.sand, 0, 0, 0, 0.03), box(0.12, 0.6, 0.12, COLORS.inkSoft, 0, 0.1, 0));
    scr.add(rbox(2.9, 1.7, 0.08, COLORS.ink, 0, 0.62, 0, 0.05, { roughness: 0.5 }));
    this.infoScreen = new CanvasPanel(2.76, 1.56, { ppu: 170, lit: false });
    this.infoScreen.mesh.position.set(0, 1.47, 0.045);
    scr.add(this.infoScreen.mesh);
    this.station(scr, 0.05, -2.85, 'screen', ['信息展示屏', 'Information screen']);
    this.drawInfo(null);

    // --- AI 信息咨询台 ---
    const desk = group(rbox(1.5, 0.75, 0.6, '#E4EEF0', 0, 0, 0, 0.06), rbox(1.6, 0.06, 0.7, COLORS.tech, 0, 0.75, 0, 0.02));
    const ds = sign(['AI 信息咨询台', 'AI Information Desk'], { w: 1.2, h: 0.24, bg: COLORS.cream, border: COLORS.techDark });
    ds.position.set(0, 0.4, 0.305);
    desk.add(ds);
    desk.add(cyl(0.02, 0.02, 0.3, COLORS.ink, 0.5, 0.81, 0, 6), ball(0.07, COLORS.mustard, 0.5, 1.15, 0, 10, 8));
    this.station(desk, 2.75, -2.45, 'desk', ['AI 信息咨询台', 'AI information desk']);

    // --- 资料检索台 ---
    const search = group(rbox(1.4, 0.6, 0.75, '#EADFCB', 0, 0, 0, 0.04), rbox(1.5, 0.05, 0.85, COLORS.sand, 0, 0.6, 0, 0.02));
    const mon = rbox(0.7, 0.46, 0.05, COLORS.ink, -0.2, 0.78, -0.1, 0.03);
    mon.rotation.x = -0.15;
    search.add(mon, box(0.08, 0.14, 0.08, COLORS.inkSoft, -0.2, 0.65, -0.14));
    const monScreen = sign(['🔍 检索资料', '🔍 Search'], { w: 0.62, h: 0.38, bg: '#E9EFF1', fg: COLORS.ink, size: 0.3, radius: 0.08, lit: false });
    monScreen.position.set(0, 0, 0.03);
    mon.add(monScreen);
    search.add(rbox(0.5, 0.03, 0.2, COLORS.warmGray, -0.2, 0.65, 0.22, 0.01));
    // 卡片目录盒
    search.add(rbox(0.36, 0.26, 0.4, COLORS.brown, 0.42, 0.65, 0, 0.02));
    [0, 1, 2].forEach((i) => search.add(rbox(0.3, 0.2 + i * 0.03, 0.02, COLORS.cream, 0.42, 0.72, -0.1 + i * 0.1, 0.005)));
    const ss = sign(['资料检索台', 'Search desk'], { w: 0.9, h: 0.2, bg: COLORS.cream, border: COLORS.brown });
    ss.position.set(0, 0.3, 0.38);
    search.add(ss);
    this.station(search, -2.8, -0.75, 'search', ['资料检索台', 'Search desk']);

    // --- 证据核验区：桌面 + 证据卡 + 可展开的核验装置 ---
    const table = group(rbox(2.5, 0.5, 1.3, '#DCE9DF', 0, 0, 0, 0.05), rbox(2.62, 0.06, 1.42, COLORS.mintDark, 0, 0.5, 0, 0.02));
    const ts = sign(['证据核验区', 'Evidence check'], { w: 0.9, h: 0.2, bg: COLORS.cream, border: COLORS.mintDark });
    ts.position.set(0, 0.26, 0.655);
    table.add(ts);
    this.station(table, -0.15, 0.3, 'evidence', ['证据核验区', 'Evidence checking area']);
    // 核验装置（像一本会打开的小册子，展开后升起放大镜）
    const dev = group(rbox(0.7, 0.06, 0.5, COLORS.ink, 0, 0, 0, 0.02));
    this.devLid = new THREE.Group();
    this.devLid.position.set(0, 0.06, -0.25);
    this.devLid.add(rbox(0.7, 0.04, 0.5, COLORS.techDark, 0, 0, 0.25, 0.02));
    dev.add(this.devLid);
    this.devArm = new THREE.Group();
    this.devArm.position.set(0, 0.06, 0.05);
    this.devArm.add(cyl(0.015, 0.015, 0.36, COLORS.inkSoft, 0, 0, 0, 6));
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 24), ball(0.01, COLORS.mustard).material);
    lens.position.y = 0.5;
    this.devArm.add(lens);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshStandardMaterial({ color: '#DDEFF5', transparent: true, opacity: 0.55, roughness: 0.2 }));
    glass.position.y = 0.5;
    glass.userData.noOutline = true;
    this.devArm.add(glass);
    this.devArm.scale.y = 0.01;
    dev.add(this.devArm);
    const devPop = this.pop(dev, -0.15, 0.1, { order: 2 });
    devPop.base.y = 0.56;
    devPop.apply();
    // 证据卡（最多 4 张）
    this.evCards = [0, 1, 2, 3].map((i) => {
      const holder = new THREE.Group();
      const card = rbox(0.56, 0.72, 0.025, COLORS.cream, 0, 0, 0, 0.012);
      const panel = new CanvasPanel(0.52, 0.68, { ppu: 300 });
      panel.mesh.position.set(0, 0.36, 0.014);
      card.rotation.x = -0.5;
      card.add(panel.mesh);
      panel.mesh.position.set(0, 0, 0.014);
      holder.add(card);
      const pop = this.pop(holder, -1.05 + i * 0.6, 0.72, { order: 2 });
      pop.base.y = 0.58;
      pop.apply();
      this.clickable(holder, { id: 'ev' + i, label: () => T(`证据卡 ${i + 1}`, `Evidence card ${i + 1}`), hint: ['点击选择 / 取消', 'Click to select / deselect'], onClick: () => this.ui.onEvidenceCard(i) });
      return { holder, card, panel, pop };
    });
    this.setEvidence([], []);

    // --- 事实判断仪表 ---
    const gauge = group(pedestal(0.9, 0.5, 0.6), box(0.08, 0.5, 0.08, COLORS.inkSoft, 0, 0.55, 0));
    gauge.add(rbox(1.7, 1.02, 0.08, COLORS.cream, 0, 1.0, 0, 0.05));
    const dial = new CanvasPanel(1.6, 0.92, { ppu: 220 });
    dial.draw((ctx, W, H) => {
      ctx.fillStyle = '#FBF8F0';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.86;
      const R = H * 0.7;
      const zones = [
        [Math.PI, Math.PI * 1.333, COLORS.coral, T('不支持', 'Not supported')],
        [Math.PI * 1.333, Math.PI * 1.667, COLORS.sand, T('证据不足', 'Not enough')],
        [Math.PI * 1.667, Math.PI * 2, COLORS.mint, T('支持', 'Supported')],
      ];
      zones.forEach(([a, b, c, label]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a, b);
        ctx.closePath();
        ctx.fill();
        const m = (a + b) / 2;
        ctx.fillStyle = COLORS.ink;
        ctx.font = `700 ${H * 0.1}px ${FONT_CN}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx + Math.cos(m) * R * 0.68, cy + Math.sin(m) * R * 0.68, R * 0.5);
      });
      ctx.fillStyle = '#FBF8F0';
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.26, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.inkSoft;
      ctx.font = `600 ${H * 0.075}px ${FONT_CN}`;
      ctx.fillText(T('事实判断仪表', 'Fact gauge'), cx, H * 0.06);
    });
    dial.mesh.position.set(0, 1.51, 0.045);
    gauge.add(dial.mesh);
    this.needle = new THREE.Group();
    this.needle.position.set(0, 1.18, 0.06);
    const nd = rbox(0.04, 0.56, 0.02, COLORS.ink, 0, 0, 0, 0.01);
    nd.userData.noOutline = true;
    this.needle.add(nd, cyl(0.06, 0.06, 0.03, COLORS.ink, 0, -0.015, 0, 14));
    this.needle.children[1].rotation.x = Math.PI / 2;
    this.needle.children[1].position.set(0, 0, 0);
    gauge.add(this.needle);
    this.station(gauge, 2.7, 0.85, 'gauge', ['事实判断仪表', 'Fact gauge'], { yaw: -0.3 });

    this.pop(tree(1.1), -3.4, 1.4, { order: 2, dir: 'left' });
    this.pop(tree(1.0, COLORS.greenDark), 3.45, 2.9, { order: 2, dir: 'right' });
  }

  // ---------- 状态同步 ----------
  drawInfo(c, claimIndex = -1) {
    this.infoScreen.draw((ctx, W, H) => {
      ctx.fillStyle = '#F7F4EC';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      if (!c) {
        ctx.fillStyle = COLORS.ink;
        ctx.font = `700 ${H * 0.1}px ${FONT_KAI}`;
        ctx.textAlign = 'center';
        ctx.fillText(T('请在右侧页面选择一个 AI 回答案例', 'Choose an AI answer on the right-hand page'), W / 2, H * 0.42, W * 0.92);
        return;
      }
      ctx.fillStyle = COLORS.coralDark;
      ctx.font = `700 ${H * 0.07}px ${FONT_CN}`;
      ctx.fillText(T(`案例 ${c.id} · 提问`, `Case ${c.id} · Question`), W * 0.04, H * 0.05);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${H * 0.085}px ${FONT_KAI}`;
      ctx.fillText(c.question, W * 0.04, H * 0.15, W * 0.92);
      ctx.fillStyle = COLORS.techDark;
      ctx.font = `700 ${H * 0.07}px ${FONT_CN}`;
      ctx.fillText(T('AI 的回答', 'AI’s answer'), W * 0.04, H * 0.3);
      ctx.fillStyle = COLORS.ink;
      ctx.font = `500 ${H * 0.068}px ${FONT_CN}`;
      const text = c.answer.map((p) => p.text).join('');
      wrapText(ctx, text, W * 0.04, H * 0.4, W * 0.92, H * 0.095, 6);
      if (claimIndex >= 0) {
        ctx.fillStyle = COLORS.coralDark;
        ctx.font = `700 ${H * 0.06}px ${FONT_CN}`;
        ctx.fillText(T(`正在核验：主张 ${claimIndex + 1}`, `Checking: claim ${claimIndex + 1}`), W * 0.04, H * 0.9);
      }
    });
  }

  /** 把证据材料摆上核验台；selected 为已选中的下标 */
  setEvidence(list, selected = []) {
    this.evCards.forEach((e, i) => {
      const ev = list[i];
      e.holder.visible = !!ev;
      if (!ev) return;
      const on = selected.includes(i);
      e.panel.draw((ctx, W, H) => {
        ctx.fillStyle = on ? '#E3F0E5' : '#FBF8F0';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = on ? COLORS.mintDark : COLORS.techDark;
        ctx.fillRect(0, 0, W, H * 0.2);
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${H * 0.1}px ${FONT_CN}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(T(`证据 ${i + 1}${on ? ' ✓' : ''}`, `Evidence ${i + 1}${on ? ' ✓' : ''}`), W * 0.07, H * 0.105);
        ctx.fillStyle = COLORS.ink;
        ctx.font = `600 ${H * 0.085}px ${FONT_CN}`;
        ctx.textBaseline = 'top';
        wrapText(ctx, ev.source, W * 0.07, H * 0.26, W * 0.86, H * 0.11, 2);
        ctx.fillStyle = COLORS.inkSoft;
        ctx.font = `500 ${H * 0.07}px ${FONT_CN}`;
        wrapText(ctx, ev.text, W * 0.07, H * 0.5, W * 0.86, H * 0.092, 5);
      });
      gsap.to(e.card.position, { y: 0.36 + (on ? 0.12 : 0), duration: 0.25 });
    });
  }

  setVerdict(v) {
    gsap.to(this.needle.rotation, { z: VERDICT_ANGLE[v] ?? 0, duration: 0.9, ease: 'elastic.out(1,0.55)' });
  }

  /** 展开 / 收起核验装置 */
  openDevice(on) {
    gsap.to(this.devLid.rotation, { x: on ? -1.9 : 0, duration: 0.6, ease: 'back.out(1.3)' });
    gsap.to(this.devArm.scale, { y: on ? 1 : 0.01, duration: 0.6, delay: on ? 0.25 : 0, ease: 'back.out(1.5)' });
  }

  highlight(id) {
    const t = this.byId[id];
    if (t) this.select(t.root);
  }

  drawGround(ctx, w, h, P) {
    const X = (x) => (x + STAGE.UX / 2) * P;
    const Z = (z) => (z + STAGE.UZ / 2) * P;
    ctx.fillStyle = '#F0E9D9';
    ctx.fillRect(0, 0, w, h);
    // 人字拼地板
    ctx.strokeStyle = 'rgba(150,125,90,0.20)';
    ctx.lineWidth = 1.5;
    for (let y = -h; y < h * 2; y += 44) {
      for (let x = 0; x < w; x += 88) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 44, y + 44);
        ctx.lineTo(x + 88, y);
        ctx.stroke();
      }
    }
    // 中央圆毯
    ctx.fillStyle = 'rgba(184,214,191,0.55)';
    ctx.beginPath();
    ctx.ellipse(X(-0.15), Z(0.5), 2.3 * P, 1.5 * P, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.ellipse(X(-0.15), Z(0.5), 2.1 * P, 1.32 * P, 0, 0, 6.3);
    ctx.stroke();
    ctx.setLineDash([]);
    // 流程印记
    ctx.fillStyle = 'rgba(52,67,74,0.6)';
    ctx.font = `700 22px ${FONT_CN}`;
    ctx.textAlign = 'center';
    ctx.fillText(T('① 找出主张', '① Find the claims'), X(0.05), Z(-1.75));
    ctx.fillText(T('② 查找证据', '② Find evidence'), X(-2.75), Z(0.1));
    ctx.fillText(T('③ 核验判断', '③ Check & judge'), X(2.65), Z(1.7));
    ctx.fillStyle = '#F6F1E4';
    ctx.beginPath();
    ctx.arc(X(-0.85), Z(2.7), 1.0 * P, 0, 6.3);
    ctx.fill();
  }
}
