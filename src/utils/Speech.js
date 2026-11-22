// 语音朗读：优先播放预先合成的自然人声（src/assets/audio/*.mp3，离线可用）；
// 没有对应音频时退回浏览器的 Web Speech API，并尽量挑选更自然的中文语音。
// 支持播放、停止、重复播放、总开关；翻页时自动停止。
const CLIPS = import.meta.glob('../assets/audio/*.mp3', { eager: true, query: '?url', import: 'default' });
const clipUrl = (key) => (key ? CLIPS[`../assets/audio/${key}.mp3`] : null);

// 同一位配音，通过略微升调来区分角色：老师原声，学生稍亮，机器人更轻快
const RATE = { teacher: 1, student: 1.07, robot: 1.12 };

// 浏览器语音的优先顺序（越靠前越自然）
const VOICE_RANK = [/xiaoxiao.*natural/i, /natural/i, /xiaoxiao/i, /xiaoyi/i, /google.*(普通话|mandarin)/i, /ting-?ting/i, /yaoyao/i, /huihui/i];

export class Speech {
  constructor(onChange) {
    this.hasSynth = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.supported = this.hasSynth || Object.keys(CLIPS).length > 0;
    this.enabled = true;
    this.speaking = false;
    this.last = null;
    this.voice = null;
    this.audio = null;
    this.onChange = onChange || (() => {});
    if (this.hasSynth) {
      const pick = () => {
        const vs = window.speechSynthesis.getVoices().filter((v) => /^zh/i.test(v.lang) && !/HK|TW|粤|Cantonese/i.test(v.lang + v.name));
        let best = null;
        let bestRank = 99;
        vs.forEach((v) => {
          const r = VOICE_RANK.findIndex((re) => re.test(v.name));
          const rank = r < 0 ? 50 : r;
          if (rank < bestRank) {
            best = v;
            bestRank = rank;
          }
        });
        this.voice = best;
      };
      pick();
      window.speechSynthesis.addEventListener?.('voiceschanged', pick);
    }
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
    this.last = { text, opts };
    if (!this.supported || (!this.enabled && !force)) return false;
    this.stop();
    const url = clipUrl(opts.key);
    if (url) {
      const a = new Audio(url);
      a.preservesPitch = false;
      a.mozPreservesPitch = false;
      a.webkitPreservesPitch = false;
      a.playbackRate = RATE[opts.kind] || 1;
      a.onplaying = () => this.audio === a && this.setSpeaking(true);
      a.onended = () => this.audio === a && this.setSpeaking(false);
      a.onerror = () => {
        if (this.audio !== a) return;
        this.audio = null;
        this.synth(text, opts);
      };
      this.audio = a;
      a.play().catch(() => {
        if (this.audio === a) this.setSpeaking(false);
      });
      return true;
    }
    return this.synth(text, opts);
  }

  /** 浏览器语音合成（备用） */
  synth(text, opts = {}) {
    if (!this.hasSynth) return false;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (this.voice) u.voice = this.voice;
    u.rate = 0.95;
    u.pitch = opts.kind === 'robot' ? 1.15 : opts.kind === 'student' ? 1.08 : 1;
    u.onstart = () => this.setSpeaking(true);
    u.onend = u.onerror = () => this.setSpeaking(false);
    this._u = u; // 防止被垃圾回收导致 onend 不触发
    synth.speak(u);
    return true;
  }

  repeat() {
    if (this.last) this.speak(this.last.text, this.last.opts, true);
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
