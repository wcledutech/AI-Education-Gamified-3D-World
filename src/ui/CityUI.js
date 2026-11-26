// 场景一界面：预测 → 发现身边的 AI（判断工作方式）→ 输入与输出匹配 → 小结
import { SceneUI, esc } from './SceneUI.js';
import { T } from '../utils/i18n.js';

const SLOT_KEYS = ['input', 'process', 'output'];
const slotLabel = (k) => ({ input: T('输入信息', 'Input'), process: T('系统处理', 'Processing'), output: T('输出结果', 'Output') }[k]);

export class CityUI extends SceneUI {
  constructor(app, scene) {
    super(app, scene);
    this.pred = new Set(this.st.prediction || []);
    this.picked = null; // 匹配任务中选中的卡片
    this.checked = null; // 最近一次检查的结果
    // 固定顺序打乱的卡片池
    const ids = this.def.matchDevices.flatMap((id) => SLOT_KEYS.map((k) => `${id}:${k}`));
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
      predict: T('先凭经验猜一猜：哪些设备用到了人工智能？', 'Start with a guess from experience: which devices use AI?'),
      explore: T(`点击城市里的设备，判断它们的主要工作方式（至少 ${this.def.minJudged} 种）。`, `Click the devices in the city and judge how each one mainly works (at least ${this.def.minJudged}).`),
      match: T('把输入、处理方式和输出放到对应的位置。', 'Put each input, process and output in the right place.'),
      wrap: T('对照你的预测，说说“自动化”和“人工智能”的区别。', 'Compare with your prediction and explain how “automation” differs from “AI”.'),
    }[this.stepId];
  }

  /** 点击三维设备 */
  onDevice(id) {
    const s = this.st;
    if (!s.prediction) {
      this.app.toast(T('先在右侧页面记录你的预测，再来探索设备', 'Record your prediction on the right-hand page first, then explore the devices.'));
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
      <h3 class="q">${T('先猜一猜：下面哪些设备“用到了人工智能”？', 'First, a guess: which of these devices “use AI”?')}<small>${T('（可多选）', ' (choose any)')}</small></h3>
      <div class="opts two">${this.def.devices
        .map((d) => `<button class="opt check ${this.pred.has(d.id) ? 'sel' : ''}" data-act="pred" data-id="${d.id}"><i>${d.no}</i>${esc(d.name)}</button>`)
        .join('')}</div>
      ${s.prediction ? `<div class="fb info">${T(`已记录你的预测（${s.prediction.length} 种）。接下来到城市里逐个验证吧。`, `Your prediction is recorded (${s.prediction.length} selected). Now check them one by one in the city.`)}</div>` : ''}
      <div class="next-row"><button class="btn primary" data-act="pred-save" ${this.pred.size ? '' : 'disabled'}>${s.prediction ? T('更新预测并继续', 'Update prediction and continue') : T('记录我的预测', 'Record my prediction')} →</button></div>`;
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
            <div class="fl in"><b>${slotLabel('input')}</b>${esc(d.input)}</div><span class="arr">→</span>
            <div class="fl pr"><b>${slotLabel('process')}</b>${esc(d.process)}</div><span class="arr">→</span>
            <div class="fl out"><b>${slotLabel('output')}</b>${esc(d.output)}</div>
          </div>
          <h3 class="q">${T('它主要靠哪种方式工作？', 'How does it mainly work?')}</h3>
          <div class="opts">${this.def.judgeOptions
            .map((o) => {
              const cls = j && j.choice === o.id ? (j.correct ? 'ok' : 'bad') : '';
              return `<button class="opt ${cls}" data-act="judge" data-id="${o.id}" ${j?.correct ? 'disabled' : ''}>${esc(o.text)}</button>`;
            })
            .join('')}</div>
          ${
            j
              ? `<div class="fb ${j.correct ? 'ok' : 'bad'}"><b>${j.correct ? T('判断正确', 'Correct') : T('再想一想', 'Think again')}</b>${
                  j.correct
                    ? esc(d.why)
                    : d.kind === 'ai'
                    ? T('提示：它面对的情况千变万化，能用几条固定的“如果……就……”规则写全吗？', 'Hint: the situations it faces vary endlessly. Could a few fixed “if … then …” rules cover them all?')
                    : T('提示：它的做法会随着“见过的数据”改变吗？还是始终执行同一条固定规则？', 'Hint: does its behavior change with the data it has “seen”, or does it always carry out the same fixed rule?')
                }</div>`
              : ''
          }
        </div>`
          : `<div class="fb info"><b>${T('怎样探索', 'How to explore')}</b>${T('点击立体城市中带编号的设备（或上方的名称），观察它的输入、处理和输出，再判断它的工作方式。', 'Click a numbered device in the 3D city (or its name above), look at its input, processing and output, then judge how it works.')}</div>`
      }
      <div class="stat-row"><span>${T(`已判断 <b>${n}</b> / ${this.def.devices.length} 种设备`, `Judged <b>${n}</b> / ${this.def.devices.length} devices`)}</span><span class="muted">${T(`至少 ${this.def.minJudged} 种`, `at least ${this.def.minJudged}`)}</span></div>
      ${this.nextBtn(n >= this.def.minJudged, T('继续：输入与输出', 'Next: input & output'), T(`还需判断 ${Math.max(0, this.def.minJudged - n)} 种`, `${Math.max(0, this.def.minJudged - n)} more to judge`))}`;
  }

  chipText(id) {
    const [dev, k] = id.split(':');
    return this.dev(dev)[k];
  }

  t_match() {
    const m = this.st.match;
    const used = new Set(Object.values(m.placed));
    return `
      <h3 class="q">${T('把卡片拖到（或先点卡片、再点空格）对应的位置', 'Drag each card to its place (or click a card, then click a slot)')}</h3>
      <div class="match">${this.def.matchDevices
        .map((id) => {
          const d = this.dev(id);
          return `<div class="m-row"><div class="m-name">${esc(d.name)}</div>${SLOT_KEYS.map((k) => {
            const key = `${id}:${k}`;
            const chip = m.placed[key];
            const state = this.checked && chip ? (chip === key ? 'ok' : 'bad') : '';
            return `<div class="slot ${state} ${chip ? 'filled' : ''}" data-act="slot" data-key="${key}" data-drop="slot"><small>${slotLabel(k)}</small>${chip ? `<span>${esc(this.chipText(chip))}</span>` : ''}</div>`;
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
          ? `<div class="fb ok"><b>${T('全部匹配正确', 'All matched correctly')}</b>${T(
              '不管是不是人工智能，信息系统都可以用“输入 → 处理 → 输出”来描述。区别在“处理”这一步：是固定规则，还是从数据中训练出来的模型。',
              'AI or not, an information system can be described as “input → processing → output”. The difference lies in the processing step: fixed rules, or a model trained from data.'
            )}</div>`
          : this.checked
          ? `<div class="fb bad"><b>${T(`还有 ${this.checked.wrong} 处需要调整`, `${this.checked.wrong} still to fix`)}</b>${T(
              '点击标红的格子可以取回卡片。想一想：这条信息是设备“接收到的”，还是它“给出的结果”？',
              'Click a red slot to take its card back. Ask yourself: is this something the device “takes in”, or a result it “gives out”?'
            )}</div>`
          : ''
      }
      ${m.done ? this.nextBtn(true, T('继续：小结', 'Next: wrap-up')) : `<div class="next-row"><button class="btn primary" data-act="match-check" ${used.size === this.pool.length ? '' : 'disabled'}>${T('检查匹配', 'Check matches')}</button></div>`}`;
  }

  t_wrap() {
    const s = this.st;
    const pred = new Set(s.prediction || []);
    return `
      <h3 class="q">${T('对照你的预测', 'Compare with your prediction')}</h3>
      <table class="tbl"><tr><th>${T('设备', 'Device')}</th><th>${T('我的预测', 'My prediction')}</th><th>${T('主要工作方式', 'How it mainly works')}</th></tr>
      ${this.def.devices
        .map((d) => {
          const p = pred.has(d.id);
          const hit = p === (d.kind === 'ai');
          return `<tr class="${hit ? '' : 'diff'}"><td>${esc(d.name)}</td><td>${p ? T('用到 AI', 'Uses AI') : T('没用到', 'No AI')}</td><td>${d.kind === 'ai' ? T('人工智能（模型）', 'AI (model)') : T('规则控制', 'Rule-based')}${s.judged[d.id] ? '' : ` <span class="muted">${T('未探索', 'not explored')}</span>`}</td></tr>`;
        })
        .join('')}</table>
      <div class="fb info"><b>${T('我的发现', 'What I found')}</b>${T(
        '能自动运行，不一定就是人工智能。判断的关键是“处理”这一步：<br>· <b>规则控制</b>：按人写好的固定规则办事；<br>· <b>人工智能</b>：依靠从大量数据中训练出来的模型来识别或判断。<br>一个产品里也常常两种方式都有。',
        'Running automatically does not necessarily mean AI. The key is the processing step:<br>· <b>Rule-based control</b>: follows fixed rules written by people;<br>· <b>AI</b>: relies on a model trained from lots of data to recognize or decide.<br>A single product often uses both.'
      )}</div>
      ${this.finishBlock(T('你已经能用“输入—处理—输出”分析身边的设备了。', 'You can now analyze the devices around you in terms of input, processing and output.'))}`;
  }

  handle(act, d) {
    const s = this.st;
    switch (act) {
      case 'pred':
        this.pred.has(d.id) ? this.pred.delete(d.id) : this.pred.add(d.id);
        return this.refresh('right');
      case 'pred-save': {
        s.prediction = [...this.pred];
        const names = s.prediction.map((id) => this.dev(id).name).join(T('、', ', '));
        this.log('predict', T(`预测：我认为用到人工智能的设备有 ${names}。`, `Prediction: I think these devices use AI: ${names}.`));
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
        if (correct) {
          const first = s.judged[dev.id].first;
          this.log(
            'judge',
            T(
              `判断“${dev.name}”：${dev.kind === 'ai' ? '人工智能' : '规则控制'}（${first ? '首次判断正确' : '修正后正确'}）。`,
              `Judged “${dev.name}”: ${dev.kind === 'ai' ? 'AI' : 'rule-based control'} (${first ? 'right first time' : 'right after a second try'}).`
            )
          );
        }
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
          this.log('match', T(`完成“输入—处理—输出”匹配（尝试 ${m.attempts} 次）。`, `Completed the input–processing–output matching (${m.attempts} attempt${m.attempts > 1 ? 's' : ''}).`));
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
