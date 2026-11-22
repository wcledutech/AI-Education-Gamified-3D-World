// 学习进度：三个场景各自独立的状态 + 探索记录，保存在浏览器 LocalStorage。
const KEY = 'hello-ai-progress-v1';

const fresh = () => ({
  version: 1,
  startedAt: new Date().toISOString(),
  voice: true,
  teacher: false, // 教师模式：解锁全部页面，便于演示
  city: { step: 0, prediction: null, current: null, viewed: [], judged: {}, match: { placed: {}, attempts: 0, firstTry: null, done: false }, done: false },
  lab: { step: 0, prediction: null, labels: {}, selected: null, runs: [], explainChoice: null, explainText: '', done: false },
  verify: { step: 0, caseId: 'A', claim: 0, impressions: {}, claims: {}, checks: {}, revisions: {}, usage: {}, done: false },
  summary: { reflection: '', savedAt: null },
  log: [],
});

export class LearningProgress {
  constructor() {
    this.data = fresh();
    this.storageOk = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.version === 1) {
          const base = fresh();
          // 逐层合并，保证新增字段有默认值
          ['city', 'lab', 'verify', 'summary'].forEach((k) => (saved[k] = { ...base[k], ...(saved[k] || {}) }));
          saved.city.match = { ...base.city.match, ...(saved.city.match || {}) };
          this.data = { ...base, ...saved };
        }
      }
    } catch (e) {
      this.storageOk = false;
    }
    this._timer = null;
  }

  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.data));
        this.storageOk = true;
      } catch (e) {
        this.storageOk = false;
      }
    }, 150);
  }

  reset() {
    this.data = fresh();
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /** 向“我的探索记录”追加一条 */
  log(scene, type, text) {
    this.data.log.push({ t: Date.now(), scene, type, text });
    if (this.data.log.length > 200) this.data.log.shift();
    this.save();
  }

  /** 第 i 个跨页是否已解锁 */
  unlocked(i) {
    const d = this.data;
    if (d.teacher || i === 0) return true;
    return [true, d.city.done, d.lab.done, d.verify.done][i];
  }
}
