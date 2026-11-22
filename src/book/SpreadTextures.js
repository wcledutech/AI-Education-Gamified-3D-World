// 每个跨页的“印刷面”：纸张底纹 + 场景地面印刷 + 页眉标题。
// 场景地面同时用作立体舞台的顶面贴图，舞台收拢后与书页印刷无缝衔接。
import * as THREE from 'three';
import { BOOK, STAGE, WING, COLORS, FONT_KAI, FONT_SERIF, FONT_CN } from '../utils/config.js';
import { makeCanvas, canvasTex } from '../utils/three-helpers.js';

const P = 100; // px / 单位
const { W, D } = BOOK;

function paperBase(ctx, w, h, seed0) {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);
  let seed = seed0;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(170,150,110,0.06)';
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
}

/**
 * @param {Array} defs [{ unit, title, question, drawGround(ctx,w,h) }]
 * @returns [{ left, right, leftMirror, ground }]
 */
export function buildSpreadTextures(defs) {
  return defs.map((def, i) => {
    // 场景地面
    const ground = makeCanvas(STAGE.SX * P, STAGE.SZ * P);
    def.drawGround(ground.getContext('2d'), ground.width, ground.height, P * STAGE.K);

    const full = makeCanvas(W * 2 * P, D * P);
    const ctx = full.getContext('2d');
    paperBase(ctx, full.width, full.height, 31 + i * 7);

    // 书口阴影
    const cx = W * P;
    const gut = ctx.createLinearGradient(cx - 90, 0, cx + 90, 0);
    gut.addColorStop(0, 'rgba(120,100,70,0)');
    gut.addColorStop(0.5, 'rgba(120,100,70,0.20)');
    gut.addColorStop(1, 'rgba(120,100,70,0)');
    ctx.fillStyle = gut;
    ctx.fillRect(cx - 90, 0, 180, full.height);

    // 立页的“裁切线”印记
    [-1, 1].forEach((sgn) => {
      ctx.save();
      ctx.translate((sgn * WING.X + W) * P, (WING.Z + D / 2) * P);
      ctx.rotate(sgn * WING.YAW); // 俯视图中的旋转方向与绕 Y 轴相反
      ctx.strokeStyle = 'rgba(120,105,80,0.30)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect((-WING.W / 2) * P, -WING.H * P, WING.W * P, WING.H * P);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect((-WING.W / 2) * P, -WING.H * P, WING.W * P, WING.H * P);
      ctx.restore();
    });

    // 舞台地面印刷
    const sx = (-STAGE.SX / 2 + W) * P;
    const sy = (STAGE.CZ - STAGE.SZ / 2 + D / 2) * P;
    ctx.save();
    ctx.shadowColor = 'rgba(90,75,50,0.25)';
    ctx.shadowBlur = 10;
    ctx.drawImage(ground, sx, sy);
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,105,80,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, ground.width, ground.height);

    // 页眉标题（印在书页近端）
    const ty = (D - 1.25) * P;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.coralDark;
    ctx.font = `700 ${0.3 * P}px ${FONT_SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText(def.unit, 0.75 * P, ty - 0.62 * P);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${0.95 * P}px ${FONT_KAI}`;
    ctx.fillText(def.title, 0.7 * P, ty + 0.12 * P);
    ctx.textAlign = 'right';
    ctx.font = `600 ${0.62 * P}px ${FONT_KAI}`;
    ctx.fillStyle = COLORS.inkSoft;
    ctx.fillText(def.question, (W * 2 - 0.75) * P, ty + 0.12 * P);
    // 细装饰线与页码
    ctx.strokeStyle = 'rgba(52,67,74,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0.7 * P, ty + 0.72 * P);
    ctx.lineTo((W - 0.6) * P, ty + 0.72 * P);
    ctx.moveTo((W + 0.6) * P, ty + 0.72 * P);
    ctx.lineTo((W * 2 - 0.7) * P, ty + 0.72 * P);
    ctx.stroke();
    ctx.font = `500 ${0.22 * P}px ${FONT_CN}`;
    ctx.fillStyle = 'rgba(52,67,74,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(`${i * 2 + 2}`, 0.75 * P, ty + 0.98 * P);
    ctx.textAlign = 'right';
    ctx.fillText(`${i * 2 + 3}`, (W * 2 - 0.75) * P, ty + 0.98 * P);

    // 拆成左右两页
    const half = (x0) => {
      const c = makeCanvas(W * P, D * P);
      c.getContext('2d').drawImage(full, x0, 0, W * P, D * P, 0, 0, W * P, D * P);
      return canvasTex(c);
    };
    const left = half(0);
    const right = half(W * P);
    const leftMirror = left.clone();
    leftMirror.wrapS = THREE.RepeatWrapping;
    leftMirror.repeat.x = -1;
    leftMirror.offset.x = 1;
    leftMirror.needsUpdate = true;
    return { left, right, leftMirror, ground: canvasTex(ground) };
  });
}

/** 开书时“哗啦”翻过的空白扉页贴图 */
export function blankPageTexture() {
  const c = makeCanvas(W * P * 0.5, D * P * 0.5);
  const ctx = c.getContext('2d');
  paperBase(ctx, c.width, c.height, 5);
  return canvasTex(c);
}
