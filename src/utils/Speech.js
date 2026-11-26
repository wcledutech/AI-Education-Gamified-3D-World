// 语音朗读：优先播放预先合成的自然人声（离线可用）：
//   中文 src/assets/audio/*.mp3，英文 src/assets/audio/en/*.mp3，文件名相同。
// 没有对应音频时退回浏览器的 Web Speech API，并尽量挑选更自然的语音。
// 支持播放、停止、重复播放、总开关；翻页或切换语言时自动停止。
import { getLang } from './i18n.js';

const CLIPS = import.meta.glob('../assets/audio/**/*.mp3', { eager: true, query: '?url', import: 'default' });
const clipUrl = (key, lang) => (key ? CLIPS[lang === 'en' ? `../assets/audio/en/${key}.mp3` : `../assets/audio/${key}.mp3`] : null);

// 播放速率（同时略微改变音调，用来区分角色）。
// 中文是同一位配音，靠升调区分；英文每类角色用了不同的配音，只做很轻的调整。
const RATE = {
  zh: { teacher: 1, student: 1.07, robot: 1.12 },
  en: { teacher: 1, student: 1.04, robot: 1.08 },
};

// 浏览器语音的优先顺序（越靠前越自然）
const VOICE_RANK = {
  zh: [/xiaoxiao.*natural/i, /natural/i, /xiaoxiao/i, /xiaoyi/i, /google.*(普通话|mandarin)/i, /ting-?ting/i, /yaoyao/i, /huihui/i],
  en: [/(aria|jenny|ava|emma).*natural/i, /natural/i, /google us english/i, /samantha/i, /aria|jenny/i, /zira/i],
};

export class Speech {
  constructor(onChange) {
    this.hasSynth = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.supported = this.hasSynth || Object.keys(CLIPS).length > 0;
    this.enabled = true;
    this.speaking = false;
    this.last = null;
    this.audio = null;
    this.onChange = onChange || (() => {});
  }

  /** 为当前语言挑一个浏览器语音（备用方案才会用到） */
  pickVoice(lang) {
    if (!this.hasSynth) return null;
    const isLang = lang === 'en' ? (v) => /^en/i.test(v.lang) : (v) => /^zh/i.test(v.lang) && !/HK|TW|粤|Cantonese/i.test(v.lang + v.name);
    let best = null;
    let bestRank = 99;
    window.speechSynthesis
      .getVoices()
      .filter(isLang)
      .forEach((v) => {
        const r = VOICE_RANK[lang].findIndex((re) => re.test(v.name));
        const rank = r < 0 ? 50 : r;
        if (rank < bestRank) {
          best = v;
          bestRank = rank;
        }
      });
    return best;
  }

  setSpeaking(on) {
    if (this.speaking === on) return;
    this.speaking = on;
    this.onChange();
  }

  /**
   * @param text 要朗读的文字
   * @param opts { key: 预录音频的键, kind: 'teacher' | 'student' | 'robot' }
   */
  speak(text, opts = {}, force = false) {
    this.last = { text, opts, lang: getLang() };
    if (!this.supported || (!this.enabled && !force)) return false;
    this.stop();
    const lang = getLang();
    const url = clipUrl(opts.key, lang);
    if (url) {
      const a = new Audio(url);
      a.preservesPitch = false;
      a.mozPreservesPitch = false;
      a.webkitPreservesPitch = false;
      a.playbackRate = RATE[lang][opts.kind] || 1;
      a.onplaying = () => this.audio === a && this.setSpeaking(true);
      a.onended = () => this.audio === a && this.setSpeaking(false);
      a.onerror = () => {
        if (this.audio !== a) return;
        this.audio = null;
        this.synth(text, opts, lang);
      };
      this.audio = a;
      a.play().catch(() => {
        if (this.audio === a) this.setSpeaking(false);
      });
      return true;
    }
    return this.synth(text, opts, lang);
  }

  /** 浏览器语音合成（备用） */
  synth(text, opts = {}, lang = getLang()) {
    if (!this.hasSynth) return false;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-US' : 'zh-CN';
    const voice = this.pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = opts.kind === 'robot' ? 1.15 : opts.kind === 'student' ? 1.08 : 1;
    u.onstart = () => this.setSpeaking(true);
    u.onend = u.onerror = () => this.setSpeaking(false);
    this._u = u; // 防止被垃圾回收导致 onend 不触发
    synth.speak(u);
    return true;
  }

  /** 重播上一句（如果之后切换了语言，由调用方重新取文字，这里只在语言一致时重播） */
  repeat() {
    if (this.last && this.last.lang === getLang()) this.speak(this.last.text, this.last.opts, true);
    else return false;
    return true;
  }

  stop() {
    if (this.audio) {
      const a = this.audio;
      this.audio = null;
      a.pause();
    }
    if (this.hasSynth) window.speechSynthesis.cancel();
    this.setSpeaking(false);
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }
}
