// 学习评价：不统计点击次数，而是依据学生在任务中的实际表现生成报告。
import { SCENE, CONCEPTS, COURSE } from './LessonData.js';
import { T } from '../utils/i18n.js';

const levelText = (k) => ({ done: T('已达成', 'Achieved'), part: T('部分达成', 'Partly achieved'), todo: T('待完成', 'To do') }[k]);

/** 每个条件最近一次带测试结果的训练记录 */
export function latestRuns(lab) {
  const out = {};
  lab.runs.forEach((r) => {
    if (r.test) out[r.cond] = r;
  });
  return out;
}

export function buildReport(data) {
  const { city, lab, verify } = data;
  const C = SCENE.city;
  const V = SCENE.verify;

  // ---- 场景一 ----
  const judged = Object.entries(city.judged);
  const judgedRight = judged.filter(([, j]) => j.first === true).length;
  // ---- 场景二 ----
  const runs = latestRuns(lab);
  const condCount = Object.keys(runs).length;
  // ---- 场景三 ----
  const claimKeys = V.cases.flatMap((c) => c.claims.map((_, i) => `${c.id}:${i}`));
  const claimsDone = claimKeys.filter((k) => verify.claims[k]?.submitted);
  const claimsRight = claimsDone.filter((k) => verify.claims[k].first === true).length;
  const usageDone = V.usage.filter((u) => verify.usage[u.id]);
  const usageRight = usageDone.filter((u) => verify.usage[u.id].first === true).length;
  const revDone = ['B', 'C'].filter((id) => verify.revisions[id]?.ok);
  const labeled = Object.keys(lab.labels).length;
  const tested = lab.runs.some((r) => r.test);

  const abilities = [
    {
      name: T('解释 AI 应用的输入、处理和输出', 'Explain the input, processing and output of AI applications'),
      level: city.match.done ? (city.match.firstTry ? 'done' : 'part') : 'todo',
      evidence: city.match.done
        ? T(
            `完成 3 种设备的输入—处理—输出匹配（尝试 ${city.match.attempts} 次）；判断了 ${judged.length} 种设备的工作方式，其中 ${judgedRight} 种首次判断正确。`,
            `Matched input–processing–output for 3 devices (attempts: ${city.match.attempts}); judged how ${judged.length} devices work, ${judgedRight} of them right first time.`
          )
        : T('尚未完成“输入与输出”匹配任务。', 'The “input & output” matching task is not finished yet.'),
    },
    {
      name: T('区分训练数据与测试数据', 'Tell training data apart from test data'),
      level: tested ? 'done' : lab.runs.length ? 'part' : 'todo',
      evidence: tested
        ? T('用自己标注的数据训练了模型，并用未参与训练的 10 张图片进行了独立测试。', 'Trained a model with self-labeled data and tested it independently on 10 pictures that were not used in training.')
        : lab.runs.length
        ? T('已完成训练，尚未用测试集检验模型。', 'Training is done, but the model has not been checked with the test set yet.')
        : T('尚未进行模型训练。', 'No model has been trained yet.'),
    },
    {
      name: T('通过实验发现数据条件与预测表现的联系', 'Use experiments to link data conditions with prediction performance'),
      level: condCount >= 2 && lab.explainChoice === 'data' ? 'done' : condCount >= 2 || lab.explainChoice ? 'part' : 'todo',
      evidence:
        condCount >= 2
          ? T(`比较了 ${condCount} 种数据条件下的测试结果${lab.explainText ? '，并写下了自己的解释' : ''}。`, `Compared test results under ${condCount} data conditions${lab.explainText ? ' and wrote an explanation' : ''}.`)
          : T('尚未完成不同数据条件的对比实验。', 'The comparison of different data conditions is not finished yet.'),
    },
    {
      name: T('对 AI 输出进行证据核验', 'Check AI output against evidence'),
      level: claimsDone.length === claimKeys.length ? (claimsRight >= 3 ? 'done' : 'part') : claimsDone.length ? 'part' : 'todo',
      evidence: claimsDone.length
        ? T(
            `核验了 ${claimsDone.length}/${claimKeys.length} 条主张，其中 ${claimsRight} 条首次判断与证据一致；修正了 ${revDone.length}/2 段有问题的回答。`,
            `Checked ${claimsDone.length}/${claimKeys.length} claims, ${claimsRight} judged in line with the evidence first time; corrected ${revDone.length}/2 problem answers.`
          )
        : T('尚未开始证据核验。', 'Evidence checking has not started yet.'),
    },
    {
      name: T('解释采纳或拒绝 AI 建议的原因', 'Explain why to accept or reject an AI suggestion'),
      level: usageDone.length === V.usage.length ? (usageRight >= 3 ? 'done' : 'part') : usageDone.length ? 'part' : 'todo',
      evidence: usageDone.length
        ? T(
            `完成 ${usageDone.length}/${V.usage.length} 个使用情境判断，其中 ${usageRight} 个首次选择合理${data.summary.reflection ? '；并写下了最终反思' : ''}。`,
            `Completed ${usageDone.length}/${V.usage.length} usage situations, ${usageRight} sensible on the first choice${data.summary.reflection ? '; wrote a final reflection' : ''}.`
          )
        : T('尚未完成 AI 使用情境判断。', 'The AI usage situations are not finished yet.'),
    },
  ].map((a) => ({ ...a, levelText: levelText(a.level) }));

  const scenes = [
    {
      key: 'city',
      title: C.title,
      done: city.done,
      detail: T(`判断设备 ${judged.length}/${C.devices.length} · 输入输出匹配${city.match.done ? '已完成' : '未完成'}`, `Devices judged ${judged.length}/${C.devices.length} · input/output matching ${city.match.done ? 'done' : 'not done'}`),
    },
    {
      key: 'lab',
      title: SCENE.lab.title,
      done: lab.done,
      detail: T(`标注 ${labeled}/20 · 训练 ${lab.runs.length} 次 · 对比条件 ${condCount}/3`, `Labeled ${labeled}/20 · training runs: ${lab.runs.length} · conditions compared ${condCount}/3`),
    },
    {
      key: 'verify',
      title: V.title,
      done: verify.done,
      detail: T(`核验主张 ${claimsDone.length}/${claimKeys.length} · 情境判断 ${usageDone.length}/${V.usage.length}`, `Claims checked ${claimsDone.length}/${claimKeys.length} · situations ${usageDone.length}/${V.usage.length}`),
    },
  ];

  // 概念掌握：依据相关任务是否完成
  const conceptState = {
    ai: judged.length >= C.minJudged,
    rule: judged.some(([id]) => C.devices.find((d) => d.id === id)?.kind === 'rule'),
    io: city.match.done,
    data: labeled > 0,
    label: labeled >= 20,
    trainset: lab.runs.length > 0,
    testset: tested,
    model: lab.runs.length > 0,
    predict: tested,
    bias: condCount >= 2,
    verify: claimsDone.length >= 3,
  };
  const concepts = Object.entries(conceptState).map(([id, ok]) => ({ id, name: CONCEPTS[id].name, ok }));

  return { scenes, abilities, concepts, runs, claims: { done: claimsDone.length, total: claimKeys.length, right: claimsRight }, usage: { done: usageDone.length, total: V.usage.length, right: usageRight } };
}

/** 导出为纯文本 */
export function reportToText(data) {
  const r = buildReport(data);
  const C = SCENE.lab.conditions;
  const L = [];
  L.push(T(`《${COURSE.title}》学习记录`, `${COURSE.title} — Learning record`));
  L.push(T('导出时间：', 'Exported: ') + new Date().toLocaleString(T('zh-CN', 'en-US')));
  L.push('');
  L.push(T('一、场景完成情况', '1. Scene progress'));
  r.scenes.forEach((s) => L.push(`  ${s.done ? T('[已完成]', '[done]') : T('[未完成]', '[not done]')} ${s.title}${T('：', ': ')}${s.detail}`));
  L.push('');
  L.push(T('二、学习表现', '2. What the learner can do'));
  r.abilities.forEach((a) => L.push(`  ${a.levelText}${T('｜', ' | ')}${a.name}\n      ${a.evidence}`));
  L.push('');
  L.push(T('三、模型训练与测试结果', '3. Model training and test results'));
  if (!Object.keys(r.runs).length) L.push(T('  （暂无）', '  (none yet)'));
  Object.entries(r.runs).forEach(([k, run]) =>
    L.push(
      T(
        `  ${C[k].name} ${C[k].title}：训练样本 猫${run.cat}/狗${run.dog}，错误标签 ${run.wrong}，测试正确率 ${run.test.correct}/${run.test.n}（猫 ${run.test.catCorrect}/${run.test.catN}，狗 ${run.test.dogCorrect}/${run.test.dogN}）`,
        `  ${C[k].name} (${C[k].title}): samples cat ${run.cat} / dog ${run.dog}, wrong labels ${run.wrong}, test score ${run.test.correct}/${run.test.n} (cats ${run.test.catCorrect}/${run.test.catN}, dogs ${run.test.dogCorrect}/${run.test.dogN})`
      )
    )
  );
  if (data.lab.explainText) L.push(T('  我的解释：', '  My explanation: ') + data.lab.explainText);
  L.push('');
  L.push(T('四、信息核验', '4. Fact-checking'));
  L.push(
    T(
      `  核验主张 ${r.claims.done}/${r.claims.total}（首次判断与证据一致 ${r.claims.right} 条）；使用情境判断 ${r.usage.done}/${r.usage.total}`,
      `  Claims checked ${r.claims.done}/${r.claims.total} (${r.claims.right} in line with the evidence first time); usage situations ${r.usage.done}/${r.usage.total}`
    )
  );
  L.push('');
  L.push(T('五、我的反思', '5. My reflection'));
  L.push(`  ${data.summary.reflection || T('（未填写）', '(not written)')}`);
  L.push('');
  L.push(T('六、探索记录', '6. Exploration log'));
  data.log.forEach((l) => L.push(`  ${new Date(l.t).toLocaleTimeString(T('zh-CN', 'en-US'))}  ${l.text}`));
  return L.join('\n');
}
