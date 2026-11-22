// 浏览器端真实训练：TensorFlow.js 小型卷积网络，从零开始学习区分猫 / 狗样本图。
// 训练数据完全来自传入的 items（学生当前的标注），不使用任何预设结果。
import { INPUT } from './DatasetManager.js';
import { nextFrame } from '../utils/frame.js';

let tfPromise = null;
/** 按需加载 TensorFlow.js，并选择可用的计算后端 */
export function loadTF() {
  if (!tfPromise) {
    tfPromise = import('@tensorflow/tfjs').then(async (tf) => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
      } catch (e) {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      return tf;
    });
    tfPromise.catch(() => (tfPromise = null));
  }
  return tfPromise;
}

const CLASSES = ['cat', 'dog'];

/**
 * 简单的数据增强：水平翻转、小幅平移，以及颜色变化（随机通道增益 / 灰度 / 通道轮换）。
 * 目的是让很少的样本也能学到更稳定的规律——形状比颜色和背景更可靠。
 */
function augment(pixels, flip, sx, sy, color) {
  const g = color === 'gain' ? [0.75 + Math.random() * 0.5, 0.75 + Math.random() * 0.5, 0.75 + Math.random() * 0.5] : null;
  const out = new Float32Array(pixels.length);
  for (let y = 0; y < INPUT; y++) {
    for (let x = 0; x < INPUT; x++) {
      let ux = flip ? INPUT - 1 - x : x;
      ux = Math.min(INPUT - 1, Math.max(0, ux + sx));
      const uy = Math.min(INPUT - 1, Math.max(0, y + sy));
      const a = (y * INPUT + x) * 3;
      const b = (uy * INPUT + ux) * 3;
      let r = pixels[b];
      let gr = pixels[b + 1];
      let bl = pixels[b + 2];
      if (g) {
        r = Math.min(1, r * g[0]);
        gr = Math.min(1, gr * g[1]);
        bl = Math.min(1, bl * g[2]);
      } else if (color === 'gray') {
        r = gr = bl = 0.299 * r + 0.587 * gr + 0.114 * bl;
      } else if (color === 'rotate') {
        [r, gr, bl] = [gr, bl, r];
      }
      out[a] = r;
      out[a + 1] = gr;
      out[a + 2] = bl;
    }
  }
  return out;
}

export class ModelTrainer {
  constructor(dataset) {
    this.dataset = dataset;
    this.model = null;
    this.tf = null;
    this.training = false;
  }

  /**
   * @param items [{id, label}] 用于训练的样本及其标签
   * @param onEpoch (epoch, total, loss, acc) 每轮训练结束时回调（真实数值）
   */
  async train(items, { epochs = 44, onEpoch } = {}) {
    if (this.training) throw new Error('模型正在训练中，请稍候。');
    if (!items.length) throw new Error('没有可用于训练的已标注样本，请先完成数据标注。');
    this.training = true;
    const t0 = performance.now();
    let xs;
    let ys;
    try {
      const tf = (this.tf = await loadTF());
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      const variants = [
        [false, 0, 0, null],
        [true, 0, 0, null],
        [false, 2, 1, 'gain'],
        [true, -2, -1, 'gain'],
        [false, -1, 2, 'gray'],
        [true, 1, -2, 'rotate'],
      ];
      const n = items.length * variants.length;
      const data = new Float32Array(n * INPUT * INPUT * 3);
      const labels = new Float32Array(n * 2);
      let k = 0;
      items.forEach((it) => {
        const px = this.dataset.get(it.id).pixels;
        variants.forEach(([f, sx, sy, color]) => {
          data.set(augment(px, f, sx, sy, color), k * INPUT * INPUT * 3);
          labels[k * 2 + CLASSES.indexOf(it.label)] = 1;
          k += 1;
        });
      });
      xs = tf.tensor4d(data, [n, INPUT, INPUT, 3]);
      ys = tf.tensor2d(labels, [n, 2]);

      const m = tf.sequential();
      m.add(tf.layers.conv2d({ inputShape: [INPUT, INPUT, 3], filters: 8, kernelSize: 5, strides: 2, activation: 'relu', kernelInitializer: 'heNormal' }));
      m.add(tf.layers.conv2d({ filters: 16, kernelSize: 3, activation: 'relu', kernelInitializer: 'heNormal' }));
      m.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      m.add(tf.layers.flatten());
      m.add(tf.layers.dropout({ rate: 0.25 }));
      m.add(tf.layers.dense({ units: 16, activation: 'relu', kernelInitializer: 'heNormal' }));
      m.add(tf.layers.dense({ units: 2, activation: 'softmax' }));
      m.compile({ optimizer: tf.train.adam(0.003), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

      let last = { loss: NaN, acc: NaN };
      await m.fit(xs, ys, {
        epochs,
        batchSize: 16,
        shuffle: true,
        yieldEvery: 'never',
        callbacks: {
          onEpochEnd: async (ep, logs) => {
            last = { loss: logs.loss, acc: logs.acc };
            onEpoch?.(ep + 1, epochs, logs.loss, logs.acc);
            await nextFrame();
          },
        },
      });
      this.model = m;
      return {
        epochs,
        loss: last.loss,
        acc: last.acc,
        seconds: (performance.now() - t0) / 1000,
        backend: tf.getBackend(),
        samples: items.length,
        augmented: n,
      };
    } finally {
      xs?.dispose();
      ys?.dispose();
      this.training = false;
    }
  }

  /** 对一组样本做预测；返回每张图的猫 / 狗概率 */
  async predict(ids) {
    if (!this.model) throw new Error('模型尚未训练，无法测试。');
    const tf = this.tf;
    const data = new Float32Array(ids.length * INPUT * INPUT * 3);
    ids.forEach((id, i) => data.set(this.dataset.get(id).pixels, i * INPUT * INPUT * 3));
    const x = tf.tensor4d(data, [ids.length, INPUT, INPUT, 3]);
    const y = this.model.predict(x);
    const probs = await y.data();
    x.dispose();
    y.dispose();
    return ids.map((id, i) => ({ id, cat: probs[i * 2], dog: probs[i * 2 + 1] }));
  }

  dispose() {
    this.model?.dispose();
    this.model = null;
  }
}
