// 课程总结界面：“我的 AI 探索报告”——完成情况、学习表现、实验结果、反思与导出。
import { SceneUI, esc } from './SceneUI.js';
import { buildReport, reportToText } from '../learning/Assessment.js';
import { SCENE, COURSE } from '../learning/LessonData.js';
import { T } from '../utils/i18n.js';

export function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
/** 导出学习记录（两种格式） */
export function exportRecord(kind, data) {
  const base = T('hello-ai-学习记录', 'hello-ai-learning-record');
  if (kind === 'json') download(`${base}.json`, JSON.stringify({ course: COURSE.title, exportedAt: new Date().toISOString(), report: buildReport(data), progress: data }, null, 2), 'application/json');
  else download(`${base}.txt`, reportToText(data), 'text/plain;charset=utf-8');
}

export class SummaryUI extends SceneUI {
  get st() {
    return this.app.state.data.summary;
  }
  enter() {
    this.scene.refresh();
  }

  left() {
    const d = this.def;
    const r = buildReport(this.app.state.data);
    return `
      <div class="pg-head"><span class="unit">${esc(d.unit)} · ${T('课程总结', 'Course summary')}</span><span class="pg-tools">${this.focusBtn('left')}</span></div>
      <h1>${esc(d.title)}</h1>
      <h2>${esc(d.question)}</h2>
      <p class="intro">${esc(d.intro)}</p>
      <section><h3>${T('三个场景的完成情况', 'Progress in the three scenes')}</h3>
        ${r.scenes.map((s) => `<div class="rep-row ${s.done ? 'ok' : ''}"><b>${s.done ? '✓' : '○'} ${esc(s.title)}</b><span>${esc(s.detail)}</span></div>`).join('')}
      </section>
      <section><h3>${T('学习表现', 'What you can do')}</h3>
        ${r.abilities.map((a) => `<div class="abil ${a.level}"><div><b>${esc(a.name)}</b><em>${a.levelText}</em></div><span>${esc(a.evidence)}</span></div>`).join('')}
      </section>
      <section><h3>${T('核心概念', 'Core concepts')}</h3>
        <div class="chips">${r.concepts.map((c) => `<span class="chip static ${c.ok ? 'ok' : ''}">${c.ok ? '✓ ' : ''}${esc(c.name)}</span>`).join('')}</div>
        <div class="muted">${T('打勾表示你已完成与该概念相关的探究任务。', 'A tick means you have completed the tasks related to that concept.')}</div>
      </section>`;
  }

  right() {
    const data = this.app.state.data;
    const r = buildReport(data);
    const C = SCENE.lab.conditions;
    return `
      <div class="pg-head"><span class="unit">${T('实验结果与反思', 'Results & reflection')}</span><span class="pg-tools">${this.focusBtn('right')}</span></div>
      ${this.dialogueHtml(false)}
      <section><h3>${T('模型训练和测试结果', 'Model training and test results')}</h3>
        ${
          Object.keys(r.runs).length
            ? `<table class="tbl sm"><tr><th>${T('条件', 'Run')}</th><th>${T('训练样本<br>猫 / 狗', 'Samples<br>cat / dog')}</th><th>${T('错误<br>标签', 'Wrong<br>labels')}</th><th>${T('测试<br>正确率', 'Test<br>score')}</th></tr>${['A', 'B', 'C']
                .filter((k) => r.runs[k])
                .map((k) => `<tr><td>${C[k].name}<br><small>${esc(C[k].title)}</small></td><td>${r.runs[k].cat} / ${r.runs[k].dog}</td><td>${r.runs[k].wrong}</td><td><b>${r.runs[k].test.correct}/${r.runs[k].test.n}</b></td></tr>`)
                .join('')}</table>${data.lab.explainText ? `<div class="fb info"><b>${T('我的解释', 'My explanation')}</b>${esc(data.lab.explainText)}</div>` : ''}`
            : `<div class="muted">${T('还没有完成带测试的模型训练。', 'No model has been trained and tested yet.')}</div>`
        }
      </section>
      <section><h3>${T('信息核验任务', 'Fact-checking tasks')}</h3>
        <div class="stats"><div><b>${r.claims.done}</b>/${r.claims.total}<small>${T('已核验主张', 'Claims checked')}</small></div><div><b>${r.claims.right}</b><small>${T('首次判断一致', 'Right first time')}</small></div><div><b>${r.usage.done}</b>/${r.usage.total}<small>${T('使用情境', 'Situations')}</small></div></div>
      </section>
      <section><h3>${T('我的反思', 'My reflection')}</h3>
        <label class="fld"><span>${esc(this.def.reflection)}</span><textarea data-input="reflection" rows="5" placeholder="${T('写下你的想法……', 'Write your thoughts here…')}">${esc(this.st.reflection)}</textarea></label>
        <div class="next-row"><span class="muted" id="ref-state">${this.st.savedAt ? T('已保存在本机', 'Saved on this device') : ''}</span><button class="btn primary" data-act="save-ref">${T('保存反思', 'Save reflection')}</button></div>
      </section>
      <section><h3>${T('导出学习记录', 'Export learning record')}</h3>
        <div class="next-row left"><button class="btn" data-act="export-json">${T('导出 JSON', 'Export JSON')}</button><button class="btn" data-act="export-txt">${T('导出文本', 'Export text')}</button></div>
        <div class="muted">${
          this.app.state.storageOk
            ? T('学习进度自动保存在这台设备的浏览器中。', 'Your progress is saved automatically in this device’s browser.')
            : T('提示：当前浏览器无法使用本地存储，关闭页面后进度不会保留，请及时导出。', 'Note: this browser cannot use local storage, so progress will be lost when the page is closed. Please export in time.')
        }</div>
      </section>`;
  }

  onInput(name, value) {
    if (name === 'reflection') {
      this.st.reflection = value;
      this.st.savedAt = Date.now();
      this.save();
    }
  }

  handle(act) {
    const data = this.app.state.data;
    switch (act) {
      case 'save-ref':
        this.st.savedAt = Date.now();
        if (this.st.reflection.trim()) this.app.state.log('summary', 'reflect', T('写下了课程最终反思。', 'Wrote the final course reflection.'));
        this.save();
        this.app.toast(this.st.reflection.trim() ? T('反思已保存', 'Reflection saved') : T('还没有填写内容', 'Nothing has been written yet'));
        return this.app.ui.render();
      case 'export-json':
        exportRecord('json', data);
        return this.app.toast(T('已导出 JSON 文件', 'JSON file exported'));
      case 'export-txt':
        exportRecord('txt', data);
        return this.app.toast(T('已导出文本文件', 'Text file exported'));
      default:
    }
  }
}
