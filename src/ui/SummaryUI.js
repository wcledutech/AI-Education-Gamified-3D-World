// 课程总结界面：“我的 AI 探索报告”——完成情况、学习表现、实验结果、反思与导出。
import { SceneUI, esc } from './SceneUI.js';
import { buildReport, reportToText } from '../learning/Assessment.js';
import { SCENE } from '../learning/LessonData.js';

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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
      <div class="pg-head"><span class="unit">${esc(d.unit)} · 课程总结</span><span class="pg-tools"><button class="icon-btn" data-act="focus" data-side="left" title="放大 / 还原这一页">⤢</button></span></div>
      <h1>${esc(d.title)}</h1>
      <h2>${esc(d.question)}</h2>
      <p class="intro">${esc(d.intro)}</p>
      <section><h3>三个场景的完成情况</h3>
        ${r.scenes.map((s) => `<div class="rep-row ${s.done ? 'ok' : ''}"><b>${s.done ? '✓' : '○'} ${esc(s.title)}</b><span>${esc(s.detail)}</span></div>`).join('')}
      </section>
      <section><h3>学习表现</h3>
        ${r.abilities.map((a) => `<div class="abil ${a.level}"><div><b>${esc(a.name)}</b><em>${a.levelText}</em></div><span>${esc(a.evidence)}</span></div>`).join('')}
      </section>
      <section><h3>核心概念</h3>
        <div class="chips">${r.concepts.map((c) => `<span class="chip static ${c.ok ? 'ok' : ''}">${c.ok ? '✓ ' : ''}${esc(c.name)}</span>`).join('')}</div>
        <div class="muted">打勾表示你已完成与该概念相关的探究任务。</div>
      </section>`;
  }

  right() {
    const data = this.app.state.data;
    const r = buildReport(data);
    const C = SCENE.lab.conditions;
    const dlg = this.app.dialogue;
    return `
      <div class="pg-head"><span class="unit">实验结果与反思</span><span class="pg-tools"><button class="icon-btn" data-act="focus" data-side="right" title="放大 / 还原这一页">⤢</button></span></div>
      ${dlg && dlg.scene === 'summary' ? `<div class="dialogue" style="--who:${dlg.color}"><div class="who"><b>${esc(dlg.name)}</b><span>${esc(dlg.role)}</span></div><p>${esc(dlg.text)}</p><div class="dlg-tools"><button class="btn sm ghost" data-act="speak">▶ 朗读</button><button class="btn sm ghost" data-act="stop">■ 停止</button></div></div>` : ''}
      <section><h3>模型训练和测试结果</h3>
        ${
          Object.keys(r.runs).length
            ? `<table class="tbl sm"><tr><th>条件</th><th>训练样本<br>猫 / 狗</th><th>错误<br>标签</th><th>测试<br>正确率</th></tr>${['A', 'B', 'C']
                .filter((k) => r.runs[k])
                .map((k) => `<tr><td>${C[k].name}<br><small>${esc(C[k].title)}</small></td><td>${r.runs[k].cat} / ${r.runs[k].dog}</td><td>${r.runs[k].wrong}</td><td><b>${r.runs[k].test.correct}/${r.runs[k].test.n}</b></td></tr>`)
                .join('')}</table>${data.lab.explainText ? `<div class="fb info"><b>我的解释</b>${esc(data.lab.explainText)}</div>` : ''}`
            : '<div class="muted">还没有完成带测试的模型训练。</div>'
        }
      </section>
      <section><h3>信息核验任务</h3>
        <div class="stats"><div><b>${r.claims.done}</b>/${r.claims.total}<small>已核验主张</small></div><div><b>${r.claims.right}</b><small>首次判断一致</small></div><div><b>${r.usage.done}</b>/${r.usage.total}<small>使用情境</small></div></div>
      </section>
      <section><h3>我的反思</h3>
        <label class="fld"><span>${esc(this.def.reflection)}</span><textarea data-input="reflection" rows="5" placeholder="写下你的想法……">${esc(this.st.reflection)}</textarea></label>
        <div class="next-row"><span class="muted" id="ref-state">${this.st.savedAt ? '已保存在本机' : ''}</span><button class="btn primary" data-act="save-ref">保存反思</button></div>
      </section>
      <section><h3>导出学习记录</h3>
        <div class="next-row left"><button class="btn" data-act="export-json">导出 JSON</button><button class="btn" data-act="export-txt">导出文本</button></div>
        <div class="muted">${this.app.state.storageOk ? '学习进度自动保存在这台设备的浏览器中。' : '提示：当前浏览器无法使用本地存储，关闭页面后进度不会保留，请及时导出。'}</div>
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
        if (this.st.reflection.trim()) this.app.state.log('summary', 'reflect', '写下了课程最终反思。');
        this.save();
        this.app.toast(this.st.reflection.trim() ? '反思已保存' : '还没有填写内容');
        return this.app.ui.render();
      case 'export-json':
        download('hello-ai-学习记录.json', JSON.stringify({ course: 'Hello, AI！走进人工智能的世界', exportedAt: new Date().toISOString(), report: buildReport(data), progress: data }, null, 2), 'application/json');
        return this.app.toast('已导出 JSON 文件');
      case 'export-txt':
        download('hello-ai-学习记录.txt', reportToText(data), 'text/plain;charset=utf-8');
        return this.app.toast('已导出文本文件');
      default:
    }
  }
}
