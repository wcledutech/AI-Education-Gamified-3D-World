// 猫 / 狗样本图：用代码绘制的纸艺风插画（非照片），保证项目自带数据、无版权与外链依赖。
// 每张图由一组参数决定：毛色、姿态、耳朵形状、花纹、背景、位置与大小。
const FUR = {
  orange: ['#E0A060', '#F3D9B0', '#B9783A'],
  gray: ['#9BA0A6', '#DADDE0', '#6F757C'],
  black: ['#4D4A47', '#8C8782', '#2F2D2B'],
  white: ['#F3EFE6', '#FFFFFF', '#CFC8BA'],
  brown: ['#A97C50', '#E3C9A4', '#7A5634'],
  cream: ['#E8D3A8', '#FBF1DA', '#C2A46E'],
  golden: ['#D9B36A', '#F5E3B8', '#AD8540'],
};

function background(ctx, S, type) {
  const g = (c, x, y, w, h) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * S, y * S, w * S, h * S);
  };
  switch (type) {
    case 'room':
      g('#EADFCB', 0, 0, 1, 0.64);
      g('#C9A985', 0, 0.64, 1, 0.36);
      g('#F7F2E6', 0, 0.62, 1, 0.03);
      break;
    case 'grass':
      g('#CFE3EC', 0, 0, 1, 0.56);
      g('#9DBE8F', 0, 0.56, 1, 0.44);
      ctx.fillStyle = '#F7F2E6';
      ctx.beginPath();
      ctx.ellipse(0.22 * S, 0.16 * S, 0.14 * S, 0.06 * S, 0, 0, 6.3);
      ctx.fill();
      break;
    case 'sofa':
      g('#E4E9E2', 0, 0, 1, 1);
      ctx.fillStyle = '#8FB3C4';
      ctx.beginPath();
      ctx.roundRect(0.05 * S, 0.3 * S, 0.9 * S, 0.6 * S, 0.1 * S);
      ctx.fill();
      g('#B9A58A', 0, 0.86, 1, 0.14);
      break;
    case 'rug':
      g('#D9C3A3', 0, 0, 1, 1);
      ctx.fillStyle = '#E6A18C';
      ctx.beginPath();
      ctx.ellipse(0.5 * S, 0.8 * S, 0.48 * S, 0.2 * S, 0, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = '#F7F2E6';
      ctx.lineWidth = 0.02 * S;
      ctx.beginPath();
      ctx.ellipse(0.5 * S, 0.8 * S, 0.36 * S, 0.14 * S, 0, 0, 6.3);
      ctx.stroke();
      break;
    case 'garden':
      g('#86A886', 0, 0, 1, 0.5);
      g('#E3D6BA', 0, 0.5, 1, 0.5);
      ctx.fillStyle = '#F2C4B6';
      [0.12, 0.34, 0.66, 0.88].forEach((x, i) => {
        ctx.beginPath();
        ctx.arc(x * S, (0.2 + (i % 2) * 0.14) * S, 0.035 * S, 0, 6.3);
        ctx.fill();
      });
      break;
    default: // plain
      g('#EFE3C8', 0, 0, 1, 1);
      ctx.fillStyle = '#F8F0DC';
      ctx.beginPath();
      ctx.arc(0.5 * S, 0.52 * S, 0.42 * S, 0, 6.3);
      ctx.fill();
  }
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** 头部。坐标系：以 (0,0) 为头心，单位长度 = 头的大致半径 */
function head(ctx, spec, c) {
  const [fur, light, dark] = c;
  const cat = spec.cls === 'cat';
  // 耳朵（先画，在头后面）
  const ears = spec.ears;
  ctx.fillStyle = spec.pattern === 'patch' ? dark : fur;
  if (ears === 'point' || ears === 'up') {
    const wide = ears === 'up' ? 1.15 : 1;
    [-1, 1].forEach((s) => {
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.moveTo(s * 0.86 * wide, -0.42);
      ctx.lineTo(s * 0.74 * wide, -1.42);
      ctx.lineTo(s * 0.16, -0.78);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F2B8B0';
      ctx.beginPath();
      ctx.moveTo(s * 0.72 * wide, -0.58);
      ctx.lineTo(s * 0.68 * wide, -1.14);
      ctx.lineTo(s * 0.34, -0.78);
      ctx.closePath();
      ctx.fill();
    });
  } else if (ears === 'fold') {
    [-1, 1].forEach((s) => {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(s * 0.9, -0.5);
      ctx.lineTo(s * 0.62, -0.98);
      ctx.lineTo(s * 0.22, -0.8);
      ctx.closePath();
      ctx.fill();
    });
  }
  // 头
  ctx.fillStyle = fur;
  if (cat) ellipse(ctx, 0, 0, 1.0, 0.88);
  else ellipse(ctx, 0, 0, 0.9, 0.98);
  if (ears === 'flop') {
    ctx.fillStyle = dark;
    [-1, 1].forEach((s) => ellipse(ctx, s * 0.93, 0.12, 0.3, 0.7, s * 0.22));
  }
  // 花纹
  if (spec.pattern === 'tabby') {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.1;
    ctx.lineCap = 'round';
    [-0.3, 0, 0.3].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, -0.82);
      ctx.lineTo(x * 0.8, -0.46);
      ctx.stroke();
    });
  } else if (spec.pattern === 'patch') {
    ctx.fillStyle = dark;
    ellipse(ctx, 0.4, -0.2, 0.36, 0.4, 0.2);
  }
  if (cat) {
    // 猫：杏仁眼 + 竖瞳、小三角鼻、长胡须
    [-1, 1].forEach((s) => {
      ctx.fillStyle = spec.eye || '#B7C96A';
      ellipse(ctx, s * 0.4, -0.08, 0.2, 0.16, s * 0.25);
      ctx.fillStyle = '#2B2B2B';
      ellipse(ctx, s * 0.4, -0.08, 0.05, 0.14);
    });
    ctx.fillStyle = light;
    ellipse(ctx, 0, 0.42, 0.3, 0.22);
    ctx.fillStyle = '#E79A93';
    ctx.beginPath();
    ctx.moveTo(-0.1, 0.24);
    ctx.lineTo(0.1, 0.24);
    ctx.lineTo(0, 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    ctx.moveTo(0, 0.36);
    ctx.quadraticCurveTo(-0.08, 0.52, -0.2, 0.46);
    ctx.moveTo(0, 0.36);
    ctx.quadraticCurveTo(0.08, 0.52, 0.2, 0.46);
    ctx.stroke();
    ctx.strokeStyle = spec.fur === 'white' || spec.fur === 'cream' ? '#8A8478' : '#FFFFFF';
    ctx.lineWidth = 0.03;
    [-1, 1].forEach((s) =>
      [-0.12, 0.02, 0.16].forEach((dy, i) => {
        ctx.beginPath();
        ctx.moveTo(s * 0.3, 0.4 + dy * 0.4);
        ctx.lineTo(s * 1.25, 0.3 + dy + (i - 1) * 0.06);
        ctx.stroke();
      })
    );
  } else {
    // 狗：圆眼、突出的浅色口鼻、大黑鼻头、舌头
    ctx.fillStyle = light;
    ellipse(ctx, 0, 0.42, 0.5, 0.42);
    [-1, 1].forEach((s) => {
      ctx.fillStyle = '#2B2B2B';
      ellipse(ctx, s * 0.36, -0.2, 0.11, 0.12);
      ctx.fillStyle = '#FFFFFF';
      ellipse(ctx, s * 0.36 + 0.03, -0.24, 0.035, 0.035);
    });
    ctx.fillStyle = '#2B2B2B';
    ellipse(ctx, 0, 0.2, 0.2, 0.14);
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(0, 0.34);
    ctx.lineTo(0, 0.5);
    ctx.moveTo(-0.24, 0.5);
    ctx.quadraticCurveTo(0, 0.66, 0.24, 0.5);
    ctx.stroke();
    if (spec.tongue !== false) {
      ctx.fillStyle = '#E88F8F';
      ctx.beginPath();
      ctx.roundRect(-0.1, 0.56, 0.2, 0.26, 0.09);
      ctx.fill();
    }
  }
}

function tail(ctx, spec, c, x, y, dir) {
  ctx.strokeStyle = c[0];
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (spec.cls === 'cat') {
    ctx.lineWidth = 0.05;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + dir * 0.2, y + 0.04, x + dir * 0.24, y - 0.3, x + dir * 0.12, y - 0.42);
  } else {
    ctx.lineWidth = 0.085;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * 0.13, y - 0.04, x + dir * 0.15, y - 0.2);
  }
  ctx.stroke();
}

/**
 * @param spec { cls, fur, pose, ears, pattern, bg, flip, scale, dx, dy, eye, tongue }
 */
export function drawSample(ctx, S, spec) {
  ctx.save();
  ctx.clearRect(0, 0, S, S);
  background(ctx, S, spec.bg);
  const c = FUR[spec.fur];
  const cat = spec.cls === 'cat';
  // 归一化坐标 + 位置/大小抖动 + 左右翻转
  ctx.translate(S * (0.5 + (spec.dx || 0)), S * (0.5 + (spec.dy || 0)));
  ctx.scale(S * (spec.scale || 1) * (spec.flip ? -1 : 1), S * (spec.scale || 1));
  ctx.translate(-0.5, -0.5);
  const drawHead = (x, y, k) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    head(ctx, spec, c);
    ctx.restore();
  };
  if (spec.pose === 'face') {
    ctx.fillStyle = c[0];
    ellipse(ctx, 0.5, 1.04, cat ? 0.33 : 0.38, 0.3);
    if (!cat) {
      ctx.fillStyle = '#C9806A';
      ctx.fillRect(0.33, 0.77, 0.34, 0.045); // 项圈
    }
    drawHead(0.5, 0.5, 0.27);
  } else if (spec.pose === 'sit') {
    tail(ctx, spec, c, cat ? 0.66 : 0.68, 0.84, 1);
    ctx.fillStyle = c[0];
    ellipse(ctx, 0.5, 0.71, cat ? 0.18 : 0.22, cat ? 0.22 : 0.23);
    ctx.fillStyle = c[1];
    ellipse(ctx, 0.5, 0.74, cat ? 0.09 : 0.12, 0.15);
    ctx.fillStyle = c[0];
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.roundRect(0.5 + s * 0.09 - 0.04, 0.72, cat ? 0.07 : 0.09, 0.21, 0.035);
      ctx.fill();
    });
    if (!cat) {
      ctx.fillStyle = '#C9806A';
      ctx.fillRect(0.38, 0.5, 0.24, 0.035);
    }
    drawHead(0.5, 0.36, 0.235);
  } else {
    // side：侧身站立
    tail(ctx, spec, c, 0.24, 0.56, -1);
    ctx.fillStyle = c[0];
    [0.3, 0.4, 0.6, 0.68].forEach((x) => {
      ctx.beginPath();
      ctx.roundRect(x - 0.03, 0.6, cat ? 0.055 : 0.07, cat ? 0.25 : 0.23, 0.025);
      ctx.fill();
    });
    ellipse(ctx, 0.48, 0.6, 0.27, cat ? 0.115 : 0.15);
    ctx.fillStyle = c[1];
    ellipse(ctx, 0.5, 0.66, 0.17, 0.06);
    drawHead(0.73, 0.4, 0.205);
  }
  ctx.restore();
}

const S = (cls, fur, pose, ears, bg, o = {}) => ({ cls, fur, pose, ears, bg, pattern: 'plain', ...o });

/** 训练样本池：20 张（猫 10、狗 10），毛色 / 姿态 / 背景各不相同 */
export const TRAIN_SPECS = [
  S('cat', 'orange', 'face', 'point', 'room', { pattern: 'tabby' }),
  S('cat', 'gray', 'sit', 'point', 'grass'),
  S('cat', 'black', 'side', 'point', 'sofa', { eye: '#E5C85A' }),
  S('cat', 'white', 'face', 'point', 'plain', { eye: '#8FB8D6' }),
  S('cat', 'cream', 'sit', 'point', 'rug', { pattern: 'patch' }),
  S('cat', 'orange', 'side', 'point', 'garden', { flip: true }),
  S('cat', 'gray', 'face', 'point', 'sofa', { pattern: 'tabby' }),
  S('cat', 'black', 'sit', 'point', 'room', { flip: true, eye: '#E5C85A' }),
  S('cat', 'white', 'side', 'point', 'grass'),
  S('cat', 'brown', 'face', 'point', 'garden', { pattern: 'tabby' }),
  S('dog', 'brown', 'face', 'flop', 'grass'),
  S('dog', 'cream', 'sit', 'flop', 'room'),
  S('dog', 'black', 'side', 'flop', 'garden', { tongue: false }),
  S('dog', 'white', 'face', 'flop', 'sofa', { pattern: 'patch' }),
  S('dog', 'golden', 'sit', 'flop', 'plain'),
  S('dog', 'gray', 'side', 'up', 'room', { flip: true }),
  S('dog', 'black', 'face', 'flop', 'rug'),
  S('dog', 'brown', 'sit', 'flop', 'garden', { flip: true, pattern: 'patch' }),
  S('dog', 'cream', 'side', 'flop', 'sofa'),
  S('dog', 'golden', 'face', 'up', 'plain', { tongue: false }),
];

/** 独立测试样本：10 张（猫 5、狗 5），从不参与训练；含两张“不典型”的样本 */
export const TEST_SPECS = [
  S('cat', 'cream', 'face', 'point', 'rug'),
  S('dog', 'gray', 'face', 'flop', 'room'),
  S('cat', 'orange', 'sit', 'point', 'sofa', { flip: true, pattern: 'tabby' }),
  S('dog', 'black', 'sit', 'flop', 'grass'),
  S('cat', 'gray', 'side', 'point', 'room'),
  S('dog', 'golden', 'side', 'flop', 'plain', { flip: true }),
  S('cat', 'black', 'face', 'point', 'grass', { eye: '#E5C85A' }),
  S('dog', 'white', 'face', 'up', 'garden', { tongue: false }),
  S('cat', 'white', 'sit', 'fold', 'garden'),
  S('dog', 'brown', 'sit', 'flop', 'rug'),
];
