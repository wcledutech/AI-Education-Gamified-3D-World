// 最后一组书页：“我的 AI 探索报告”。立体小景会随三个场景的完成情况升起旗帜。
import * as THREE from 'three';
import gsap from 'gsap';
import { BaseScene, pedestal, flagPole, tree } from './BaseScene.js';
import { COLORS, STAGE, FONT_CN, FONT_KAI } from '../utils/config.js';
import { box, rbox, cyl, ball, prism, group, sign, mat, shadow } from '../utils/three-helpers.js';
import { makeHuman, makeRobot } from '../characters/CharacterFactory.js';

export class SummaryScene extends BaseScene {
  build() {
    // 拱门横幅
    const arch = group(box(0.14, 2.3, 0.14, COLORS.brown, -2.6, 0, 0), box(0.14, 2.3, 0.14, COLORS.brown, 2.6, 0, 0));
    arch.add(rbox(5.6, 0.7, 0.06, COLORS.cream, 0, 1.75, 0.02, 0.04));
    const title = sign('我的 AI 探索报告', { w: 5.2, h: 0.56, bg: COLORS.cream, border: COLORS.coralDark, font: FONT_KAI, size: 0.62 });
    title.position.set(0, 2.1, 0.055);
    arch.add(title);
    [-2.2, -1.1, 0, 1.1, 2.2].forEach((x, i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), mat([COLORS.tech, COLORS.coral, COLORS.mint, COLORS.mustard, COLORS.tech][i]));
      f.rotation.z = Math.PI;
      f.rotation.y = Math.PI / 6;
      f.position.set(x, 1.58, 0.04);
      f.scale.z = 0.25;
      arch.add(shadow(f));
    });
    this.pop(arch, 0, -2.9, { order: 0 });

    // 三个场景的微缩模型 + 完成旗
    const mini = [
      { key: 'city', label: '认识 AI', x: -2.3, build: () => group(rbox(0.5, 0.36, 0.4, '#F4E9D6', 0, 0, 0, 0.02), prism(0.6, 0.24, 0.46, COLORS.coral, 0, 0.36, 0)) },
      { key: 'lab', label: '理解 AI', x: 0, build: () => group(rbox(0.5, 0.5, 0.3, '#6E828C', 0, 0, 0, 0.03), rbox(0.36, 0.22, 0.02, '#BFE3D0', 0, 0.2, 0.16, 0.02)) },
      {
        key: 'verify',
        label: '判断 AI',
        x: 2.3,
        build: () => {
          const g = group(rbox(0.6, 0.36, 0.06, COLORS.cream, 0, 0.1, 0, 0.03), box(0.06, 0.12, 0.06, COLORS.inkSoft, 0, 0, 0));
          const n = box(0.03, 0.24, 0.02, COLORS.ink, 0, 0.16, 0.04);
          n.rotation.z = -0.6;
          g.add(n);
          return g;
        },
      },
    ];
    this.flags = {};
    mini.forEach((m) => {
      const g = group(pedestal(1.0, 0.6, 0.8));
      const model = m.build();
      model.position.y = 0.65;
      model.scale.setScalar(1.25);
      g.add(model);
      const s = sign(m.label, { w: 0.8, h: 0.22, bg: COLORS.cream, border: COLORS.ink, font: FONT_KAI });
      s.position.set(0, 0.32, 0.41);
      g.add(s);
      const flag = flagPole(1.0, COLORS.mintDark);
      flag.position.set(0.38, 0.65, -0.25);
      flag.scale.y = 0.01;
      flag.visible = false;
      g.add(flag);
      this.flags[m.key] = flag;
      this.pop(g, m.x, -1.2, { order: 1 });
    });

    // 中央奖章台
    const podium = group(cyl(0.7, 0.8, 0.3, COLORS.sand, 0, 0, 0, 28), cyl(0.5, 0.55, 0.3, COLORS.cream, 0, 0.3, 0, 28));
    this.medal = new THREE.Group();
    this.medal.position.y = 1.15;
    const disc = cyl(0.36, 0.36, 0.07, COLORS.mustard, 0, 0, 0, 30, { metalness: 0.25, roughness: 0.5 });
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 0, 0);
    this.medal.add(disc);
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.1 : 0.23;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    const sg = new THREE.ExtrudeGeometry(star, { depth: 0.09, bevelEnabled: false });
    sg.translate(0, 0, -0.045);
    this.medal.add(shadow(new THREE.Mesh(sg, mat(COLORS.cream))));
    podium.add(this.medal, cyl(0.03, 0.03, 0.5, COLORS.coralDark, 0, 0.6, 0, 8));
    this.pop(podium, 0, 0.7, { order: 1 });

    this.pop(tree(1.2), -3.3, 0.6, { order: 2, dir: 'left' });
    this.pop(tree(1.1, COLORS.greenDark), 3.3, 0.4, { order: 2, dir: 'right' });

    const d = this.def.characters;
    this.addCharacter(makeRobot(d.guide), 1.35, 2.3, -0.35);
    this.addCharacter(makeHuman(d.student, { top: COLORS.mustard, bottom: '#5E6E75', pack: COLORS.coral }), -1.35, 2.3, 0.35);
  }

  /** 根据学习进度升起旗帜 */
  refresh() {
    const st = this.app.state.data;
    ['city', 'lab', 'verify'].forEach((k) => {
      const done = !!st[k].done;
      const f = this.flags[k];
      if (done && !f.visible) {
        f.visible = true;
        gsap.to(f.scale, { y: 1, duration: 0.7, ease: 'back.out(1.6)' });
      } else if (!done) {
        f.visible = false;
        f.scale.y = 0.01;
      }
    });
  }

  activate() {
    super.activate();
    this.refresh();
    Object.values(this.characters).forEach((c, i) => setTimeout(() => this.active && c.wave(), 300 + i * 500));
  }

  update(dt, t) {
    super.update(dt, t);
    this.medal.rotation.y += dt * 0.8;
  }

  drawGround(ctx, w, h, P) {
    const X = (x) => (x + STAGE.UX / 2) * P;
    const Z = (z) => (z + STAGE.UZ / 2) * P;
    ctx.fillStyle = '#F3EDDF';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(135,181,201,0.45)';
    ctx.lineWidth = 3;
    for (let r = 0.8; r < 6; r += 0.8) {
      ctx.beginPath();
      ctx.arc(X(0), Z(0.7), r * P, 0, 6.3);
      ctx.stroke();
    }
    // 学习路径：认识 → 理解 → 判断
    ctx.strokeStyle = 'rgba(201,128,106,0.7)';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(X(-2.3), Z(-0.5));
    ctx.quadraticCurveTo(X(0), Z(0.2), X(2.3), Z(-0.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(52,67,74,0.6)';
    ctx.font = `700 24px ${FONT_KAI}`;
    ctx.textAlign = 'center';
    ctx.fillText('认识 AI  →  理解 AI  →  判断 AI', X(0), Z(3.3));
  }
}
