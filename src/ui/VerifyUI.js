// 场景三界面：观察 AI 回答 → 寻找证据 → 修改回答 → 合理使用 → 小结
import { SceneUI, esc } from './SceneUI.js';

const REL = {
  support: ['支持主张', true],
  refute: ['反驳主张', true],
  partial: ['只能部分说明', true],
  limit: ['说明了研究的局限', true],
  weak: ['来源不可靠', false],
  irrelevant: ['与主张无关', false],
};

export class VerifyUI extends SceneUI {
  constructor(app, scene) {
    super(app, scene);
    this.sel = {}; // 尚未提交的证据选择 { 'A:0': {picked:Set, verdict} }
  }
  get cases() {
    return this.def.cases;
  }
  case_(id = this.st.caseId) {
    return this.cases.find((c) => c.id === id);
  }
  claimKeys() {
    return this.cases.flatMap((c) => c.claims.map((_, i) => `${c.id}:${i}`));
  }
  submittedCount() {
    return this.claimKeys().filter((k) => this.st.claims[k]?.submitted).length;
  }
  maxStep() {
    const s = this.st;
    if (Object.keys(s.impressions).length < this.cases.length) return 0;
    if (this.submittedCount() < this.claimKeys().length) return 1;
    if (!(s.revisions.B?.ok && s.revisions.C?.ok)) return 2;
    if (!this.def.usage.every((u) => s.usage[u.id]?.ok)) return 3;
    return 4;
  }
  taskHint() {
    return {
      observe: '阅读三段 AI 回答，先说说你的第一印象。',
      evidence: '点击回答中的关键主张，选择相关证据并作出判断。',
      revise: '把有问题的回答改成符合证据范围的说法。',
      usage: '判断四种日常情境中，怎样使用 AI 才合理。',
      wrap: '总结负责任使用人工智能的要点。',
    }[this.stepId];
  }

  work(key) {
    if (!this.sel[key]) {
      const saved = this.st.claims[key];
      this.sel[key] = { picked: new Set(saved?.selected || []), verdict: saved?.verdict || null };
    }
    return this.sel[key];
  }

  enter() {
    const s = this.st;
    const c = this.case_();
    const sc = this.scene;
    const id = this.stepId;
    if (id === 'evidence') {
      const key = `${c.id}:${s.claim}`;
      const w = this.work(key);
      sc.drawInfo(c, s.claim);
      sc.setEvidence(c.claims[s.claim].evidence, [...w.picked]);
      sc.setVerdict(s.claims[key]?.submitted ? s.claims[key].verdict : w.verdict || 'unsure');
      sc.openDevice(true);
    } else {
      sc.drawInfo(id === 'observe' || id === 'revise' ? c : null);
      sc.setEvidence([], []);
      sc.openDevice(false);
      sc.setVerdict('unsure');
    }
  }

  onStation(id) {
    this.scene.highlight(id);
    this.showConcept(this.def.stations[id]);
  }
  onEvidenceCard(i) {
    if (this.stepId !== 'evidence') return;
    this.toggleEvidence(i);
  }

  task() {
    return this[`t_${this.stepId}`]();
  }

  tabs() {
    const s = this.st;
    return `<div class="tabs">${this.cases.map((c) => `<button class="tab ${s.caseId === c.id ? 'on' : ''}" data-act="case" data-id="${c.id}">案例 ${c.id}</button>`).join('')}</div>`;
  }
  answerHtml(c, clickable) {
    return c.answer
      .map((p) => {
        if (p.claim == null) return esc(p.text);
        const st = this.st.claims[`${c.id}:${p.claim}`];
        const cls = st?.submitted ? (st.correct ? 'ok' : 'bad') : '';
        return `<mark class="claim ${cls} ${this.st.claim === p.claim && this.stepId === 'evidence' ? 'on' : ''}" ${clickable ? `data-act="claim" data-i="${p.claim}"` : ''}>${esc(p.text)}<sup>主张${p.claim + 1}</sup></mark>`;
      })
      .join('');
  }

  t_observe() {
    const s = this.st;
    const c = this.case_();
    const all = Object.keys(s.impressions).length === this.cases.length;
    return `
      ${this.tabs()}
      <div class="card qa"><div class="qa-q"><b>提问</b>${esc(c.question)}</div><div class="qa-a"><b>AI 的回答</b><p>${this.answerHtml(c, false)}</p></div></div>
      <h3 class="q">凭第一印象：这段回答可靠吗？</h3>
      <div class="opts three">${this.def.firstImpression.map((o) => `<button class="opt ${s.impressions[c.id] === o.id ? 'sel' : ''}" data-act="impress" data-id="${o.id}">${esc(o.text)}</button>`).join('')}</div>
      <div class="muted">已记录 ${Object.keys(s.impressions).length}/${this.cases.length} 个案例的第一印象。标出颜色的句子，是回答中可以核查的“主张”。</div>
      ${this.nextBtn(all, '继续：寻找证据', '三个案例都要看一看')}`;
  }

  t_evidence() {
    const s = this.st;
    const c = this.case_();
    const key = `${c.id}:${s.claim}`;
    const cl = c.claims[s.claim];
    const saved = s.claims[key];
    const w = this.work(key);
    const done = !!saved?.submitted && saved.correct;
    return `
      ${this.tabs()}
      <div class="card qa"><div class="qa-a"><b>AI 的回答</b> <small>点击标出的主张进行核验</small><p>${this.answerHtml(c, true)}</p></div></div>
      <div class="claim-box"><b>正在核验 · 主张 ${s.claim + 1}</b>${esc(cl.text)}</div>
      ${c.note ? `<div class="muted">${esc(c.note)}</div>` : ''}
      <h3 class="q">① 哪些材料可以作为核验这条主张的证据？<small>（可多选）</small></h3>
      <div class="evs">${cl.evidence
        .map((e, i) => {
          const on = w.picked.has(i);
          const [relText, relevant] = REL[e.rel];
          const fb = saved?.submitted ? `<div class="ev-fb ${on === relevant ? 'ok' : 'bad'}"><b>${relText}</b>${esc(e.why)}${on === relevant ? '' : relevant ? '（这条材料与主张有关，应当选上。）' : '（这条材料不适合作为证据。）'}</div>` : '';
          return `<button class="ev ${on ? 'sel' : ''}" data-act="ev" data-i="${i}" ${done ? 'disabled' : ''}><span class="ev-src">证据 ${i + 1} · ${esc(e.source)}</span><span class="ev-txt">${esc(e.text)}</span>${fb}</button>`;
        })
        .join('')}</div>
      <h3 class="q">② 根据证据，这条主张——</h3>
      <div class="opts three">${this.def.verdicts.map((v) => `<button class="opt ${w.verdict === v.id ? (saved?.submitted ? (v.id === cl.answer ? 'ok' : 'bad') : 'sel') : ''}" data-act="verdict" data-id="${v.id}" ${done ? 'disabled' : ''}>${esc(v.text)}</button>`).join('')}</div>
      ${saved?.submitted ? `<div class="fb ${saved.correct ? 'ok' : 'bad'}"><b>${saved.correct ? '判断与证据一致' : '再看看证据'}</b>${esc(cl.feedback[saved.verdict])}</div>` : ''}
      ${done ? '' : `<div class="next-row"><button class="btn primary" data-act="submit" ${w.verdict && w.picked.size ? '' : 'disabled'}>提交判断</button></div>`}
      <div class="stat-row"><span>已核验主张 <b>${this.submittedCount()}</b> / ${this.claimKeys().length}</span><span class="muted">三个案例共 4 条</span></div>
      ${this.nextBtn(this.submittedCount() === this.claimKeys().length, '继续：修改回答', '完成全部主张的核验')}`;
  }

  revBlock(c) {
    const r = c.revision;
    const saved = this.st.revisions[c.id];
    return `<div class="card"><h4>案例 ${c.id} · ${esc(c.tag)}</h4>
      <p class="orig">原回答：“${esc(r.target)}”</p>
      <h3 class="q">${esc(r.q)}</h3>
      <div class="opts">${r.options
        .map((o) => `<button class="opt ${saved?.choice === o.id ? (o.ok ? 'ok' : 'bad') : ''}" data-act="rev" data-case="${c.id}" data-id="${o.id}" ${saved?.ok ? 'disabled' : ''}>${esc(o.text)}</button>`)
        .join('')}</div>
      ${saved ? `<div class="fb ${saved.ok ? 'ok' : 'bad'}">${esc(r.options.find((o) => o.id === saved.choice).why)}</div>` : ''}</div>`;
  }

  t_revise() {
    const s = this.st;
    const B = this.case_('B');
    const C = this.case_('C');
    return `
      ${this.revBlock(B)}
      <div class="card"><h4>案例 C · 先想清楚三个问题</h4>
      ${C.checks
        .map((q, i) => {
          const saved = s.checks[`C:${i}`];
          return `<div class="yn"><span>${esc(q.q)}</span><span class="yn-b"><button class="opt xs ${saved ? (q.answer === true ? 'ok' : saved.choice === true ? 'bad' : '') : ''}" data-act="check" data-i="${i}" data-v="1">是</button><button class="opt xs ${saved ? (q.answer === false ? 'ok' : saved.choice === false ? 'bad' : '') : ''}" data-act="check" data-i="${i}" data-v="0">否</button></span>${saved ? `<div class="fb ${saved.ok ? 'ok' : 'bad'}">${esc(q.why)}</div>` : ''}</div>`;
        })
        .join('')}</div>
      ${this.revBlock(C)}
      <div class="fb info"><b>修改的原则</b>有证据反驳的错误要改正；证据不够时，保留“不确定”，不强行作出肯定或否定的结论。</div>
      ${this.nextBtn(!!(s.revisions.B?.ok && s.revisions.C?.ok), '继续：合理使用 AI', '完成两段回答的修改')}`;
  }

  t_usage() {
    const s = this.st;
    const n = this.def.usage.filter((u) => s.usage[u.id]?.ok).length;
    return `
      <h3 class="q">下面四种情境中，哪种做法更合理？</h3>
      ${this.def.usage
        .map((u) => {
          const saved = s.usage[u.id];
          return `<div class="card"><h4>${esc(u.title)}</h4><p class="orig">${esc(u.situation)}</p>
          <div class="opts">${u.options.map((o) => `<button class="opt ${saved?.choice === o.id ? (o.ok ? 'ok' : 'bad') : ''}" data-act="use" data-u="${u.id}" data-id="${o.id}" ${saved?.ok ? 'disabled' : ''}>${esc(o.text)}</button>`).join('')}</div>
          ${saved ? `<div class="fb ${saved.ok ? 'ok' : 'bad'}">${esc(u.options.find((o) => o.id === saved.choice).why)}</div>` : ''}</div>`;
        })
        .join('')}
      <div class="stat-row"><span>已完成 <b>${n}</b> / ${this.def.usage.length} 个情境</span></div>
      ${this.nextBtn(n === this.def.usage.length, '继续：小结', '完成四个情境的判断')}`;
  }

  t_wrap() {
    const s = this.st;
    const first = this.claimKeys().filter((k) => s.claims[k]?.first).length;
    const items = [
      ['识别 AI 回答中的关键主张', this.submittedCount() > 0],
      ['选择相关证据进行核验', this.submittedCount() === this.claimKeys().length],
      ['修正一段存在问题的回答', !!s.revisions.B?.ok],
      ['完成 AI 负责任使用的情境判断', this.def.usage.every((u) => s.usage[u.id]?.ok)],
    ];
    const imp = { trust: '可靠', unsure: '不确定', doubt: '不可靠' };
    return `
      <h3 class="q">第一印象 与 核验结果</h3>
      <table class="tbl"><tr><th>案例</th><th>我的第一印象</th><th>核验后发现</th></tr>
      ${this.cases.map((c) => `<tr><td>案例 ${c.id}</td><td>${imp[s.impressions[c.id]] || '—'}</td><td>${esc(c.tag)}</td></tr>`).join('')}</table>
      <div class="fb info"><b>我的发现</b>三段回答读起来都很流畅、很自信，但只有经过核验才知道：一段基本正确，一段夹着事实错误，一段把证据不足的事说得过于肯定。4 条主张中，你有 ${first} 条首次判断就与证据一致。</div>
      <h3 class="q">合理使用人工智能</h3>
      <ol class="sum">${this.def.principles.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <ul class="checks">${items.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</li>`).join('')}</ul>
      ${this.finishBlock('你已经学会：先找主张，再看证据，最后作判断。课程总结已解锁。')}`;
  }

  toggleEvidence(i) {
    const s = this.st;
    const key = `${s.caseId}:${s.claim}`;
    if (s.claims[key]?.submitted && s.claims[key].correct) return;
    const w = this.work(key);
    w.picked.has(i) ? w.picked.delete(i) : w.picked.add(i);
    if (s.claims[key]) s.claims[key].submitted = false;
    this.enter();
    this.refresh('right');
  }

  handle(act, d) {
    const s = this.st;
    switch (act) {
      case 'case':
        s.caseId = d.id;
        s.claim = 0;
        this.save();
        this.enter();
        return this.refresh('right');
      case 'impress': {
        const c = this.case_();
        s.impressions[c.id] = d.id;
        this.log('predict', `案例 ${c.id} 的第一印象：${this.def.firstImpression.find((o) => o.id === d.id).text}。`);
        // 自动切到下一个还没看的案例
        const next = this.cases.find((x) => !s.impressions[x.id]);
        if (next) s.caseId = next.id;
        this.save();
        this.enter();
        return this.app.ui.render();
      }
      case 'claim':
        s.claim = +d.i;
        this.save();
        this.enter();
        return this.refresh('right');
      case 'ev':
        return this.toggleEvidence(+d.i);
      case 'verdict': {
        const key = `${s.caseId}:${s.claim}`;
        this.work(key).verdict = d.id;
        if (s.claims[key]) s.claims[key].submitted = false;
        this.scene.setVerdict(d.id);
        return this.refresh('right');
      }
      case 'submit': {
        const c = this.case_();
        const key = `${c.id}:${s.claim}`;
        const cl = c.claims[s.claim];
        const w = this.work(key);
        const correct = w.verdict === cl.answer;
        const prev = s.claims[key];
        s.claims[key] = { selected: [...w.picked], verdict: w.verdict, submitted: true, correct, first: prev ? prev.first : correct };
        const vt = this.def.verdicts.find((v) => v.id === w.verdict).text;
        this.log('verify', `案例 ${c.id} 主张 ${s.claim + 1}：选择证据 ${[...w.picked].map((i) => i + 1).join('、')}，判断为“${vt}”（${correct ? '与证据一致' : '需要再核对'}）。`);
        this.scene.setVerdict(w.verdict);
        this.scene.highlight('gauge');
        this.save();
        return this.app.ui.render();
      }
      case 'rev': {
        const c = this.case_(d.case);
        const o = c.revision.options.find((x) => x.id === d.id);
        const prev = s.revisions[c.id];
        s.revisions[c.id] = { choice: d.id, ok: o.ok, first: prev ? prev.first : o.ok };
        if (o.ok) this.log('revise', `修改案例 ${c.id} 的回答：“${o.text}”`);
        this.save();
        return this.app.ui.render();
      }
      case 'check': {
        const q = this.case_('C').checks[+d.i];
        const choice = d.v === '1';
        s.checks[`C:${d.i}`] = { choice, ok: choice === q.answer };
        this.save();
        return this.refresh('right');
      }
      case 'use': {
        const u = this.def.usage.find((x) => x.id === d.u);
        const o = u.options.find((x) => x.id === d.id);
        const prev = s.usage[u.id];
        s.usage[u.id] = { choice: d.id, ok: o.ok, first: prev ? prev.first : o.ok };
        if (o.ok) this.log('usage', `情境“${u.title}”：选择“${o.text}”`);
        this.save();
        return this.app.ui.render();
      }
      default:
    }
  }
}
