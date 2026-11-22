// 数据集管理：生成样本图、缩小为模型输入、按实验条件组织训练数据。
import { drawSample, TRAIN_SPECS, TEST_SPECS } from './SampleArt.js';

export const IMG = 128; // 展示用分辨率
export const INPUT = 32; // 模型输入分辨率

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export class DatasetManager {
  constructor() {
    this.samples = [];
    const mk = (spec, i, set) => {
      const rnd = seeded(101 + i * 37 + (set === 'test' ? 5000 : 0));
      const full = { ...spec, scale: 0.9 + rnd() * 0.16, dx: (rnd() - 0.5) * 0.08, dy: (rnd() - 0.5) * 0.06 };
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = IMG;
      drawSample(canvas.getContext('2d'), IMG, full);
      const small = document.createElement('canvas');
      small.width = small.height = INPUT;
      const sctx = small.getContext('2d', { willReadFrequently: true });
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(canvas, 0, 0, INPUT, INPUT);
      const rgba = sctx.getImageData(0, 0, INPUT, INPUT).data;
      const pixels = new Float32Array(INPUT * INPUT * 3);
      for (let p = 0, q = 0; p < rgba.length; p += 4) {
        pixels[q++] = rgba[p] / 255;
        pixels[q++] = rgba[p + 1] / 255;
        pixels[q++] = rgba[p + 2] / 255;
      }
      return { id: `${set === 'train' ? 'T' : 'X'}${String(i + 1).padStart(2, '0')}`, set, cls: spec.cls, spec: full, canvas, url: canvas.toDataURL('image/png'), pixels };
    };
    // 展示顺序打乱（固定种子），避免“前十张都是猫”
    const order = (n, seed) => {
      const r = seeded(seed);
      return [...Array(n).keys()].map((i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    };
    this.train = order(TRAIN_SPECS.length, 77).map((k, i) => mk(TRAIN_SPECS[k], i, 'train'));
    this.test = TEST_SPECS.map((s, i) => mk(s, i, 'test'));
    this.samples = [...this.train, ...this.test];
    this.byId = Object.fromEntries(this.samples.map((s) => [s.id, s]));
  }

  get(id) {
    return this.byId[id];
  }

  /** 统计一份标注：数量、类别分布、与真实类别不一致的标签 */
  stats(labels) {
    let cat = 0;
    let dog = 0;
    const wrong = [];
    this.train.forEach((s) => {
      const l = labels[s.id];
      if (!l) return;
      if (l === 'cat') cat += 1;
      else dog += 1;
      if (l !== s.cls) wrong.push(s.id);
    });
    return { labeled: cat + dog, total: this.train.length, cat, dog, wrong };
  }

  /**
   * 根据实验条件，从学生的标注生成实际用于训练的数据。
   * A：学生当前的全部标注；B：让某一类明显变少；C：随机翻转若干标签。
   * @returns { items:[{id,label}], excluded:[id], flipped:[id] }
   */
  buildCondition(labels, cond, opts = {}) {
    const base = this.train.filter((s) => labels[s.id]).map((s) => ({ id: s.id, label: labels[s.id] }));
    if (cond === 'B') {
      const minor = opts.minor || 'dog';
      const keep = opts.keep ?? 2;
      let n = 0;
      const items = [];
      const excluded = [];
      base.forEach((it) => {
        if (it.label === minor) {
          n += 1;
          if (n > keep) return excluded.push(it.id);
        }
        items.push(it);
      });
      return { items, excluded, flipped: [] };
    }
    if (cond === 'C') {
      const count = Math.min(opts.flips ?? 6, base.length);
      const r = seeded(opts.seed || Date.now() % 100000);
      const picks = base.map((it) => [r(), it.id]).sort((a, b) => a[0] - b[0]).slice(0, count).map((x) => x[1]);
      const items = base.map((it) => (picks.includes(it.id) ? { id: it.id, label: it.label === 'cat' ? 'dog' : 'cat' } : it));
      return { items, excluded: [], flipped: picks };
    }
    return { items: base, excluded: [], flipped: [] };
  }
}
