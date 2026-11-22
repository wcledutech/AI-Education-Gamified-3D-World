// 界面外壳：加载页、左右内页容器、底部控制栏、目录 / 探索记录 / 学习帮助弹层、提示与字幕。
import { SPREADS, COURSE } from '../learning/LessonData.js';
import { buildReport, reportToText } from '../learning/Assessment.js';
import { esc } from './SceneUI.js';

const BAR = [
  ['toc', '☰', '目录'],
  ['prev', '‹', '上一页'],
  ['page', '', ''],
  ['next', '›', '下一页'],
  ['sep'],
  ['reset', '⌂', '重置视角'],
  ['rotate', '⟳', '旋转视角'],
  ['center', '◎', '专注实验'],
  ['sep'],
  ['voice', '♪', '语音'],
  ['records', '✎', '探索记录'],
  ['help', '?', '学习帮助'],
];

export class UI {
  constructor(app, root) {
    this.app = app;
    this.current = null;
    root.insertAdjacentHTML(
      'beforeend',
      `<div id="loader"><div class="ld-card"><div class="ld-title">HELLO, AI!</div><div class="ld-sub">${esc(COURSE.subtitle)}</div><div class="pbar"><i id="ld-bar"></i></div><div id="ld-text">正在准备…</div></div></div>
       <div id="start-hint" class="hidden"><b>点击封面，打开这本书</b><span>拖动可以从不同角度观察 · 滚轮缩放</span></div>
       <div id="caption" class="hidden"></div>
       <nav id="bar" class="hidden">${BAR.map(([id, icon, label]) => (id === 'sep' ? '<i class="sep"></i>' : id === 'page' ? '<span id="bar-page">1 / 4</span>' : `<button data-bar="${id}" title="${label}"><em>${icon}</em><span>${label}</span></button>`)).join('')}</nav>
       <div id="tooltip"></div><div id="toast"></div>
       <div id="modal" class="hidden"><div class="modal-card"><button class="icon-btn close" data-modal-close>×</button><div id="modal-body"></div></div></div>`
    );
    const $ = (s) => root.querySelector(s);
    this.loader = $('#loader');
    this.hint = $('#start-hint');
    this.bar = $('#bar');
    this.tooltip = $('#tooltip');
    this.toastEl = $('#toast');
    this.captionEl = $('#caption');
    this.modal = $('#modal');
    this.modalBody = $('#modal-body');

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
    this.loader.querySelector('#ld-text').innerHTML = `<b>加载失败</b><br>${esc(msg)}<br><small>请使用新版 Chrome 或 Edge 浏览器，并确认已开启硬件加速（WebGL）。</small>`;
  }
  ready() {
    this.loader.classList.add('hidden');
    this.hint.classList.remove('hidden');
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
    set('next', { disabled: busy || i >= n - 1 || locked, title: locked ? '完成本页学习任务后解锁下一页' : '下一页' });
    set('rotate', { on: app.cam.autoRotate });
    set('center', { on: app.cam.mode === 'center' });
    set('voice', { on: app.state.data.voice, title: app.state.data.voice ? '语音：开（点击关闭）' : '语音：关（点击开启）' });
    set('toc', { disabled: busy });
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
        app.toast(d.voice ? '语音朗读已开启' : '语音朗读已关闭');
        return this.updateBar();
      }
      case 'records':
        return this.openModal('records');
      case 'help':
        return this.openModal('help');
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
    return `<h2>目录</h2><p class="muted">${esc(COURSE.grade)} · ${esc(COURSE.duration)}</p>
      <div class="toc">${SPREADS.map((s, i) => {
        const done = i < 3 ? app.state.data[s.key].done : false;
        const open = app.state.unlocked(i);
        return `<button class="toc-item ${i === app.book.index ? 'cur' : ''}" data-m="goto" data-i="${i}" ${open ? '' : 'disabled'}><i>${i + 1}</i><div><b>${esc(s.title)}</b><span>${esc(s.question)}</span></div><em>${i === app.book.index ? '当前页' : done ? '已完成' : open ? '可进入' : '未解锁'}</em></button>`;
      }).join('')}</div>
      <p class="muted">学习路径：认识 AI → 理解 AI → 判断 AI。完成当前页的学习任务后，下一页自动解锁。</p>`;
  }
  m_records() {
    const data = this.app.state.data;
    const r = buildReport(data);
    const name = { city: '智慧城市', lab: '训练实验室', verify: '判断中心', summary: '总结' };
    return `<h2>我的探索记录</h2>
      <div class="rec-top">${r.scenes.map((s) => `<div class="rep-row ${s.done ? 'ok' : ''}"><b>${s.done ? '✓' : '○'} ${esc(s.title)}</b><span>${esc(s.detail)}</span></div>`).join('')}</div>
      <div class="rec-list">${
        data.log.length
          ? data.log
              .slice()
              .reverse()
              .map((l) => `<div class="log-item"><em>${name[l.scene] || ''} · ${new Date(l.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</em>${esc(l.text)}</div>`)
              .join('')
          : '<div class="muted">还没有记录。完成预测、实验和判断后，这里会自动记下你的每一步。</div>'
      }</div>
      <div class="next-row left"><button class="btn" data-m="export-txt">导出文本</button><button class="btn" data-m="export-json">导出 JSON</button></div>`;
  }
  m_help() {
    const d = this.app.state.data;
    return `<h2>学习帮助</h2>
      <ul class="help">
        <li><b>观察</b>按住鼠标拖动可以旋转视角，滚轮缩放；“重置视角”回到默认位置，“专注实验”放大中央的立体场景。</li>
        <li><b>阅读</b>左页是知识探索，右页是学习实验与反馈。页面右上角的 ⤢ 可以把这一页放大到眼前，再点一次还原。</li>
        <li><b>互动</b>点击立体场景里的人物和设备；点击左页的重点概念查看说明。</li>
        <li><b>翻页</b>完成当前页的任务后，下一页自动解锁。也可以用键盘 ← → 翻页。</li>
        <li><b>语音</b>点击人物会朗读台词（需要浏览器支持中文语音），可在控制栏关闭。</li>
        <li><b>保存</b>学习进度保存在这台设备的浏览器里；训练出的模型只保存在内存中，刷新页面后需要重新训练。</li>
      </ul>
      <div class="help-box"><label><input type="checkbox" data-m="teacher" ${d.teacher ? 'checked' : ''}> 教师模式：解锁全部页面（便于课堂演示）</label>
      <button class="btn sm ghost" data-m="reset">清除学习进度，重新开始</button></div>`;
  }
  onModal(act, d) {
    const app = this.app;
    const data = app.state.data;
    const dl = (name, text, type) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    switch (act) {
      case 'goto':
        this.closeModal();
        return app.turn(+d.i);
      case 'teacher':
        data.teacher = !data.teacher;
        app.state.save();
        this.updateBar();
        this.render();
        return app.toast(data.teacher ? '教师模式已开启：全部页面已解锁' : '教师模式已关闭');
      case 'reset':
        if (!window.confirm('确定要清除这台设备上的全部学习进度吗？此操作不能撤销。')) return;
        app.state.reset();
        return window.location.reload();
      case 'export-txt':
        return dl('hello-ai-学习记录.txt', reportToText(data), 'text/plain;charset=utf-8');
      case 'export-json':
        return dl('hello-ai-学习记录.json', JSON.stringify({ course: COURSE.title, exportedAt: new Date().toISOString(), report: buildReport(data), progress: data }, null, 2), 'application/json');
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
    this._ct = setTimeout(() => this.captionEl.classList.add('hidden'), Math.min(12000, 2500 + text.length * 180));
  }
}
