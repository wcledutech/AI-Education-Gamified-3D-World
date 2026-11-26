// 中英文切换。界面文字用 T('中文', 'English') 内联书写；教学内容分别放在 lesson.zh.js / lesson.en.js。
const KEY = 'hello-ai-lang';
let lang = 'zh';
const listeners = new Set();

export const getLang = () => lang;
export const isEn = () => lang === 'en';
/** 按当前语言取其中一个 */
export const T = (zh, en) => (lang === 'en' ? en : zh);

/** 启动时的语言：网址参数 ?lang=en / ?lang=zh > 上次的选择 > 浏览器语言 */
export function detectLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q) return /^en/i.test(q) ? 'en' : 'zh';
  } catch (e) {
    /* ignore */
  }
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === 'en' || s === 'zh') return s;
  } catch (e) {
    /* ignore */
  }
  return /^zh/i.test(navigator.language || 'zh') ? 'zh' : 'en';
}

export function setLang(next, { save = true } = {}) {
  lang = next === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  if (save) {
    try {
      window.localStorage.setItem(KEY, lang);
      // 网址里带有 lang 参数时同步更新，刷新后不会被旧参数改回去
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url);
      }
    } catch (e) {
      /* ignore */
    }
  }
  listeners.forEach((f) => f(lang));
}

/** 取出文字：函数 → 调用；[中文, English] → 按当前语言；其余原样返回 */
export const tx = (v) => (typeof v === 'function' ? v() : Array.isArray(v) ? T(v[0], v[1]) : v);

/** 语言变化时回调；按注册顺序执行 */
export function onLangChange(f) {
  listeners.add(f);
}
