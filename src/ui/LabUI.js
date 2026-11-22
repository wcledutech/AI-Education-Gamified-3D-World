// 场景二界面：认识数据 → 标注 → 训练 → 测试 → 对比实验 → 小结
// 训练与测试调用 ml/ 中的真实算法；界面只显示算法返回的数值。
import { SceneUI, esc } from './SceneUI.js';
import { ModelTrainer } from '../ml/ModelTrainer.js';
import { ModelEvaluator } from '../ml/ModelEvaluator.js';
import { latestRuns } from '../learning/Assessment.js';

const CN = { cat: '猫', dog: '狗' };
const EPOCHS = 44;

export class LabUI extends SceneUI {
  constructor(app, scene) {
    super(app, scene);
    this.ds = app.dataset;
    this.trainer = new ModelTrainer(this.ds);
    this.evaluator = new ModelEvaluator(this.ds, this.trainer);
    this.train = { state: 'idle' }; // 训练状态（来自真实训练过程）
    this.busy = false;
    this.modelRun = null; // 当前内存中模型对应的训练记录
    this.tested = {}; // 当前模型的逐张测试结果
    this.testPick = null;
    this.showWrong = false;
    this.view = null; // “认识数据”中正在查看的样本
  }
  stats() {
    return this.ds.stats(this.st.labels);
  }
  maxStep() {
    const s = this.st;
    if (!s.prediction) return 0;
    if (this.stats().labeled < this.ds.train.length) return 1;
    if (!s.runs.length) return 2;
    if (!s.runs.some((r) => r.test)) return 3;
    const runs = latestRuns(s);
    if (!(runs.B || runs.C) || !s.explainChoice) return 4;
    return 5;
  }
  taskHint() {
    return {
      know: '观察训练图片，想一想模型可以依据哪些特征来区分猫和狗。',
      label: '为 20 张训练图片逐一贴上“猫”或“狗”的标签。',
      train: '用你标注的数据训练模型，观察训练过程中的数值变化。',
      test: '用模型没见过的 10 张图片测试它。',
      compare: '改变数据条件重新训练，用同一组测试图片比较结果。',
      wrap: '总结数据、标签、训练、模型和预测之间的关系。',
    }[this.stepId];
  }

  enter() {
    const s = this.st;
    const sc = this.scene;
    const id = this.stepId;
    if (id === 'label') sc.syncCards(s.labels, [], s.selected);
    else if (id === 'compare' && this.lastCond) sc.syncCards(this.lastCond.labels, this.lastCond.excluded);
    else sc.syncCards(s.labels, []);
    if (id !== 'test') sc.showTest(null, null);
  }

  // ---------- 三维对象点击 ----------
  onStation(id) {
    this.scene.highlight(id);
    this.showConcept(this.def.stations[id]);
  }
  onSample(id) {
    const smp = this.ds.get(id);
    const s = this.st;
    if (smp.set === 'train') {
      if (this.stepId === 'know') {
        this.view = id;
        return this.refresh('right');
      }
      if (this.stepId !== 'label') {
        if (this.maxStep() < 1) return this.app.toast('先完成“认识数据”中的预测');
        if (this.busy) return;
        s.step = 1;
      }
      s.selected = id;
      this.save();
      this.enter();
      this.app.ui.render();
    } else {
      if (!this.trainer.model) return this.app.toast('模型还没有训练，暂时不能测试');
      if (this.busy) return;
      if (this.stepId !== 'test') {
        s.step = 3;
        this.save();
        this.enter();
      }
      this.testOne(id);
    }
  }

  // ---------- 任务区 ----------
  task() {
    return this[`t_${this.stepId}`]();
  }

  thumb(smp, { act, cls = '', badge = '' } = {}) {
    return `<button class="thumb ${cls}" data-act="${act}" data-id="${smp.id}" draggable="${act === 'sel' ? 'true' : 'false'}" data-drag="${smp.id}" title="${smp.id}"><img src="${smp.url}" alt="样本 ${smp.id}" draggable="false">${badge}</button>`;
  }

  t_know() {
    const s = this.st;
    const P = this.def.predict;
    const v = this.view && this.ds.get(this.view);
    return `
      <h3 class="q">${esc(P.q)}</h3>
      <div class="opts">${P.options.map((o) => `<button class="opt ${s.prediction === o.id ? 'sel' : ''}" data-act="pred" data-id="${o.id}">${esc(o.text)}</button>`).join('')}</div>
      ${s.prediction ? `<div class="fb info">已记录你的想法。接下来用实验检验它。</div>` : ''}
      <h3 class="q">观察训练图片 <small>点击图片放大</small></h3>
      <div class="thumbs">${this.ds.train.map((x) => this.thumb(x, { act: 'view', cls: this.view === x.id ? 'on' : '' })).join('')}</div>
      ${v ? `<div class="preview"><img src="${v.url}" alt=""><div><b>样本 ${v.id}</b><p>仔细看：耳朵的形状、口鼻、胡须、尾巴、体型……哪些特征能帮助区分猫和狗？颜色和背景可靠吗？</p></div></div>` : ''}
      <div class="fb info"><b>两份数据</b>训练集 20 张：用来让模型学习。测试集 10 张：放在右前方的样本架上，<u>从不参与训练</u>，留着最后检验模型。</div>
      ${this.nextBtn(!!s.prediction, '继续：标注数据', '先选择你的预测')}`;
  }

  t_label() {
    const s = this.st;
    const st = this.stats();
    const sel = s.selected && this.ds.get(s.selected);
    const all = st.labeled === st.total;
    return `
      <div class="label-top">
        ${
          sel
            ? `<div class="preview big"><img src="${sel.url}" alt=""><div><b>样本 ${sel.id}</b><p>${s.labels[sel.id] ? `当前标签：<b>${CN[s.labels[sel.id]]}</b>（可修改）` : '它是猫还是狗？'}</p>
            <div class="lab-btns"><button class="btn cat" data-act="lab" data-v="cat" data-drop="cat">猫</button><button class="btn dog" data-act="lab" data-v="dog" data-drop="dog">狗</button></div></div></div>`
            : `<div class="fb info"><b>怎样标注</b>点击下面的图片（或立体展示台上的卡片）选中它，再点“猫”或“狗”。也可以把图片直接拖到按钮上。</div>
            <div class="lab-btns"><button class="btn cat" data-drop="cat" disabled>猫</button><button class="btn dog" data-drop="dog" disabled>狗</button></div>`
        }
      </div>
      <div class="thumbs">${this.ds.train
        .map((x) => {
          const l = s.labels[x.id];
          const wrong = this.showWrong && l && l !== x.cls;
          return this.thumb(x, { act: 'sel', cls: `${s.selected === x.id ? 'on' : ''} ${l ? 'lab-' + l : ''} ${wrong ? 'wrong' : ''}`, badge: l ? `<em>${CN[l]}</em>` : '' });
        })
        .join('')}</div>
      <div class="stats">
        <div><b>${st.labeled}</b>/${st.total}<small>已标注</small></div>
        <div><b>${st.cat}</b><small>猫</small></div>
        <div><b>${st.dog}</b><small>狗</small></div>
        <div><b>${all ? st.wrong.length : '—'}</b><small>错误标签</small></div>
      </div>
      <div class="bar2"><i style="width:${st.labeled ? (st.cat / st.labeled) * 100 : 50}%"></i></div>
      <div class="bar2-cap"><span>猫 ${st.cat}</span><span>样本分布</span><span>狗 ${st.dog}</span></div>
      ${
        all
          ? `<div class="fb ${st.wrong.length ? 'bad' : 'ok'}"><b>标注检查</b>${st.wrong.length ? `有 ${st.wrong.length} 张图片的标签与真实类别不一致。<button class="link" data-act="show-wrong">${this.showWrong ? '隐藏' : '显示是哪些'}</button> 你可以修改它们，也可以先保留，看看对模型有什么影响。` : '全部标签与真实类别一致。'}</div>`
          : ''
      }
      ${this.app.state.data.teacher && !all ? `<button class="btn sm ghost" data-act="auto-label">教师模式：按真实类别标注其余样本</button>` : ''}
      ${this.nextBtn(all, '继续：训练模型', `还有 ${st.total - st.labeled} 张未标注`)}`;
  }

  trainBox() {
    const t = this.train;
    if (t.state === 'idle') return '';
    if (t.state === 'error') return `<div class="fb bad"><b>训练没有成功</b>${esc(t.message)}<br><span class="muted">可能的原因：浏览器不支持所需的计算功能，或内存不足。请换用新版 Chrome / Edge 后重试。</span></div>`;
    const pct = Math.round(((t.epoch || 0) / t.total) * 100);
    return `<div class="train-box ${t.state}">
      <div class="tb-head"><b id="tb-title">${t.state === 'training' ? '正在训练…' : '训练完成'}</b><span id="tb-ep">第 ${t.epoch || 0}/${t.total} 轮</span></div>
      <div class="pbar"><i id="tb-bar" style="width:${pct}%"></i></div>
      <div class="tb-nums"><span>损失 <b id="tb-loss">${t.loss != null ? t.loss.toFixed(3) : '—'}</b></span><span>训练集正确率 <b id="tb-acc">${t.acc != null ? (t.acc * 100).toFixed(0) + '%' : '—'}</b></span><span>训练样本 <b>${t.samples}</b></span></div>
      ${t.state === 'done' ? `<div class="muted">用时 ${t.seconds.toFixed(1)} 秒 · 计算后端 ${esc(t.backend)} · 训练在你的浏览器中真实执行</div>` : '<div class="muted">“损失”表示模型猜得有多不准，通常会逐渐变小。</div>'}
    </div>`;
  }

  t_train() {
    const st = this.stats();
    const done = this.st.runs.length > 0;
    return `
      <h3 class="q">用你标注的数据训练模型</h3>
      <div class="stats">
        <div><b>${st.labeled}</b><small>训练样本</small></div>
        <div><b>${st.cat}</b><small>标为猫</small></div>
        <div><b>${st.dog}</b><small>标为狗</small></div>
        <div><b>${st.wrong.length}</b><small>错误标签</small></div>
      </div>
      <div class="fb info"><b>训练时发生了什么</b>算法会把这些图片看 ${EPOCHS} 轮：每一轮都让模型先猜，再对照你给的标签，一点点调整模型。</div>
      ${this.trainBox()}
      <div class="next-row"><button class="btn primary" data-act="train" data-cond="A" ${this.busy ? 'disabled' : ''}>${this.busy ? '训练中…' : done ? '重新训练' : '开始训练'}</button></div>
      ${done && !this.busy ? this.nextBtn(true, '继续：测试模型') : ''}`;
  }

  resultRow(r) {
    const smp = this.ds.get(r.id);
    return `<tr class="${r.correct ? '' : 'diff'}"><td><img class="tiny" src="${smp.url}" alt=""></td><td>${CN[r.pred]}</td><td>${(r.conf * 100).toFixed(0)}%</td><td>${CN[r.actual]}</td><td>${r.correct ? '✓ 正确' : '✗ 错误'}</td></tr>`;
  }

  t_test() {
    if (!this.trainer.model) {
      return `<div class="fb info"><b>需要先训练模型</b>模型保存在浏览器内存中，${this.st.runs.length ? '刷新页面后需要重新训练。' : '请先完成训练。'}</div><div class="next-row"><button class="btn primary" data-act="step" data-i="2">去训练模型</button></div>`;
    }
    const res = Object.values(this.tested);
    const n = res.length;
    const ok = res.filter((r) => r.correct).length;
    const cur = this.testPick && this.tested[this.testPick];
    const allTested = n === this.ds.test.length;
    return `
      <h3 class="q">测试：模型没见过的 10 张图片 <small>点击图片送上测试平台</small></h3>
      <div class="thumbs test">${this.ds.test
        .map((x) => {
          const r = this.tested[x.id];
          return this.thumb(x, { act: 'test', cls: `${this.testPick === x.id ? 'on' : ''} ${r ? (r.correct ? 'ok' : 'wrong') : ''}`, badge: r ? `<em>${r.correct ? '✓' : '✗'}</em>` : '' });
        })
        .join('')}</div>
      ${
        cur
          ? `<div class="card result ${cur.correct ? 'ok' : 'bad'}"><img src="${this.ds.get(cur.id).url}" alt=""><div>
          <div class="kv"><span>预测类别</span><b>${CN[cur.pred]}</b></div>
          <div class="kv"><span>预测置信度</span><b>${(cur.conf * 100).toFixed(0)}%</b></div>
          <div class="kv"><span>实际类别</span><b>${CN[cur.actual]}</b></div>
          <div class="kv"><span>判断</span><b>${cur.correct ? '预测正确' : '预测错误'}</b></div></div></div>`
          : ''
      }
      <div class="stats"><div><b>${n}</b><small>测试样本数</small></div><div><b>${ok}</b><small>预测正确数</small></div><div><b>${n ? Math.round((ok / n) * 100) + '%' : '—'}</b><small>正确率</small></div></div>
      <div class="next-row"><button class="btn" data-act="test-all" ${this.busy ? 'disabled' : ''}>测试全部 10 张</button></div>
      ${allTested ? `<table class="tbl sm"><tr><th>图片</th><th>预测</th><th>置信度</th><th>实际</th><th>结果</th></tr>${res.map((r) => this.resultRow(r)).join('')}</table>` : ''}
      <div class="fb info"><b>注意</b>置信度表示模型对这次判断的“把握程度”，<u>不等于预测一定正确</u>——模型也可能很有把握地判断错。</div>
      ${this.nextBtn(allTested, '继续：对比实验', '先测试全部 10 张')}`;
  }

  t_compare() {
    const s = this.st;
    const C = this.def.conditions;
    const runs = latestRuns(s);
    const counts = {};
    s.runs.forEach((r) => r.test && (counts[r.cond] = (counts[r.cond] || 0) + 1));
    const haveBC = !!(runs.B || runs.C);
    return `
      <h3 class="q">为什么 AI 会出错？改变数据条件，再比一比</h3>
      <div class="conds">${['A', 'B', 'C']
        .map((k) => `<div class="cond ${this.train.cond === k && this.busy ? 'run' : ''}"><div><b>${C[k].name}</b> ${esc(C[k].title)}<p>${esc(C[k].desc)}</p></div><button class="btn sm" data-act="train" data-cond="${k}" ${this.busy ? 'disabled' : ''}>${counts[k] ? '再做一次' : '训练并测试'}</button></div>`)
        .join('')}</div>
      ${this.trainBox()}
      <table class="tbl sm"><tr><th>条件</th><th>训练样本<br>猫 / 狗</th><th>错误<br>标签</th><th>测试<br>正确率</th><th>猫</th><th>狗</th><th>次数</th></tr>
      ${['A', 'B', 'C']
        .map((k) => {
          const r = runs[k];
          return r
            ? `<tr><td>${C[k].name}</td><td>${r.cat} / ${r.dog}</td><td>${r.wrong}</td><td><b>${r.test.correct}/${r.test.n}</b></td><td>${r.test.catCorrect}/${r.test.catN}</td><td>${r.test.dogCorrect}/${r.test.dogN}</td><td>${counts[k]}</td></tr>`
            : `<tr class="muted"><td>${C[k].name}</td><td colspan="6">尚未运行</td></tr>`;
        })
        .join('')}</table>
      <div class="muted">三种条件使用同一组 10 张测试图片。每次训练都从随机起点开始，同一条件多做几次，结果也可能不同。</div>
      ${
        haveBC
          ? `<h3 class="q">观察表格：为什么测试结果会发生变化？</h3>
        <div class="opts">${this.def.explainOptions.map((o) => `<button class="opt ${s.explainChoice === o.id ? (o.id === 'data' ? 'ok' : 'bad') : ''}" data-act="explain" data-id="${o.id}">${esc(o.text)}</button>`).join('')}</div>
        ${s.explainChoice ? `<div class="fb ${s.explainChoice === 'data' ? 'ok' : 'bad'}">${s.explainChoice === 'data' ? '是的。模型只能从它看到的数据里学习：某一类样本太少，或者标签有错，它学到的规律就可能出现偏差。' : s.explainChoice === 'random' ? '再看看表格：数据条件不同，猫和狗各自的正确数也跟着变化，这不是完全随机的。（不过每次训练确实带有一些随机性。）' : '注意表格下方的说明：三种条件用的是同一组 10 张测试图片。'}</div>` : ''}
        <label class="fld"><span>用自己的话写一写：你观察到了什么？</span><textarea data-input="explain" rows="3" placeholder="例如：当狗的训练图片只剩 2 张时……">${esc(s.explainText)}</textarea></label>`
          : `<div class="fb info">至少完成实验 B 或实验 C，再和实验 A 比较。</div>`
      }
      ${this.nextBtn(haveBC && !!s.explainChoice, '继续：小结', haveBC ? '先选择一种解释' : '')}`;
  }

  t_wrap() {
    const s = this.st;
    const runs = latestRuns(s);
    const P = this.def.predict.options;
    const items = [
      ['一组训练数据标注', this.stats().labeled >= 20],
      ['一次真实模型训练', s.runs.length > 0],
      ['一次独立测试', s.runs.some((r) => r.test)],
      ['一次数据条件调整', !!(runs.B || runs.C)],
      ['一段关于预测结果变化的解释', !!s.explainChoice],
    ];
    return `
      <h3 class="q">回到最初的问题</h3>
      <div class="fb info">你当初的想法：“${esc(P.find((o) => o.id === s.prediction)?.text || '')}”<br><b>实验告诉我们：</b>模型没有“背下”图片，也没有人替它写好规则——它是从带标签的数据中找规律，再用规律去判断新图片。所以数据变了，它学到的规律也会变。</div>
      <ol class="sum">${this.def.summary.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="callout"><b>特别提醒</b>${esc(this.def.emphasis)}</div>
      <h3 class="q">本页学习成果</h3>
      <ul class="checks">${items.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</li>`).join('')}</ul>
      ${this.finishBlock('你亲手标注了数据、训练并测试了一个模型，实验记录已保存。')}`;
  }

  // ---------- 真实训练 / 测试 ----------
  async run(cond) {
    if (this.busy) return;
    const s = this.st;
    const built = this.ds.buildCondition(s.labels, cond, { minor: 'dog', keep: 2, flips: 6, seed: (Date.now() % 90000) + 7 });
    const eff = {};
    built.items.forEach((it) => (eff[it.id] = it.label));
    // 被移出训练集的样本仍显示原标签（灰显）
    built.excluded.forEach((id) => (eff[id] = s.labels[id]));
    this.lastCond = { labels: eff, excluded: built.excluded };
    const cat = built.items.filter((i) => i.label === 'cat').length;
    const dog = built.items.length - cat;
    const wrong = built.items.filter((i) => i.label !== this.ds.get(i.id).cls).length;
    const sc = this.scene;
    this.busy = true;
    this.modelRun = null;
    this.tested = {};
    this.testPick = null;
    sc.showTest(null, null);
    sc.syncCards(eff, built.excluded);
    sc.setTraining(true);
    sc.highlight('host');
    this.train = { state: 'training', cond, epoch: 0, total: EPOCHS, loss: null, acc: null, samples: built.items.length, history: [] };
    this.app.ui.render();
    const run = { id: Date.now(), t: Date.now(), cond, cat, dog, wrong, flipped: built.flipped.length, excluded: built.excluded.length, test: null };
    try {
      const info = await this.trainer.train(built.items, {
        epochs: EPOCHS,
        onEpoch: (epoch, total, loss, acc) => {
          const t = this.train;
          Object.assign(t, { epoch, loss, acc });
          t.history.push(loss);
          sc.drawHost({ state: 'training', epoch, total, loss, acc, samples: t.samples, history: t.history });
          this.patchTrainBox();
        },
      });
      Object.assign(this.train, { state: 'done', seconds: info.seconds, backend: info.backend });
      Object.assign(run, { epochs: info.epochs, loss: info.loss, trainAcc: info.acc, seconds: info.seconds, backend: info.backend });
      sc.drawHost({ ...this.train, state: 'done' });
      this.modelRun = run;
      s.runs.push(run);
      if (s.runs.length > 30) s.runs.shift();
      this.log('train', `${this.def.conditions[cond].name}：用 猫${cat}/狗${dog} 张样本（错误标签 ${wrong}）完成训练，训练集正确率 ${(info.acc * 100).toFixed(0)}%。`);
      if (this.stepId === 'compare') await this.testAll(true);
    } catch (e) {
      console.error(e);
      this.train = { state: 'error', message: e?.message || String(e) };
      sc.drawHost({ state: 'error', message: this.train.message });
    } finally {
      sc.setTraining(false);
      this.busy = false;
      this.save();
      this.app.ui.render();
    }
  }

  /** 训练过程中只更新数字，避免整页重绘 */
  patchTrainBox() {
    const t = this.train;
    const root = this.app.ui.rightEl;
    const set = (id, v) => {
      const el = root.querySelector('#' + id);
      if (el) el.textContent = v;
    };
    set('tb-ep', `第 ${t.epoch}/${t.total} 轮`);
    set('tb-loss', t.loss.toFixed(3));
    set('tb-acc', (t.acc * 100).toFixed(0) + '%');
    const bar = root.querySelector('#tb-bar');
    if (bar) bar.style.width = `${(t.epoch / t.total) * 100}%`;
  }

  async testOne(id) {
    if (!this.trainer.model) return;
    try {
      const [r] = await this.evaluator.evaluate([id]);
      this.tested[id] = r;
      this.testPick = id;
      this.scene.showTest(id, r);
      this.scene.highlight('test');
      this.finishTestIfAll();
    } catch (e) {
      this.app.toast('测试失败：' + (e?.message || e));
    }
    this.app.ui.render();
  }

  finishTestIfAll() {
    const res = this.ds.test.map((x) => this.tested[x.id]);
    if (res.every(Boolean) && this.modelRun && !this.modelRun.test) {
      const sum = ModelEvaluator.summarize(res);
      this.modelRun.test = { ...sum, details: sum.details.map((d) => ({ id: d.id, pred: d.pred, conf: +d.conf.toFixed(3), correct: d.correct })) };
      this.log('test', `${this.def.conditions[this.modelRun.cond].name}：独立测试正确 ${sum.correct}/${sum.n}（猫 ${sum.catCorrect}/${sum.catN}，狗 ${sum.dogCorrect}/${sum.dogN}）。`);
      this.save();
    }
  }

  async testAll(silent = false) {
    if (!this.trainer.model) return;
    try {
      const sum = await this.evaluator.evaluateAll();
      sum.details.forEach((d) => (this.tested[d.id] = d));
      const last = sum.details.find((d) => !d.correct) || sum.details[0];
      this.testPick = last.id;
      this.scene.showTest(last.id, last);
      this.finishTestIfAll();
    } catch (e) {
      this.app.toast('测试失败：' + (e?.message || e));
    }
    if (!silent) this.app.ui.render();
  }

  handle(act, d) {
    const s = this.st;
    switch (act) {
      case 'pred':
        s.prediction = d.id;
        this.log('predict', `预测：${this.def.predict.options.find((o) => o.id === d.id).text}`);
        this.save();
        return this.app.ui.render();
      case 'view':
        this.view = d.id;
        this.scene.highlight(d.id);
        return this.refresh('right');
      case 'sel':
        s.selected = s.selected === d.id ? null : d.id;
        this.save();
        this.enter();
        return this.refresh('right');
      case 'lab':
        return this.setLabel(s.selected, d.v);
      case 'show-wrong':
        this.showWrong = !this.showWrong;
        return this.refresh('right');
      case 'auto-label':
        this.ds.train.forEach((x) => (s.labels[x.id] = s.labels[x.id] || x.cls));
        s.selected = null;
        this.log('label', '教师模式：按真实类别完成其余样本的标注。');
        this.save();
        this.enter();
        return this.app.ui.render();
      case 'train':
        if (d.cond === 'A' && this.stepId === 'train') this.lastCond = null;
        return this.run(d.cond);
      case 'test':
        return this.testOne(d.id);
      case 'test-all':
        return this.testAll();
      case 'explain':
        s.explainChoice = d.id;
        if (d.id === 'data') this.log('explain', '解释：训练数据不同，模型学到的规律不同，预测也随之变化。');
        this.save();
        return this.app.ui.render();
      default:
    }
  }

  setLabel(id, v) {
    if (!id || this.busy) return;
    const s = this.st;
    const first = !s.labels[id];
    s.labels[id] = v;
    // 自动选中下一张未标注的图片
    const next = this.ds.train.find((x) => !s.labels[x.id]);
    s.selected = first && next ? next.id : null;
    const st = this.stats();
    if (st.labeled === st.total && first) this.log('label', `完成 20 张训练图片的标注：猫 ${st.cat} 张，狗 ${st.dog} 张，与真实类别不一致 ${st.wrong.length} 张。`);
    this.save();
    this.enter();
    this.app.ui.render();
  }

  onInput(name, value) {
    if (name === 'explain') {
      this.st.explainText = value;
      this.save();
    }
  }

  onDrop(dragId, target) {
    const v = target.dataset.drop;
    if (this.stepId === 'label' && (v === 'cat' || v === 'dog')) this.setLabel(dragId, v);
  }
}
