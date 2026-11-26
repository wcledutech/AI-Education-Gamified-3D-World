// 场景三界面：观察 AI 回答 → 寻找证据 → 修改回答 → 合理使用 → 小结
import { SceneUI, esc } from './SceneUI.js';
import { T } from '../utils/i18n.js';

// 证据与主张的关系：[说明文字, 是否应当选为证据]
const rel = (k) =>
  ({
    support: [T('支持主张', 'Supports the claim'), true],
    refute: [T('反驳主张', 'Contradicts the claim'), true],
    partial: [T('只能部分说明', 'Supports it only in part'), true],
    limit: [T('说明了研究的局限', 'Shows the limits of the study'), true],
    weak: [T('来源不可靠', 'Unreliable source'), false],
    irrelevant: [T('与主张无关', 'Unrelated to the claim'), false],
  }[k]);

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
      observe: T('阅读三段 AI 回答，先说说你的第一印象。', 'Read the three AI answers and note your first impression.'),
      evidence: T('点击回答中的关键主张，选择相关证据并作出判断。', 'Click a key claim in the answer, choose the relevant evidence and make a judgment.'),
      revise: T('把有问题的回答改成符合证据范围的说法。', 'Rewrite the problem answers so they stay within what the evidence shows.'),
      usage: T('判断四种日常情境中，怎样使用 AI 才合理。', 'Decide what a sensible use of AI looks like in four everyday situations.'),
      wrap: T('总结负责任使用人工智能的要点。', 'Sum up the key points of using AI responsibly.'),
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
    return `<div class="tabs">${this.cases.map((c) => `<button class="tab ${s.caseId === c.id ? 'on' : ''}" data-act="case" data-id="${c.id}">${T('案例', 'Case')} ${c.id}</button>`).join('')}</div>`;
  }
  answerHtml(c, clickable) {
    return c.answer
      .map((p) => {
        if (p.claim == null) return esc(p.text);
        const st = this.st.claims[`${c.id}:${p.claim}`];
        const cls = st?.submitted ? (st.correct ? 'ok' : 'bad') : '';
        return `<mark class="claim ${cls} ${this.st.claim === p.claim && this.stepId === 'evidence' ? 'on' : ''}" ${clickable ? `data-act="claim" data-i="${p.claim}"` : ''}>${esc(p.text)}<sup>${T('主张', 'Claim ')}${p.claim + 1}</sup></mark>`;
      })
      .join('');
  }

  t_observe() {
    const s = this.st;
    const c = this.case_();
    const n = Object.keys(s.impressions).length;
    const all = n === this.cases.length;
    return `
      ${this.tabs()}
      <div class="card qa"><div class="qa-q"><b>${T('提问', 'Question')}</b>${esc(c.question)}</div><div class="qa-a"><b>${T('AI 的回答', 'AI’s answer')}</b><p>${this.answerHtml(c, false)}</p></div></div>
      <h3 class="q">${T('凭第一印象：这段回答可靠吗？', 'First impression: is this answer reliable?')}</h3>
      <div class="opts three">${this.def.firstImpression.map((o) => `<button class="opt ${s.impressions[c.id] === o.id ? 'sel' : ''}" data-act="impress" data-id="${o.id}">${esc(o.text)}</button>`).join('')}</div>
      <div class="muted">${T(
        `已记录 ${n}/${this.cases.length} 个案例的第一印象。标出颜色的句子，是回答中可以核查的“主张”。`,
        `First impressions recorded for ${n}/${this.cases.length} cases. The highlighted sentences are the checkable “claims” in the answer.`
      )}</div>
      ${this.nextBtn(all, T('继续：寻找证据', 'Next: find the evidence'), T('三个案例都要看一看', 'Look at all three cases first'))}`;
  }

  t_evidence() {
    const s = this.st;
    const c = this.case_();
    const key = `${c.id}:${s.claim}`;
    const cl = c.claims[s.claim];
    const saved = s.claims[key];
    const w = this.work(key);
    const done = !!saved?.submitted && saved.correct;
    const total = this.claimKeys().length;
    return `
      ${this.tabs()}
      <div class="card qa"><div class="qa-a"><b>${T('AI 的回答', 'AI’s answer')}</b> <small>${T('点击标出的主张进行核验', 'click a highlighted claim to check it')}</small><p>${this.answerHtml(c, true)}</p></div></div>
      <div class="claim-box"><b>${T(`正在核验 · 主张 ${s.claim + 1}`, `Checking · Claim ${s.claim + 1}`)}</b>${esc(cl.text)}</div>
      ${c.note ? `<div class="muted">${esc(c.note)}</div>` : ''}
      <h3 class="q">${T('① 哪些材料可以作为核验这条主张的证据？', '① Which materials can serve as evidence for checking this claim?')}<small>${T('（可多选）', ' (choose any)')}</small></h3>
      <div class="evs">${cl.evidence
        .map((e, i) => {
          const on = w.picked.has(i);
          const [relText, relevant] = rel(e.rel);
          const fb = saved?.submitted
            ? `<div class="ev-fb ${on === relevant ? 'ok' : 'bad'}"><b>${relText}</b>${esc(e.why)}${
                on === relevant ? '' : relevant ? T('（这条材料与主张有关，应当选上。）', ' (This material relates to the claim and should be selected.)') : T('（这条材料不适合作为证据。）', ' (This material is not suitable as evidence.)')
              }</div>`
            : '';
          return `<button class="ev ${on ? 'sel' : ''}" data-act="ev" data-i="${i}" ${done ? 'disabled' : ''}><span class="ev-src">${T('证据', 'Evidence')} ${i + 1} · ${esc(e.source)}${on ? `<i>${T('  ✓ 已选为证据', '  ✓ selected')}</i>` : ''}</span><span class="ev-txt">${esc(e.text)}</span>${fb}</button>`;
        })
        .join('')}</div>
      <h3 class="q">${T('② 根据证据，这条主张——', '② Based on the evidence, this claim is:')}</h3>
      <div class="opts three">${this.def.verdicts.map((v) => `<button class="opt ${w.verdict === v.id ? (saved?.submitted ? (v.id === cl.answer ? 'ok' : 'bad') : 'sel') : ''}" data-act="verdict" data-id="${v.id}" ${done ? 'disabled' : ''}>${esc(v.text)}</button>`).join('')}</div>
      ${saved?.submitted ? `<div class="fb ${saved.correct ? 'ok' : 'bad'}"><b>${saved.correct ? T('判断与证据一致', 'Your judgment fits the evidence') : T('再看看证据', 'Look at the evidence again')}</b>${esc(cl.feedback[saved.verdict])}</div>` : ''}
      ${done ? '' : `<div class="next-row"><button class="btn primary" data-act="submit" ${w.verdict && w.picked.size ? '' : 'disabled'}>${T('提交判断', 'Submit judgment')}</button></div>`}
      <div class="stat-row"><span>${T(`已核验主张 <b>${this.submittedCount()}</b> / ${total}`, `Claims checked <b>${this.submittedCount()}</b> / ${total}`)}</span><span class="muted">${T('三个案例共 4 条', '4 in total across the three cases')}</span></div>
      ${this.nextBtn(this.submittedCount() === total, T('继续：修改回答', 'Next: revise the answers'), T('完成全部主张的核验', 'Check every claim first'))}`;
  }

  revBlock(c) {
    const r = c.revision;
    const saved = this.st.revisions[c.id];
    return `<div class="card"><h4>${T('案例', 'Case')} ${c.id} · ${esc(c.tag)}</h4>
      <p class="orig">${T('原回答：', 'Original: ')}“${esc(r.target)}”</p>
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
      <div class="card"><h4>${T('案例 C · 先想清楚三个问题', 'Case C · Three questions to think through first')}</h4>
      ${C.checks
        .map((q, i) => {
          const saved = s.checks[`C:${i}`];
          return `<div class="yn"><span>${esc(q.q)}</span><span class="yn-b"><button class="opt xs ${saved ? (q.answer === true ? 'ok' : saved.choice === true ? 'bad' : '') : ''}" data-act="check" data-i="${i}" data-v="1">${T('是', 'Yes')}</button><button class="opt xs ${saved ? (q.answer === false ? 'ok' : saved.choice === false ? 'bad' : '') : ''}" data-act="check" data-i="${i}" data-v="0">${T('否', 'No')}</button></span>${saved ? `<div class="fb ${saved.ok ? 'ok' : 'bad'}">${esc(q.why)}</div>` : ''}</div>`;
        })
        .join('')}</div>
      ${this.revBlock(C)}
      <div class="fb info"><b>${T('修改的原则', 'How to revise')}</b>${T(
        '有证据反驳的错误要改正；证据不够时，保留“不确定”，不强行作出肯定或否定的结论。',
        'Correct the errors that the evidence contradicts. When the evidence is not enough, keep the uncertainty and do not force a yes or a no.'
      )}</div>
      ${this.nextBtn(!!(s.revisions.B?.ok && s.revisions.C?.ok), T('继续：合理使用 AI', 'Next: using AI sensibly'), T('完成两段回答的修改', 'Revise both answers first'))}`;
  }

  t_usage() {
    const s = this.st;
    const n = this.def.usage.filter((u) => s.usage[u.id]?.ok).length;
    const total = this.def.usage.length;
    return `
      <h3 class="q">${T('下面四种情境中，哪种做法更合理？', 'In each of these four situations, which approach is more sensible?')}</h3>
      ${this.def.usage
        .map((u) => {
          const saved = s.usage[u.id];
          return `<div class="card"><h4>${esc(u.title)}</h4><p class="orig">${esc(u.situation)}</p>
          <div class="opts">${u.options.map((o) => `<button class="opt ${saved?.choice === o.id ? (o.ok ? 'ok' : 'bad') : ''}" data-act="use" data-u="${u.id}" data-id="${o.id}" ${saved?.ok ? 'disabled' : ''}>${esc(o.text)}</button>`).join('')}</div>
          ${saved ? `<div class="fb ${saved.ok ? 'ok' : 'bad'}">${esc(u.options.find((o) => o.id === saved.choice).why)}</div>` : ''}</div>`;
        })
        .join('')}
      <div class="stat-row"><span>${T(`已完成 <b>${n}</b> / ${total} 个情境`, `Completed <b>${n}</b> / ${total} situations`)}</span></div>
      ${this.nextBtn(n === total, T('继续：小结', 'Next: wrap-up'), T('完成四个情境的判断', 'Complete all four situations'))}`;
  }

  t_wrap() {
    const s = this.st;
    const first = this.claimKeys().filter((k) => s.claims[k]?.first).length;
    const items = [
      [T('识别 AI 回答中的关键主张', 'Identified key claims in an AI answer'), this.submittedCount() > 0],
      [T('选择相关证据进行核验', 'Chose relevant evidence to check them'), this.submittedCount() === this.claimKeys().length],
      [T('修正一段存在问题的回答', 'Corrected an answer that had a problem'), !!s.revisions.B?.ok],
      [T('完成 AI 负责任使用的情境判断', 'Completed the situations on responsible AI use'), this.def.usage.every((u) => s.usage[u.id]?.ok)],
    ];
    const imp = Object.fromEntries(this.def.firstImpression.map((o) => [o.id, o.text]));
    return `
      <h3 class="q">${T('第一印象 与 核验结果', 'First impression vs. what checking showed')}</h3>
      <table class="tbl"><tr><th>${T('案例', 'Case')}</th><th>${T('我的第一印象', 'My first impression')}</th><th>${T('核验后发现', 'What checking showed')}</th></tr>
      ${this.cases.map((c) => `<tr><td>${T('案例', 'Case')} ${c.id}</td><td>${esc(imp[s.impressions[c.id]] || '—')}</td><td>${esc(c.tag)}</td></tr>`).join('')}</table>
      <div class="fb info"><b>${T('我的发现', 'What I found')}</b>${T(
        `三段回答读起来都很流畅、很自信，但只有经过核验才知道：一段基本正确，一段夹着事实错误，一段把证据不足的事说得过于肯定。4 条主张中，你有 ${first} 条首次判断就与证据一致。`,
        `All three answers read fluently and confidently, but only checking reveals that one is mostly correct, one hides a factual error, and one sounds far too certain about something with too little evidence. Of the 4 claims, your first judgment fitted the evidence on ${first}.`
      )}</div>
      <h3 class="q">${T('合理使用人工智能', 'Using AI sensibly')}</h3>
      <ol class="sum">${this.def.principles.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <ul class="checks">${items.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</li>`).join('')}</ul>
      ${this.finishBlock(T('你已经学会：先找主张，再看证据，最后作判断。课程总结已解锁。', 'You have learned to find the claims first, then look at the evidence, and only then judge. The course summary is now unlocked.'))}`;
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
        const text = this.def.firstImpression.find((o) => o.id === d.id).text;
        this.log('predict', T(`案例 ${c.id} 的第一印象：${text}。`, `Case ${c.id}, first impression: ${text}.`));
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
        const picks = [...w.picked].map((i) => i + 1);
        this.log(
          'verify',
          T(
            `案例 ${c.id} 主张 ${s.claim + 1}：选择证据 ${picks.join('、')}，判断为“${vt}”（${correct ? '与证据一致' : '需要再核对'}）。`,
            `Case ${c.id}, claim ${s.claim + 1}: chose evidence ${picks.join(', ')}; judged “${vt}” (${correct ? 'fits the evidence' : 'needs another look'}).`
          )
        );
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
        if (o.ok) this.log('revise', T(`修改案例 ${c.id} 的回答：“${o.text}”`, `Revised the answer in Case ${c.id}: “${o.text}”`));
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
        if (o.ok) this.log('usage', T(`情境“${u.title}”：选择“${o.text}”`, `Situation “${u.title}”: chose “${o.text}”`));
        this.save();
        return this.app.ui.render();
      }
      default:
    }
  }
}
