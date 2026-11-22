// 精装书模型：有厚度的前后封面、可折叠的书脊、两叠内页、书签、堵头布与封面压印图案。
// 运动学：左半本（前封面 + 左侧书页）绕展开面上的“书脊线”旋转，-π 为合上，0 为完全展开。
import * as THREE from 'three';
import { BOOK, PAGE_TOP, COLORS, FONT_KAI, FONT_SERIF, FONT_CN } from '../utils/config.js';
import { makeCanvas, canvasTex, roundRect, shadow } from '../utils/three-helpers.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const { W, D, COVER, OV, T } = BOOK;
const CW = W + OV; // 封面宽
const CD = D + OV * 2; // 封面深

function clothTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.cover;
  ctx.fillRect(0, 0, 512, 512);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,245,200,0.10)' : 'rgba(120,90,20,0.07)';
    if (rnd() > 0.5) ctx.fillRect(x, y, 6 + rnd() * 8, 1);
    else ctx.fillRect(x, y, 1, 6 + rnd() * 8);
  }
  const t = canvasTex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2.4);
  return t;
}

function pageEdgeTexture() {
  const c = makeCanvas(64, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F3EDDD';
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(150,135,105,0.38)' : 'rgba(150,135,105,0.16)';
    ctx.fillRect(0, y, 64, 1);
  }
  const t = canvasTex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** 封面压印图案（透明底，叠在布面上） */
function coverArt() {
  const P = 120; // px / 单位
  const c = makeCanvas(CW * P, CD * P);
  const ctx = c.getContext('2d');
  const Wp = c.width;
  const Hp = c.height;
  const emboss = (draw, depth = 2) => {
    ctx.save();
    ctx.translate(depth, depth);
    ctx.globalAlpha = 0.35;
    draw('rgba(255,248,214,1)');
    ctx.restore();
    ctx.save();
    ctx.translate(-depth * 0.6, -depth * 0.6);
    ctx.globalAlpha = 0.3;
    draw('rgba(110,82,18,1)');
    ctx.restore();
    draw();
  };
  // 书脊压槽
  const groove = ctx.createLinearGradient(0.32 * P, 0, 0.62 * P, 0);
  groove.addColorStop(0, 'rgba(120,90,20,0)');
  groove.addColorStop(0.5, 'rgba(120,90,20,0.30)');
  groove.addColorStop(1, 'rgba(255,245,200,0.18)');
  ctx.fillStyle = groove;
  ctx.fillRect(0.3 * P, 0, 0.34 * P, Hp);

  // 外框
  emboss((col) => {
    ctx.strokeStyle = col || 'rgba(140,105,30,0.75)';
    ctx.lineWidth = 3;
    roundRect(ctx, 1.0 * P, 0.62 * P, Wp - 1.6 * P, Hp - 1.24 * P, 22);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    roundRect(ctx, 1.12 * P, 0.74 * P, Wp - 1.84 * P, Hp - 1.48 * P, 16);
    ctx.stroke();
  }, 1.5);

  const cx = (Wp + 0.4 * P) / 2;
  // 标题
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  emboss((col) => {
    ctx.fillStyle = col || '#FFF9E3';
    ctx.font = `700 ${1.12 * P}px ${FONT_SERIF}`;
    ctx.fillText('HELLO, AI!', cx, 2.05 * P);
  }, 3);
  emboss((col) => {
    ctx.fillStyle = col || '#4B4326';
    ctx.font = `600 ${0.56 * P}px ${FONT_KAI}`;
    ctx.fillText('走进人工智能的世界', cx, 3.12 * P);
  }, 1.5);
  ctx.fillStyle = 'rgba(95,75,25,0.85)';
  ctx.font = `600 ${0.2 * P}px ${FONT_SERIF}`;
  ctx.fillText('L E A R N   ·   E X P L O R E   ·   T H I N K', cx, 3.78 * P);

  // 芯片纹样的细线
  ctx.strokeStyle = 'rgba(125,96,28,0.55)';
  ctx.lineWidth = 2;
  const plateX = cx - 2.3 * P;
  const plateY = 4.45 * P;
  const plateW = 4.6 * P;
  const plateH = 4.3 * P;
  for (let i = 0; i < 7; i++) {
    const y = plateY + 0.5 * P + i * 0.55 * P;
    [-1, 1].forEach((s) => {
      const x0 = s < 0 ? plateX : plateX + plateW;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + s * 0.45 * P, y);
      ctx.lineTo(x0 + s * 0.7 * P, y + (i % 2 ? 0.2 : -0.2) * P);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x0 + s * 0.76 * P, y + (i % 2 ? 0.2 : -0.2) * P, 5, 0, 6.3);
      ctx.stroke();
    });
  }
  // 中央纸艺贴片
  ctx.save();
  ctx.shadowColor = 'rgba(80,60,10,0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#FBF6E8';
  roundRect(ctx, plateX, plateY, plateW, plateH, 20);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(52,67,74,0.18)';
  ctx.lineWidth = 2;
  roundRect(ctx, plateX + 12, plateY + 12, plateW - 24, plateH - 24, 14);
  ctx.stroke();
  // 贴片内：小桌面 + 机器人
  const px = cx;
  const py = plateY + plateH / 2 + 0.25 * P;
  ctx.fillStyle = '#DDE7DA';
  roundRect(ctx, plateX + 0.4 * P, py + 1.0 * P, plateW - 0.8 * P, 0.34 * P, 10);
  ctx.fill();
  // 机器人身体
  ctx.fillStyle = COLORS.tech;
  roundRect(ctx, px - 0.62 * P, py - 0.05 * P, 1.24 * P, 1.05 * P, 26);
  ctx.fill();
  ctx.fillStyle = '#FBF6E8';
  roundRect(ctx, px - 0.36 * P, py + 0.2 * P, 0.72 * P, 0.46 * P, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.arc(px, py + 0.43 * P, 0.1 * P, 0, 6.3);
  ctx.fill();
  // 头
  ctx.fillStyle = '#FBF6E8';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 5;
  roundRect(ctx, px - 0.82 * P, py - 1.3 * P, 1.64 * P, 1.14 * P, 34);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  roundRect(ctx, px - 0.62 * P, py - 1.1 * P, 1.24 * P, 0.74 * P, 22);
  ctx.fill();
  ctx.fillStyle = '#BFE3D0';
  [-0.28, 0.28].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(px + dx * P, py - 0.76 * P, 0.11 * P, 0, 6.3);
    ctx.fill();
  });
  ctx.strokeStyle = '#BFE3D0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(px, py - 0.66 * P, 0.16 * P, 0.25, Math.PI - 0.25);
  ctx.stroke();
  // 天线
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(px, py - 1.3 * P);
  ctx.lineTo(px, py - 1.62 * P);
  ctx.stroke();
  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.arc(px, py - 1.7 * P, 0.1 * P, 0, 6.3);
  ctx.fill();
  // 手臂
  ctx.strokeStyle = COLORS.techDark;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px - 0.66 * P, py + 0.2 * P);
  ctx.lineTo(px - 1.08 * P, py + 0.62 * P);
  ctx.moveTo(px + 0.66 * P, py + 0.2 * P);
  ctx.lineTo(px + 1.1 * P, py - 0.25 * P);
  ctx.stroke();
  // 副标题
  emboss((col) => {
    ctx.fillStyle = col || '#4B4326';
    ctx.font = `500 ${0.34 * P}px ${FONT_KAI}`;
    ctx.fillText('一本可以探索的人工智能立体书', cx, 9.55 * P);
  }, 1.2);
  ctx.fillStyle = 'rgba(95,75,25,0.8)';
  ctx.font = `600 ${0.17 * P}px ${FONT_CN}`;
  ctx.fillText('初中人工智能通识 · 立体纸艺互动教材', cx, 10.15 * P);
  return canvasTex(c);
}

function endpaperTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#C5D3C2';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const px = x * 64 + (y % 2 ? 32 : 0);
      const py = y * 64 + 32;
      ctx.strokeRect(px - 9, py - 9, 18, 18);
      ctx.beginPath();
      ctx.moveTo(px - 9, py);
      ctx.lineTo(px - 20, py);
      ctx.moveTo(px + 9, py);
      ctx.lineTo(px + 20, py);
      ctx.stroke();
    }
  const t = canvasTex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 6);
  return t;
}

export class BookModel {
  constructor() {
    this.group = new THREE.Group();
    this.coverAngle = -Math.PI;
    this.blockAngle = -Math.PI;

    const cloth = new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.82 });
    const edgeTex = pageEdgeTexture();
    const edgeSide = (rep) => {
      const t = edgeTex.clone();
      t.needsUpdate = true;
      t.repeat.set(1, rep);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    };
    const paper = new THREE.MeshStandardMaterial({ color: COLORS.paper, roughness: 0.95 });
    const blockMats = [edgeSide(0.16), edgeSide(0.16), paper, paper, edgeSide(0.16), edgeSide(0.16)];

    // ---- 右半本（静止）：后封面 + 右侧书页 ----
    const back = shadow(new THREE.Mesh(new RoundedBoxGeometry(CW, COVER, CD, 2, 0.04), cloth));
    back.position.set(CW / 2, COVER / 2, 0);
    const rightBlock = shadow(new THREE.Mesh(new THREE.BoxGeometry(W, T / 2, D), blockMats));
    rightBlock.position.set(W / 2, COVER + T / 4, 0);
    this.rightPrint = this.makePrint();
    this.rightPrint.position.set(W / 2, PAGE_TOP + 0.003, 0);
    this.group.add(back, rightBlock, this.rightPrint);

    // 堵头布
    const band = (x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, T / 2 - 0.02, 0.05), new THREE.MeshStandardMaterial({ color: COLORS.coral, roughness: 0.9 }));
      b.position.set(x, y, z);
      return b;
    };
    this.group.add(band(0.07, COVER + T / 4, D / 2 + 0.01), band(0.07, COVER + T / 4, -D / 2 - 0.01));

    // 书签丝带：夹在书页间，从下沿垂到桌垫上
    const ribbonMat = new THREE.MeshStandardMaterial({ color: COLORS.coralDark, roughness: 0.75, side: THREE.DoubleSide });
    const ribbon = new THREE.Group();
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 1.4), ribbonMat);
    r1.position.set(0.95, PAGE_TOP + 0.008, D / 2 - 0.7);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, PAGE_TOP + 0.12), ribbonMat);
    r2.rotation.x = Math.PI / 2 - 0.16;
    r2.position.set(0.95, PAGE_TOP / 2 + 0.03, D / 2 + 0.07);
    const tail = new THREE.Shape();
    tail.moveTo(-0.15, 0);
    tail.lineTo(0.15, 0);
    tail.lineTo(0.15, 1.25);
    tail.lineTo(0, 1.08);
    tail.lineTo(-0.15, 1.25);
    tail.closePath();
    const r3 = new THREE.Mesh(new THREE.ShapeGeometry(tail), ribbonMat);
    r3.rotation.x = Math.PI / 2;
    r3.rotation.z = -0.12;
    r3.position.set(0.95, 0.075, D / 2 + 0.14);
    [r1, r2, r3].forEach((m) => shadow(m));
    ribbon.add(r1, r2, r3);
    this.group.add(ribbon);

    // ---- 书脊（合上时竖立，展开时折平收起） ----
    this.spine = new THREE.Group();
    const spineMesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(COVER, 1, CD), cloth));
    spineMesh.position.set(-COVER / 2, 0.5, 0);
    this.spine.add(spineMesh);
    this.group.add(this.spine);

    // ---- 前封面（绕书脊线旋转） ----
    this.coverPivot = new THREE.Group();
    this.coverPivot.position.set(0, PAGE_TOP, 0);
    const front = shadow(new THREE.Mesh(new RoundedBoxGeometry(CW, COVER, CD, 2, 0.04), cloth));
    front.position.set(-CW / 2, -PAGE_TOP + COVER / 2, 0);
    // 内封（环衬）
    const endpaper = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.08, CD - 0.08), new THREE.MeshStandardMaterial({ map: endpaperTexture(), roughness: 0.95 }));
    endpaper.rotation.x = -Math.PI / 2;
    endpaper.position.set(-CW / 2, -PAGE_TOP + COVER + 0.002, 0);
    endpaper.receiveShadow = true;
    // 封面图案：放在“合书朝向”的容器里，合上时正好朝上、正向可读
    const artHolder = new THREE.Group();
    artHolder.rotation.z = Math.PI;
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(CW, CD),
      new THREE.MeshStandardMaterial({ map: coverArt(), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 })
    );
    art.rotation.x = -Math.PI / 2;
    art.position.set(CW / 2, PAGE_TOP + 0.002, 0);
    art.receiveShadow = true;
    artHolder.add(art);
    this.coverPivot.add(front, endpaper, artHolder);
    this.coverMesh = front;
    this.group.add(this.coverPivot);

    // ---- 左侧书页（绕书脊线旋转） ----
    this.blockPivot = new THREE.Group();
    this.blockPivot.position.set(0, PAGE_TOP, 0);
    const leftBlock = shadow(new THREE.Mesh(new THREE.BoxGeometry(W, T / 2, D), blockMats));
    leftBlock.position.set(-W / 2, -T / 4, 0);
    this.leftPrint = this.makePrint();
    this.leftPrint.position.set(-W / 2, 0.003, 0);
    const lb1 = band(-0.07, -T / 4, D / 2 + 0.01);
    const lb2 = band(-0.07, -T / 4, -D / 2 - 0.01);
    this.blockPivot.add(leftBlock, this.leftPrint, lb1, lb2);
    this.group.add(this.blockPivot);

    this.setAngles(-Math.PI, -Math.PI);
  }

  makePrint() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }));
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    return m;
  }

  /** 可点击的封面区域（合书状态） */
  get clickTarget() {
    return this.coverPivot;
  }

  setAngles(cover, block) {
    this.coverAngle = cover;
    this.blockAngle = block;
    this.coverPivot.rotation.z = cover;
    this.blockPivot.rotation.z = block;
    // 书脊：连接后封面内缘 (0,0) 与前封面内缘；随开合倾倒并缩短
    const bx = PAGE_TOP * Math.sin(cover);
    const by = PAGE_TOP * (1 - Math.cos(cover));
    const len = Math.hypot(bx, by);
    this.spine.visible = len > 0.04;
    this.spine.rotation.z = Math.atan2(-bx, by);
    this.spine.scale.y = Math.max(len, 0.001);
  }

  setPrints(left, right) {
    if (left) {
      this.leftPrint.material.map = left;
      this.leftPrint.material.needsUpdate = true;
    }
    if (right) {
      this.rightPrint.material.map = right;
      this.rightPrint.material.needsUpdate = true;
    }
  }
}
