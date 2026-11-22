// 模型评估：用从未参与训练的测试样本检验模型，统计正确率。
export class ModelEvaluator {
  constructor(dataset, trainer) {
    this.dataset = dataset;
    this.trainer = trainer;
  }

  /** @returns [{id, pred, conf, actual, correct, cat, dog}] */
  async evaluate(ids) {
    const out = await this.trainer.predict(ids);
    return out.map((o) => {
      const pred = o.cat >= o.dog ? 'cat' : 'dog';
      const actual = this.dataset.get(o.id).cls;
      return { id: o.id, pred, conf: Math.max(o.cat, o.dog), actual, correct: pred === actual, cat: o.cat, dog: o.dog };
    });
  }

  async evaluateAll() {
    const details = await this.evaluate(this.dataset.test.map((s) => s.id));
    return ModelEvaluator.summarize(details);
  }

  static summarize(details) {
    const sum = (f) => details.filter(f).length;
    return {
      n: details.length,
      correct: sum((d) => d.correct),
      acc: details.length ? sum((d) => d.correct) / details.length : 0,
      catN: sum((d) => d.actual === 'cat'),
      catCorrect: sum((d) => d.actual === 'cat' && d.correct),
      dogN: sum((d) => d.actual === 'dog'),
      dogCorrect: sum((d) => d.actual === 'dog' && d.correct),
      details,
    };
  }
}
