// 场景一界面：预测 → 发现身边的 AI（判断工作方式）→ 输入与输出匹配 → 小结
import { SceneUI, esc } from './SceneUI.js';

const SLOTS = [
  ['input', '输入信息'],
  ['process', '系统处理'],
  ['output', '输出结果'],
];

export class CityUI extends SceneUI {
  constructor(app, scene) {
    super(app, scene);
    this.pred = new Set(this.st.prediction || []);
    this.picked = null; // 匹配任务中选中的卡片
    this.checked = null; // 最近一次检查的结果
    // 固定顺序打乱的卡片池
    const ids = this.def.matchDevices.flatMap((id) => SLOTS.map(([k]) => `${id}:${k}`));
    this.pool = ids.map((id, i) => [((i * 7 + 3) * 13) % 11, id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }
  dev(id) {
    return this.def.devices.find((d) => d.id === id);
  }
  judgedCount() {
    return Object.keys(this.st.judged).length;
  }
  maxStep() {
    const s = this.st;
    if (!s.prediction) return 0;
    if (this.judgedCount() < this.def.minJudged) return 1;
    if (!s.match.done) return 2;
    return 3;
  }
  taskHint() {
    return {
      predict: '先凭经验猜一猜：哪些设备用到了人工智能？',
      explore: `点击城市里的设备，判断它们的主要工作方式（至少 ${this.def.minJudged} 种）。`,
      match: '把输入、处理方式和输出放到对应的位置。',
      wrap: '对照你的预测，说说“自动化”和“人工智能”的区别。',
    }[this.stepId];
  }

  /** 点击三维设备 */
  onDevice(id) {
    const s = this.st;
    if (!s.prediction) {
      this.app.toast('先在右侧页面记录你的预测，再来探索设备');
      return;
    }
    s.current = id;
    if (!s.viewed.includes(id)) s.viewed.push(id);
    if (s.step !== 1) s.step = 1;
    this.save();
    this.app.ui.render();
    this.app.ui.scrollTop('right');
  }

  task() {
    return this[`t_${this.stepId}`]();
  }

  t_predict() {
    const s = this.st;
    return `
      <h3 class="q">先猜一猜：下面哪些设备“用到了人工智能”？<small>（可多选）</small></h3>
      <div class="opts two">${this.def.devices
        .map((d) => `<button class="opt check ${this.pred.has(d.id) ? 'sel' : ''}" data-act="pred" data-id="${d.id}"><i>${d.no}</i>${esc(d.name)}</button>`)
        .join('')}</div>
      ${s.prediction ? `<div class="fb info">已记录你的预测（${s.prediction.length} 种）。接下来到城市里逐个验证吧。</div>` : ''}
      <div class="next-row"><button class="btn primary" data-act="pred-save" ${this.pred.size ? '' : 'disabled'}>${s.prediction ? '更新预测并继续' : '记录我的预测'} →</button></div>`;
  }

  t_explore() {
    const s = this.st;
    const d = s.current && this.dev(s.current);
    const n = this.judgedCount();
    const j = d && s.judged[d.id];
    return `
      <div class="dev-chips">${this.def.devices
        .map((x) => `<button class="chip ${s.current === x.id ? 'on' : ''} ${s.judged[x.id] ? 'ok' : ''}" data-act="dev" data-id="${x.id}"><i>${x.no}</i>${esc(x.name)}${s.judged[x.id] ? ' ✓' : ''}</button>`)
        .join('')}</div>
      ${
        d
          ? `<div class="card">
          <h4>${d.no} · ${esc(d.name)}</h4>
          <div class="flow">
            <div class="fl in"><b>输入信息</b>${esc(d.input)}</div><span class="arr">→</span>
            <div class="fl pr"><b>系统处理</b>${esc(d.process)}</div><span class="arr">→</span>
            <div class="fl out"><b>输出结果</b>${esc(d.output)}</div>
          </div>
          <h3 class="q">它主要靠哪种方式工作？</h3>
          <div class="opts">${this.def.judgeOptions
            .map((o) => {
              const cls = j && j.choice === o.id ? (j.correct ? 'ok' : 'bad') : '';
              return `<button class="opt ${cls}" data-act="judge" data-id="${o.id}" ${j?.correct ? 'disabled' : ''}>${esc(o.text)}</button>`;
            })
            .join('')}</div>
          ${
            j
              ? `<div class="fb ${j.correct ? 'ok' : 'bad'}"><b>${j.correct ? '判断正确' : '再想一想'}</b>${j.correct ? esc(d.why) : d.kind === 'ai' ? '提示：它面对的情况千变万化，能用几条固定的“如果……就……”规则写全吗？' : '提示：它的做法会随着“见过的数据”改变吗？还是始终执行同一条固定规则？'}</div>`
              : ''
          }
        </div>`
          : `<div class="fb info"><b>怎样探索</b>点击立体城市中带编号的设备（或上方的名称），观察它的输入、处理和输出，再判断它的工作方式。</div>`
      }
      <div class="stat-row"><span>已判断 <b>${n}</b> / ${this.def.devices.length} 种设备</span><span class="muted">至少 ${this.def.minJudged} 种</span></div>
      ${this.nextBtn(n >= this.def.minJudged, '继续：输入与输出', `还需判断 ${Math.max(0, this.def.minJudged - n)} 种`)}`;
  }

  chipText(id) {
    const [dev, k] = id.split(':');
    return this.dev(dev)[k];
  }

  t_match() {
    const m = this.st.match;
    const used = new Set(Object.values(m.placed));
    return `
      <h3 class="q">把卡片拖到（或先点卡片、再点空格）对应的位置</h3>
      <div class="match">${this.def.matchDevices
        .map((id) => {
          const d = this.dev(id);
          return `<div class="m-row"><div class="m-name">${esc(d.name)}</div>${SLOTS.map(([k, label]) => {
            const key = `${id}:${k}`;
            const chip = m.placed[key];
            const state = this.checked && chip ? (chip === key ? 'ok' : 'bad') : '';
            return `<div class="slot ${state} ${chip ? 'filled' : ''}" data-act="slot" data-key="${key}" data-drop="slot"><small>${label}</small>${chip ? `<span>${esc(this.chipText(chip))}</span>` : ''}</div>`;
          }).join('')}</div>`;
        })
        .join('')}</div>
      ${
        m.done
          ? ''
          : `<div class="pool">${this.pool
              .filter((id) => !used.has(id))
              .map((id) => `<button class="mchip ${this.picked === id ? 'sel' : ''}" draggable="true" data-act="pick" data-id="${id}" data-drag="${id}">${esc(this.chipText(id))}</button>`)
              .join('')}</div>`
      }
      ${
        m.done
          ? `<div class="fb ok"><b>全部匹配正确</b>不管是不是人工智能，信息系统都可以用“输入 → 处理 → 输出”来描述。区别在“处理”这一步：是固定规则，还是从数据中训练出来的模型。</div>`
          : this.checked
          ? `<div class="fb bad"><b>还有 ${this.checked.wrong} 处需要调整</b>点击标红的格子可以取回卡片。想一想：这条信息是设备“接收到的”，还是它“给出的结果”？</div>`
          : ''
      }
      ${m.done ? this.nextBtn(true, '继续：小结') : `<div class="next-row"><button class="btn primary" data-act="match-check" ${used.size === this.pool.length ? '' : 'disabled'}>检查匹配</button></div>`}`;
  }

  t_wrap() {
    const s = this.st;
    const pred = new Set(s.prediction || []);
    return `
      <h3 class="q">对照你的预测</h3>
      <table class="tbl"><tr><th>设备</th><th>我的预测</th><th>主要工作方式</th></tr>
      ${this.def.devices
        .map((d) => {
          const p = pred.has(d.id);
          const hit = p === (d.kind === 'ai');
          return `<tr class="${hit ? '' : 'diff'}"><td>${esc(d.name)}</td><td>${p ? '用到 AI' : '没用到'}</td><td>${d.kind === 'ai' ? '人工智能（模型）' : '规则控制'}${s.judged[d.id] ? '' : ' <span class="muted">未探索</span>'}</td></tr>`;
        })
        .join('')}</table>
      <div class="fb info"><b>我的发现</b>能自动运行，不一定就是人工智能。判断的关键是“处理”这一步：<br>· <b>规则控制</b>：按人写好的固定规则办事；<br>· <b>人工智能</b>：依靠从大量数据中训练出来的模型来识别或判断。<br>一个产品里也常常两种方式都有。</div>
      ${this.finishBlock('你已经能用“输入—处理—输出”分析身边的设备了。')}`;
  }

  handle(act, d) {
    const s = this.st;
    switch (act) {
      case 'pred':
        this.pred.has(d.id) ? this.pred.delete(d.id) : this.pred.add(d.id);
        return this.refresh('right');
      case 'pred-save': {
        s.prediction = [...this.pred];
        const names = s.prediction.map((id) => this.dev(id).name).join('、');
        this.log('predict', `预测：我认为用到人工智能的设备有 ${names}。`);
        return this.goStep(1);
      }
      case 'dev':
        this.scene.onDevice(d.id);
        return;
      case 'judge': {
        const dev = this.dev(s.current);
        const correct = d.id === dev.kind;
        const prev = s.judged[dev.id];
        s.judged[dev.id] = { choice: d.id, correct, first: prev ? prev.first : correct };
        if (correct) this.log('judge', `判断“${dev.name}”：${dev.kind === 'ai' ? '人工智能' : '规则控制'}（${s.judged[dev.id].first ? '首次判断正确' : '修正后正确'}）。`);
        this.save();
        return this.app.ui.render();
      }
      case 'pick':
        this.picked = this.picked === d.id ? null : d.id;
        return this.refresh('right');
      case 'slot': {
        const m = s.match;
        if (m.done) return;
        if (m.placed[d.key] && !this.picked) delete m.placed[d.key];
        else if (this.picked) {
          m.placed[d.key] = this.picked;
          this.picked = null;
        }
        this.checked = null;
        this.save();
        return this.refresh('right');
      }
      case 'match-check': {
        const m = s.match;
        m.attempts += 1;
        const wrong = Object.entries(m.placed).filter(([k, v]) => k !== v).length;
        this.checked = { wrong };
        if (m.firstTry === null) m.firstTry = wrong === 0;
        if (wrong === 0) {
          m.done = true;
          this.log('match', `完成“输入—处理—输出”匹配（尝试 ${m.attempts} 次）。`);
        }
        this.save();
        return this.app.ui.render();
      }
      default:
    }
  }

  /** 拖放：把卡片放进空格 */
  onDrop(dragId, target) {
    const m = this.st.match;
    if (m.done || !target.dataset.key) return;
    m.placed[target.dataset.key] = dragId;
    this.picked = null;
    this.checked = null;
    this.save();
    this.refresh('right');
  }
}
