// 界面外壳：加载页、左右内页容器、底部控制栏、目录 / 探索记录 / 学习帮助弹层、提示与字幕。
import { SPREADS, COURSE } from '../learning/LessonData.js';
import { buildReport } from '../learning/Assessment.js';
import { esc } from './SceneUI.js';
import { exportRecord } from './SummaryUI.js';
import { T } from '../utils/i18n.js';

/** 控制栏按钮：[id, 图标, 文字]。语言按钮显示的是“可以切换到的语言”。 */
const barItems = () => [
  ['toc', '☰', T('目录', 'Contents')],
  ['prev', '‹', T('上一页', 'Prev')],
  ['page', '', ''],
  ['next', '›', T('下一页', 'Next')],
  ['sep'],
  ['reset', '⌂', T('重置视角', 'Reset view')],
  ['rotate', '⟳', T('旋转视角', 'Rotate')],
  ['center', '◎', T('专注实验', 'Focus')],
  ['sep'],
  ['voice', '♪', T('语音', 'Voice')],
  ['records', '✎', T('探索记录', 'Log')],
  ['help', '?', T('学习帮助', 'Help')],
  ['sep'],
  ['lang', T('A', '文'), T('English', '中文')],
];
const barHtml = () =>
  barItems()
    .map(([id, icon, label]) => (id === 'sep' ? '<i class="sep"></i>' : id === 'page' ? '<span id="bar-page">1 / 4</span>' : `<button data-bar="${id}" title="${label}"><em>${icon}</em><span>${label}</span></button>`))
    .join('');
const hintHtml = () => `<b>${T('点击封面，打开这本书', 'Click the cover to open the book')}</b><span>${T('拖动可以从不同角度观察 · 滚轮缩放', 'Drag to look around · scroll to zoom')}</span>`;

export class UI {
  constructor(app, root) {
    this.app = app;
    this.current = null;
    root.insertAdjacentHTML(
      'beforeend',
      `<div id="loader"><div class="ld-card"><div class="ld-title">HELLO, AI!</div><div class="ld-sub">${esc(COURSE.subtitle)}</div><div class="pbar"><i id="ld-bar"></i></div><div id="ld-text">${T('正在准备…', 'Getting ready…')}</div></div></div>
       <div id="start-hint" class="hidden">${hintHtml()}</div>
       <button id="lang-chip" class="hidden" data-lang-switch></button>
       <div id="caption" class="hidden"></div>
       <nav id="bar" class="hidden">${barHtml()}</nav>
       <div id="tooltip"></div><div id="toast"></div>
       <div id="modal" class="hidden"><div class="modal-card"><button class="icon-btn close" data-modal-close>×</button><div id="modal-body"></div></div></div>`
    );
    const $ = (s) => root.querySelector(s);
    this.loader = $('#loader');
    this.hint = $('#start-hint');
    this.langChip = $('#lang-chip');
    this.bar = $('#bar');
    this.tooltip = $('#tooltip');
    this.toastEl = $('#toast');
    this.captionEl = $('#caption');
    this.modal = $('#modal');
    this.modalBody = $('#modal-body');
    this.langChip.textContent = T('English', '中文');
    this.langChip.addEventListener('click', () => app.switchLang());

    // 左右内页（由 CSS3DRenderer 挂到三维空间里）
    const mkPage = (side) => {
      const el = document.createElement('div');
      el.className = `page page-${side}`;
      el.innerHTML = '<div class="pg"></div>';
      this.bindPage(el);
      return el;
    };
    this.leftEl = mkPage('left');
    this.rightEl = mkPage('right');

    this.bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-bar]');
      if (b && !b.disabled) this.onBar(b.dataset.bar);
    });
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.closest('[data-modal-close]')) return this.closeModal();
      const a = e.target.closest('[data-m]');
      if (a) this.onModal(a.dataset.m, a.dataset);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
      if (e.target.matches?.('textarea,input')) return;
      if (e.key === 'ArrowRight') this.onBar('next');
      if (e.key === 'ArrowLeft') this.onBar('prev');
    });
  }

  bindPage(el) {
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (!t || t.disabled || !this.current) return;
      this.current.onAction(t.dataset.act, t.dataset, t, e);
    });
    el.addEventListener('input', (e) => {
      const n = e.target.dataset?.input;
      if (n) this.current?.onInput?.(n, e.target.value);
    });
    el.addEventListener('dragstart', (e) => {
      const t = e.target.closest('[data-drag]');
      if (!t) return;
      e.dataTransfer.setData('text/plain', t.dataset.drag);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      const t = e.target.closest('[data-drop]');
      if (t) {
        e.preventDefault();
        t.classList.add('drop-on');
      }
    });
    el.addEventListener('dragleave', (e) => e.target.closest?.('[data-drop]')?.classList.remove('drop-on'));
    el.addEventListener('drop', (e) => {
      const t = e.target.closest('[data-drop]');
      if (!t) return;
      e.preventDefault();
      t.classList.remove('drop-on');
      const id = e.dataTransfer.getData('text/plain');
      if (id) this.current?.onDrop?.(id, t);
    });
    // 页面内的滚轮：滚动这一页的内容（立体变换后的元素不一定能触发浏览器自带的滚动，这里手动处理）
    el.addEventListener(
      'wheel',
      (e) => {
        e.stopPropagation();
        const ta = e.target.closest?.('textarea');
        if (ta && ta.scrollHeight > ta.clientHeight) return; // 文本框自己滚动
        const pg = el.firstElementChild;
        const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? pg.clientHeight : 1;
        pg.scrollTop += e.deltaY * unit;
        e.preventDefault();
      },
      { passive: false }
    );
  }

  // ---------- 加载 ----------
  progress(p, text) {
    this.loader.querySelector('#ld-bar').style.width = `${Math.round(p * 100)}%`;
    this.loader.querySelector('#ld-text').textContent = text;
  }
  loadError(msg) {
    this.loader.classList.add('error');
    this.loader.querySelector('#ld-text').innerHTML = `<b>${T('加载失败', 'Loading failed')}</b><br>${esc(msg)}<br><small>${T(
      '请使用新版 Chrome 或 Edge 浏览器，并确认已开启硬件加速（WebGL）。',
      'Please use a recent version of Chrome or Edge and make sure hardware acceleration (WebGL) is enabled.'
    )}</small>`;
  }
  ready() {
    this.loader.classList.add('hidden');
    this.hint.classList.remove('hidden');
    this.langChip.classList.remove('hidden');
  }

  /** 语言切换后，更新不随页面重绘的固定文字 */
  applyLang() {
    document.title = COURSE.title;
    this.hint.innerHTML = hintHtml();
    this.langChip.textContent = T('English', '中文');
    this.bar.innerHTML = barHtml();
    this.captionEl.classList.add('hidden');
    this.tooltip.classList.remove('show');
    if (!this.modal.classList.contains('hidden') && this.modalKind) this.modalBody.innerHTML = this[`m_${this.modalKind}`]();
    this.render();
    if (this.app.book?.state === 'open') this.updateBar();
  }

  // ---------- 页面内容 ----------
  showSpread(i) {
    this.current = this.app.scenes[i].ui;
    this.current.enter();
    this.render();
    this.scrollTop('left');
    this.scrollTop('right');
    this.updateBar();
  }
  render(side) {
    if (!this.current) return;
    const put = (el, html) => {
      const pg = el.firstElementChild;
      const y = pg.scrollTop;
      pg.innerHTML = html;
      pg.scrollTop = y;
    };
    if (!side || side === 'left') put(this.leftEl, this.current.left());
    if (!side || side === 'right') put(this.rightEl, this.current.right());
  }
  scrollTop(side) {
    (side === 'left' ? this.leftEl : this.rightEl).firstElementChild.scrollTop = 0;
  }
  scrollToConcept() {
    const pg = this.leftEl.firstElementChild;
    const card = pg.querySelector('.concept-card');
    if (card) pg.scrollTop = Math.max(0, card.offsetTop - 60);
  }
  closeOverlays() {
    this.closeModal();
    this.captionEl.classList.add('hidden');
    if (this.current) this.current.concept = null;
  }

  // ---------- 控制栏 ----------
  updateBar() {
    const app = this.app;
    const i = app.book.index;
    const n = SPREADS.length;
    this.bar.querySelector('#bar-page').textContent = `${i + 1} / ${n}`;
    const set = (id, { disabled, on, title } = {}) => {
      const b = this.bar.querySelector(`[data-bar="${id}"]`);
      if (disabled !== undefined) b.disabled = disabled;
      if (on !== undefined) b.classList.toggle('on', on);
      if (title) b.title = title;
    };
    const busy = app.book.busy;
    set('prev', { disabled: busy || i === 0 });
    const locked = i + 1 < n && !app.state.unlocked(i + 1);
    set('next', { disabled: busy || i >= n - 1 || locked, title: locked ? T('完成本页学习任务后解锁下一页', 'Finish the tasks on this page to unlock the next one') : T('下一页', 'Next page') });
    set('rotate', { on: app.cam.autoRotate });
    set('center', { on: app.cam.mode === 'center' });
    set('voice', { on: app.state.data.voice, title: app.state.data.voice ? T('语音：开（点击关闭）', 'Voice: on (click to turn off)') : T('语音：关（点击开启）', 'Voice: off (click to turn on)') });
    set('toc', { disabled: busy });
    set('lang', { title: T('Switch to English', '切换为中文') });
  }
  onBar(id) {
    const app = this.app;
    if (app.book.state !== 'open') return;
    switch (id) {
      case 'toc':
        return this.openModal('toc');
      case 'prev':
        return app.turn(app.book.index - 1);
      case 'next':
        return app.turn(app.book.index + 1);
      case 'reset':
        app.cam.autoRotate = false;
        app.cam.goto('open', 0.9).then(() => this.updateBar());
        return this.updateBar();
      case 'rotate':
        app.cam.autoRotate = !app.cam.autoRotate;
        app.cam.autoT = 0;
        if (!app.cam.autoRotate) app.cam.goto(app.cam.mode, 0.8);
        return this.updateBar();
      case 'center':
        return app.toggleFocus('center');
      case 'voice': {
        const d = app.state.data;
        d.voice = !d.voice;
        app.speech.setEnabled(d.voice);
        app.state.save();
        app.toast(d.voice ? T('语音朗读已开启', 'Voice on') : T('语音朗读已关闭', 'Voice off'));
        return this.updateBar();
      }
      case 'records':
        return this.openModal('records');
      case 'help':
        return this.openModal('help');
      case 'lang':
        return app.switchLang();
      default:
    }
  }

  // ---------- 弹层 ----------
  openModal(kind) {
    this.modalKind = kind;
    this.modalBody.innerHTML = this[`m_${kind}`]();
    this.modal.classList.remove('hidden');
  }
  closeModal() {
    this.modal.classList.add('hidden');
  }
  m_toc() {
    const app = this.app;
    return `<h2>${T('目录', 'Contents')}</h2><p class="muted">${esc(COURSE.grade)} · ${esc(COURSE.duration)}</p>
      <div class="toc">${SPREADS.map((s, i) => {
        const done = i < 3 ? app.state.data[s.key].done : false;
        const open = app.state.unlocked(i);
        const status = i === app.book.index ? T('当前页', 'Current page') : done ? T('已完成', 'Completed') : open ? T('可进入', 'Open') : T('未解锁', 'Locked');
        return `<button class="toc-item ${i === app.book.index ? 'cur' : ''}" data-m="goto" data-i="${i}" ${open ? '' : 'disabled'}><i>${i + 1}</i><div><b>${esc(s.title)}</b><span>${esc(s.question)}</span></div><em>${status}</em></button>`;
      }).join('')}</div>
      <p class="muted">${T(
        '学习路径：认识 AI → 理解 AI → 判断 AI。完成当前页的学习任务后，下一页自动解锁。',
        'Learning path: Meet AI → Understand AI → Evaluate AI. The next page unlocks automatically when you finish the tasks on the current page.'
      )}</p>`;
  }
  m_records() {
    const data = this.app.state.data;
    const r = buildReport(data);
    const name = { city: T('智慧城市', 'Smart City'), lab: T('训练实验室', 'Training Lab'), verify: T('判断中心', 'Fact-Check Center'), summary: T('总结', 'Summary') };
    const time = (t) => new Date(t).toLocaleTimeString(T('zh-CN', 'en-US'), { hour: '2-digit', minute: '2-digit' });
    return `<h2>${T('我的探索记录', 'My exploration log')}</h2>
      <div class="rec-top">${r.scenes.map((s) => `<div class="rep-row ${s.done ? 'ok' : ''}"><b>${s.done ? '✓' : '○'} ${esc(s.title)}</b><span>${esc(s.detail)}</span></div>`).join('')}</div>
      <div class="rec-list">${
        data.log.length
          ? data.log
              .slice()
              .reverse()
              .map((l) => `<div class="log-item"><em>${name[l.scene] || ''} · ${time(l.t)}</em>${esc(l.text)}</div>`)
              .join('')
          : `<div class="muted">${T('还没有记录。完成预测、实验和判断后，这里会自动记下你的每一步。', 'Nothing recorded yet. As you predict, experiment and judge, each step will be noted here automatically.')}</div>`
      }</div>
      <div class="next-row left"><button class="btn" data-m="export-txt">${T('导出文本', 'Export text')}</button><button class="btn" data-m="export-json">${T('导出 JSON', 'Export JSON')}</button></div>`;
  }
  m_help() {
    const d = this.app.state.data;
    const items = [
      [T('观察', 'Look around'), T('按住鼠标拖动可以旋转视角，滚轮缩放；“重置视角”回到默认位置，“专注实验”放大中央的立体场景。', 'Drag with the mouse to rotate the view and use the wheel to zoom. “Reset view” returns to the default position; “Focus” zooms in on the 3D scene in the middle.')],
      [T('阅读', 'Read'), T('左页是知识探索，右页是学习实验与反馈。页面右上角的 ⤢ 可以把这一页放大到眼前，再点一次还原。', 'The left page is for knowledge; the right page is for experiments and feedback. The ⤢ button at the top right of a page brings it up close; click it again to go back.')],
      [T('互动', 'Interact'), T('点击立体场景里的人物和设备；点击左页的重点概念查看说明。', 'Click the characters and devices in the 3D scene; click a key concept on the left page to read about it.')],
      [T('翻页', 'Turn pages'), T('完成当前页的任务后，下一页自动解锁。也可以用键盘 ← → 翻页。', 'The next page unlocks when you finish the tasks on the current page. You can also use the ← → keys.')],
      [T('语音', 'Voice'), T('点击人物会朗读台词，可在控制栏关闭。', 'Clicking a character plays their line. You can turn voice off in the control bar.')],
      [T('语言', 'Language'), T('控制栏里的“English”按钮可以随时把整本书切换成英文，再点一次切回中文。', 'The “中文” button in the control bar switches the whole book to Chinese at any time; click it again to return to English.')],
      [T('保存', 'Saving'), T('学习进度保存在这台设备的浏览器里；训练出的模型只保存在内存中，刷新页面后需要重新训练。', 'Progress is saved in this device’s browser. The trained model is only kept in memory, so it has to be trained again after the page is reloaded.')],
    ];
    return `<h2>${T('学习帮助', 'Help')}</h2>
      <ul class="help">${items.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('')}</ul>
      <div class="help-box"><label><input type="checkbox" data-m="teacher" ${d.teacher ? 'checked' : ''}> ${T('教师模式：解锁全部页面（便于课堂演示）', 'Teacher mode: unlock all pages (handy for classroom demos)')}</label>
      <button class="btn sm ghost" data-m="reset">${T('清除学习进度，重新开始', 'Clear progress and start over')}</button></div>`;
  }
  onModal(act, d) {
    const app = this.app;
    const data = app.state.data;
    switch (act) {
      case 'goto':
        this.closeModal();
        return app.turn(+d.i);
      case 'teacher':
        data.teacher = !data.teacher;
        app.state.save();
        this.updateBar();
        this.render();
        return app.toast(data.teacher ? T('教师模式已开启：全部页面已解锁', 'Teacher mode on: all pages are unlocked') : T('教师模式已关闭', 'Teacher mode off'));
      case 'reset':
        if (!window.confirm(T('确定要清除这台设备上的全部学习进度吗？此操作不能撤销。', 'Clear all learning progress on this device? This cannot be undone.'))) return;
        app.state.reset();
        return window.location.reload();
      case 'export-txt':
        return exportRecord('txt', data);
      case 'export-json':
        return exportRecord('json', data);
      default:
    }
  }

  // ---------- 提示与字幕 ----------
  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => this.toastEl.classList.remove('show'), 2600);
  }
  caption(text) {
    this.captionEl.textContent = text;
    this.captionEl.classList.remove('hidden');
    clearTimeout(this._ct);
    this._ct = setTimeout(() => this.captionEl.classList.add('hidden'), Math.min(12000, 2500 + text.length * (/[一-鿿]/.test(text) ? 180 : 70)));
  }
}
