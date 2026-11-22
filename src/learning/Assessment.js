// 学习评价：不统计点击次数，而是依据学生在任务中的实际表现生成报告。
import { SCENE, CONCEPTS } from './LessonData.js';

const LEVEL = { done: '已达成', part: '部分达成', todo: '待完成' };

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

  const abilities = [
    {
      name: '解释 AI 应用的输入、处理和输出',
      level: city.match.done ? (city.match.firstTry ? 'done' : 'part') : 'todo',
      evidence: city.match.done ? `完成 3 种设备的输入—处理—输出匹配（尝试 ${city.match.attempts} 次）；判断了 ${judged.length} 种设备的工作方式，其中 ${judgedRight} 种首次判断正确。` : '尚未完成“输入与输出”匹配任务。',
    },
    {
      name: '区分训练数据与测试数据',
      level: lab.runs.some((r) => r.test) ? 'done' : lab.runs.length ? 'part' : 'todo',
      evidence: lab.runs.some((r) => r.test) ? '用自己标注的数据训练了模型，并用未参与训练的 10 张图片进行了独立测试。' : lab.runs.length ? '已完成训练，尚未用测试集检验模型。' : '尚未进行模型训练。',
    },
    {
      name: '通过实验发现数据条件与预测表现的联系',
      level: condCount >= 2 && lab.explainChoice === 'data' ? 'done' : condCount >= 2 || lab.explainChoice ? 'part' : 'todo',
      evidence: condCount >= 2 ? `比较了 ${condCount} 种数据条件下的测试结果${lab.explainText ? '，并写下了自己的解释' : ''}。` : '尚未完成不同数据条件的对比实验。',
    },
    {
      name: '对 AI 输出进行证据核验',
      level: claimsDone.length === claimKeys.length ? (claimsRight >= 3 ? 'done' : 'part') : claimsDone.length ? 'part' : 'todo',
      evidence: claimsDone.length ? `核验了 ${claimsDone.length}/${claimKeys.length} 条主张，其中 ${claimsRight} 条首次判断与证据一致；修正了 ${revDone.length}/2 段有问题的回答。` : '尚未开始证据核验。',
    },
    {
      name: '解释采纳或拒绝 AI 建议的原因',
      level: usageDone.length === V.usage.length ? (usageRight >= 3 ? 'done' : 'part') : usageDone.length ? 'part' : 'todo',
      evidence: usageDone.length ? `完成 ${usageDone.length}/${V.usage.length} 个使用情境判断，其中 ${usageRight} 个首次选择合理${data.summary.reflection ? '；并写下了最终反思' : ''}。` : '尚未完成 AI 使用情境判断。',
    },
  ].map((a) => ({ ...a, levelText: LEVEL[a.level] }));

  const scenes = [
    { key: 'city', title: C.title, done: city.done, detail: `判断设备 ${judged.length}/${C.devices.length} · 输入输出匹配${city.match.done ? '已完成' : '未完成'}` },
    { key: 'lab', title: SCENE.lab.title, done: lab.done, detail: `标注 ${Object.keys(lab.labels).length}/20 · 训练 ${lab.runs.length} 次 · 对比条件 ${condCount}/3` },
    { key: 'verify', title: V.title, done: verify.done, detail: `核验主张 ${claimsDone.length}/${claimKeys.length} · 情境判断 ${usageDone.length}/${V.usage.length}` },
  ];

  // 概念掌握：依据相关任务是否完成
  const conceptState = {
    ai: judged.length >= C.minJudged,
    rule: judged.some(([id]) => C.devices.find((d) => d.id === id)?.kind === 'rule'),
    io: city.match.done,
    data: Object.keys(lab.labels).length > 0,
    label: Object.keys(lab.labels).length >= 20,
    trainset: lab.runs.length > 0,
    testset: lab.runs.some((r) => r.test),
    model: lab.runs.length > 0,
    predict: lab.runs.some((r) => r.test),
    bias: condCount >= 2,
    verify: claimsDone.length >= 3,
  };
  const concepts = Object.entries(conceptState).map(([id, ok]) => ({ id, name: CONCEPTS[id].name, ok }));

  return { scenes, abilities, concepts, runs, claims: { done: claimsDone.length, total: claimKeys.length, right: claimsRight }, usage: { done: usageDone.length, total: V.usage.length, right: usageRight } };
}

/** 导出为纯文本 */
export function reportToText(data) {
  const r = buildReport(data);
  const L = [];
  L.push('《Hello, AI！走进人工智能的世界》学习记录');
  L.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
  L.push('');
  L.push('一、场景完成情况');
  r.scenes.forEach((s) => L.push(`  ${s.done ? '[已完成]' : '[未完成]'} ${s.title}：${s.detail}`));
  L.push('');
  L.push('二、学习表现');
  r.abilities.forEach((a) => L.push(`  ${a.levelText}｜${a.name}\n      ${a.evidence}`));
  L.push('');
  L.push('三、模型训练与测试结果');
  const name = { A: '实验A 均衡数据', B: '实验B 不均衡数据', C: '实验C 含错误标签' };
  if (!Object.keys(r.runs).length) L.push('  （暂无）');
  Object.entries(r.runs).forEach(([k, run]) =>
    L.push(`  ${name[k]}：训练样本 猫${run.cat}/狗${run.dog}，错误标签 ${run.wrong}，测试正确率 ${run.test.correct}/${run.test.n}（猫 ${run.test.catCorrect}/${run.test.catN}，狗 ${run.test.dogCorrect}/${run.test.dogN}）`)
  );
  if (data.lab.explainText) L.push(`  我的解释：${data.lab.explainText}`);
  L.push('');
  L.push('四、信息核验');
  L.push(`  核验主张 ${r.claims.done}/${r.claims.total}（首次判断与证据一致 ${r.claims.right} 条）；使用情境判断 ${r.usage.done}/${r.usage.total}`);
  L.push('');
  L.push('五、我的反思');
  L.push(`  ${data.summary.reflection || '（未填写）'}`);
  L.push('');
  L.push('六、探索记录');
  data.log.forEach((l) => L.push(`  ${new Date(l.t).toLocaleTimeString('zh-CN')}  ${l.text}`));
  return L.join('\n');
}
