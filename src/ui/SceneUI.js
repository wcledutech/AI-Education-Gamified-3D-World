// 场景界面基类：负责左页（知识探索）与右页（学习实验与反馈）的公共结构，
// 以及任务步骤的推进。各场景的界面类只需实现自己的任务区。
import { CONCEPTS, SPREADS } from '../learning/LessonData.js';
import { T } from '../utils/i18n.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class SceneUI {
  constructor(app, scene) {
    this.app = app;
    this.scene = scene;
    this.def = scene.def;
    this.concept = null; // 当前展开的概念卡
  }
  get st() {
    return this.app.state.data[this.def.key];
  }
  get stepId() {
    return this.def.steps?.[this.st.step]?.id || 'default';
  }
  /** 已解锁到的最大步骤下标；子类实现 */
  maxStep() {
    return 0;
  }
  save() {
    this.app.state.save();
  }
  log(type, text) {
    this.app.state.log(this.def.key, type, text);
  }
  refresh(side) {
    this.app.ui.render(side);
  }
  /** 进入页面时同步三维场景 */
  enter() {}
  taskHint() {
    return '';
  }
  task() {
    return '';
  }
  focusBtn(side) {
    return `<button class="icon-btn" data-act="focus" data-side="${side}" title="${T('放大 / 还原这一页', 'Zoom this page in / out')}">⤢</button>`;
  }

  // ---------- 左页：知识探索 ----------
  left() {
    const d = this.def;
    const c = this.concept && CONCEPTS[this.concept];
    const steps = d.steps || [];
    return `
      <div class="pg-head"><span class="unit">${esc(d.unit)} · ${esc(d.stage)}</span><span class="pg-tools">${this.focusBtn('left')}</span></div>
      <h1>${esc(d.title)}</h1>
      <h2>${esc(d.question)}</h2>
      <p class="intro">${esc(d.intro)}</p>
      ${d.core ? `<div class="callout"><b>${T('核心问题', 'Key question')}</b>${esc(d.core)}</div>` : ''}
      ${d.goals ? `<section><h3>${T('学习目标', 'Learning goals')}</h3><ul class="goals">${d.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></section>` : ''}
      ${
        d.concepts?.length
          ? `<section><h3>${T('重点概念', 'Key concepts')} <small>${T('点击查看说明', 'click to open')}</small></h3>
        <div class="chips">${d.concepts.map((id) => `<button class="chip ${this.concept === id ? 'on' : ''}" data-act="concept" data-id="${id}">${esc(CONCEPTS[id].name)}</button>`).join('')}</div>
        ${
          c
            ? `<div class="concept-card" key="${this.concept}">
          <button class="icon-btn close" data-act="concept-close" title="${T('收起', 'Close')}">×</button>
          <h4>${esc(c.name)}</h4>
          <p>${esc(c.explain)}</p>
          <div class="cc-row"><b>${T('生活示例', 'Everyday example')}</b><span>${esc(c.example)}</span></div>
          ${c.link ? `<div class="cc-row"><b>${T('在本场景中', 'In this scene')}</b><span>${esc(c.link.text)}${c.link.scene === d.key ? ` <button class="link" data-act="locate" data-target="${c.link.target}">${T('在立体场景中找到它', 'Find it in the 3D scene')}</button>` : ''}</span></div>` : ''}
          <div class="cc-think"><b>${T('想一想', 'Think about it')}</b>${esc(c.think)}</div>
        </div>`
            : ''
        }</section>`
          : ''
      }
      ${
        steps.length
          ? `<section><h3>${T('当前探究任务', 'Current task')}</h3><div class="task-now"><b>${this.st.step + 1}/${steps.length} · ${esc(steps[this.st.step].name)}</b><span>${esc(this.taskHint())}</span></div>
        <div class="flowline">${T('提出问题 → 预测 → 操作 → 反馈 → 解释 → 总结', 'Ask → Predict → Do → Feedback → Explain → Sum up')}</div></section>`
          : this.leftExtra()
      }`;
  }
  leftExtra() {
    return '';
  }

  /** 人物对话卡（台词随当前语言显示） */
  dialogueHtml(showHint = true) {
    const dlg = this.app.dialogue;
    const sp = this.app.speech;
    const ch = dlg && dlg.scene === this.def.key && this.scene.characters[dlg.charId];
    if (!ch) return showHint ? `<div class="dialogue hint"><p>${T('点击立体场景中的人物，可以听听他们怎么说。', 'Click a character in the 3D scene to hear what they say.')}</p></div>` : '';
    const L = this.def.lines[dlg.charId] || {};
    return `<div class="dialogue" style="--who:${ch.color}"><div class="who"><b>${esc(ch.name)}</b><span>${esc(ch.role)}</span></div><p>${esc(L[dlg.step] || L.default)}</p>
        <div class="dlg-tools"><button class="btn sm ghost" data-act="speak">${sp.speaking ? T('♪ 朗读中', '♪ Playing') : T('▶ 朗读', '▶ Listen')}</button><button class="btn sm ghost" data-act="stop">${T('■ 停止', '■ Stop')}</button>${sp.supported ? '' : `<span class="muted">${T('当前浏览器不支持语音', 'Speech is not supported in this browser')}</span>`}</div></div>`;
  }

  // ---------- 右页：学习实验与反馈 ----------
  right() {
    const d = this.def;
    const steps = d.steps || [];
    const max = this.maxStep();
    const logs = this.app.state.data.log.filter((l) => l.scene === d.key).slice(-2).reverse();
    return `
      <div class="pg-head"><span class="unit">${T('学习实验与反馈', 'Experiment & feedback')}</span><span class="pg-tools">${steps.length ? `<span class="prog">${T('任务', 'Task')} ${this.st.step + 1}/${steps.length}</span>` : ''}${this.focusBtn('right')}</span></div>
      ${
        steps.length
          ? `<div class="stepper">${steps
              .map((s, i) => `<button class="st ${i === this.st.step ? 'cur' : ''} ${i < max || (i === max && this.st.done) ? 'done' : ''}" ${i > max ? 'disabled' : ''} data-act="step" data-i="${i}"><i>${i + 1}</i>${esc(s.name)}</button>`)
              .join('')}</div>`
          : ''
      }
      ${this.dialogueHtml()}
      <div class="task">${this.task()}</div>
      <section class="mini-log"><h3>${T('我的探索记录', 'My exploration log')} <button class="link" data-act="records">${T('查看全部', 'View all')}</button></h3>
        ${logs.length ? logs.map((l) => `<div class="log-item">${esc(l.text)}</div>`).join('') : `<div class="log-item muted">${T('完成任务后，记录会出现在这里。', 'Entries will appear here as you complete tasks.')}</div>`}
      </section>`;
  }

  /** 下一步按钮 */
  nextBtn(enabled, text = T('下一步', 'Next'), tip = '') {
    return `<div class="next-row">${!enabled && tip ? `<span class="muted">${esc(tip)}</span>` : ''}<button class="btn primary" data-act="next" ${enabled ? '' : 'disabled'}>${esc(text)} →</button></div>`;
  }
  /** 本页完成后的翻页按钮 */
  finishBlock(doneText) {
    const i = SPREADS.indexOf(this.def);
    const next = SPREADS[i + 1];
    if (!this.st.done) return `<div class="next-row"><button class="btn primary" data-act="finish">${T('完成本页学习 ✓', 'Finish this page ✓')}</button></div>`;
    return `<div class="fb ok"><b>${T('本页学习已完成', 'This page is complete')}</b>${esc(doneText)}</div>${next ? `<div class="next-row"><button class="btn primary" data-act="next-page">${T('翻到下一页：', 'Next page: ')}${esc(next.title)} →</button></div>` : ''}`;
  }

  goStep(i) {
    const n = this.def.steps.length;
    this.st.step = Math.max(0, Math.min(i, n - 1, this.maxStep()));
    this.save();
    this.enter();
    this.app.ui.render();
    this.app.ui.scrollTop('right');
  }

  // ---------- 事件 ----------
  onAction(act, d, el, ev) {
    const app = this.app;
    switch (act) {
      case 'concept':
        this.concept = this.concept === d.id ? null : d.id;
        return this.refresh('left');
      case 'concept-close':
        this.concept = null;
        return this.refresh('left');
      case 'locate':
        this.scene.highlight?.(d.target);
        if (app.cam.mode !== 'open') app.cam.goto('open', 0.8);
        return;
      case 'step':
        return this.goStep(+d.i);
      case 'next':
        return this.goStep(this.st.step + 1);
      case 'finish':
        this.st.done = true;
        this.log('done', T(`完成《${this.def.title}》的全部学习任务。`, `Completed all tasks in “${this.def.title}”.`));
        this.save();
        app.ui.render();
        app.ui.updateBar();
        app.toast(T('本页学习完成，下一页已解锁', 'Page complete. The next page is unlocked.'));
        return;
      case 'next-page':
        return app.turn(SPREADS.indexOf(this.def) + 1);
      case 'speak':
        return app.speech.repeat();
      case 'stop':
        return app.speech.stop();
      case 'focus':
        return app.toggleFocus(d.side);
      case 'records':
        return app.ui.openModal('records');
      default:
        return this.handle(act, d, el, ev);
    }
  }
  handle() {}

  /** 打开某个概念卡（由点击三维设备触发） */
  showConcept(id) {
    if (!CONCEPTS[id]) return;
    this.concept = id;
    this.refresh('left');
    this.app.ui.scrollToConcept();
  }

  /** 人物台词：随当前任务状态变化 */
  lineFor(charId) {
    const L = this.def.lines[charId] || {};
    return L[this.stepId] || L.default;
  }
  /** 这句台词实际使用的步骤键（没有专属台词时为 default） */
  lineStep(charId) {
    const L = this.def.lines[charId] || {};
    return L[this.stepId] ? this.stepId : 'default';
  }
  /** 这句台词对应的预录音频键：场景.人物.步骤 */
  lineKey(charId) {
    return [this.def.key, charId, this.lineStep(charId)].join('.');
  }
}
