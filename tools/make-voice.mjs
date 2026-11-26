// 把人物台词预先合成为自然人声（MP3），供课本离线播放。
//
// 用法：node tools/make-voice.mjs <工具目录> <模型目录> [zh|en]
//   工具目录：已执行过 `npm install sherpa-onnx-node @breezystack/lamejs` 的文件夹
//   模型目录：解压后的语音模型
//     zh（默认）：vits-melo-tts-zh_en   （MeloTTS 中英混合，MIT 许可，一位女声）
//     en        ：kokoro-en-v0_19       （Kokoro 英文，Apache-2.0，多位配音）
//   模型下载：https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models
//
// 输出：中文 → src/assets/audio/*.mp3；英文 → src/assets/audio/en/*.mp3（文件名相同）
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const [toolsDir, modelDir, lang = 'zh'] = process.argv.slice(2);
if (!toolsDir || !modelDir || !['zh', 'en'].includes(lang)) {
  console.error('用法：node tools/make-voice.mjs <工具目录> <模型目录> [zh|en]');
  process.exit(1);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(path.resolve(toolsDir), 'package.json'));
const sherpa = require('sherpa-onnx-node');
const lame = await import(pathToFileURL(path.join(path.resolve(toolsDir), 'node_modules/@breezystack/lamejs/dist/lamejs.js')).href);
const Mp3Encoder = lame.Mp3Encoder || lame.default?.Mp3Encoder;
const { SCENES } = await import(pathToFileURL(path.join(here, `../src/learning/lesson.${lang}.js`)).href);

const m = (f) => path.join(path.resolve(modelDir), f);
const KIND = { guide: 'robot', assistant: 'robot', student: 'student', mentor: 'teacher', teacher: 'teacher' };

// 每种语言的合成设置。学生与机器人的音频在播放时会略微升调加速（见 src/utils/Speech.js 的 RATE），
// 所以这里合成得慢一些，播放出来的语速才正常。
const SETUP = {
  zh: {
    tts: () =>
      new sherpa.OfflineTts({
        model: { vits: { model: m('model.onnx'), lexicon: m('lexicon.txt'), tokens: m('tokens.txt'), dictDir: m('dict') }, numThreads: 4, provider: 'cpu', debug: false },
        ruleFsts: [m('date.fst'), m('number.fst')].join(','),
        maxNumSentences: 1,
      }),
    speed: { teacher: 0.94, student: 0.86, robot: 0.83 },
    speaker: () => 0,
    // 让“AI”按字母读出来
    normalize: (t) => t.replace(/AI/g, ' A I ').replace(/“|”/g, '').replace(/——/g, '，'),
    outDir: '../src/assets/audio',
    kbps: 64,
  },
  en: {
    tts: () =>
      new sherpa.OfflineTts({
        model: { kokoro: { model: m('model.onnx'), voices: m('voices.bin'), tokens: m('tokens.txt'), dataDir: m('espeak-ng-data') }, numThreads: 4, provider: 'cpu', debug: false },
        maxNumSentences: 1,
      }),
    speed: { teacher: 0.95, student: 0.92, robot: 0.9 },
    // kokoro-en-v0_19 的配音编号：0 af, 1 af_bella, 2 af_nicole, 3 af_sarah, 4 af_sky, 5 am_adam, 6 am_michael, 7 bf_emma, 8 bf_isabella, 9 bm_george, 10 bm_lewis
    // 两位老师：af_sarah / bf_emma；学生：af_sky；AI 讲解员与 AI 助手：af_bella
    speaker: (scene, charId) => ({ mentor: 3, teacher: 7, student: 4, guide: 1, assistant: 1 }[charId] ?? 3),
    normalize: (t) => t.replace(/[“”]/g, '').replace(/’/g, "'").replace(/→/g, ', then '),
    outDir: '../src/assets/audio/en',
    kbps: 48,
  },
}[lang];

const tts = SETUP.tts();
const outDir = path.join(here, SETUP.outDir);
fs.mkdirSync(outDir, { recursive: true });
const manifest = {};
let total = 0;
for (const def of Object.values(SCENES)) {
  for (const [charId, lines] of Object.entries(def.lines || {})) {
    for (const [step, text] of Object.entries(lines)) {
      const key = `${def.key}.${charId}.${step}`;
      const kind = KIND[charId] || 'teacher';
      const sid = SETUP.speaker(def.key, charId);
      const audio = tts.generate({ text: SETUP.normalize(text), sid, speed: SETUP.speed[kind] });
      const f32 = audio.samples;
      // 峰值归一化，并在首尾加入极短的淡入淡出
      let peak = 0;
      for (let i = 0; i < f32.length; i++) peak = Math.max(peak, Math.abs(f32[i]));
      const gain = peak > 0 ? 0.84 / peak : 1;
      const fade = Math.floor(audio.sampleRate * 0.012);
      const pcm = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const k = Math.min(1, i / fade, (f32.length - 1 - i) / fade);
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * gain * k * 32767)));
      }
      const enc = new Mp3Encoder(1, audio.sampleRate, SETUP.kbps);
      const chunks = [];
      for (let i = 0; i < pcm.length; i += 1152) {
        const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
        if (b.length) chunks.push(Buffer.from(b));
      }
      const end = enc.flush();
      if (end.length) chunks.push(Buffer.from(end));
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(path.join(outDir, key + '.mp3'), buf);
      const sec = f32.length / audio.sampleRate;
      manifest[key] = { kind, speaker: sid, sec: +sec.toFixed(2), text };
      total += buf.length;
      console.log(`${key}  sid=${sid}  ${sec.toFixed(1)}s  ${(buf.length / 1024).toFixed(0)}KB  ${audio.sampleRate}Hz  peak=${peak.toFixed(2)}`);
    }
  }
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[${lang}] 共 ${Object.keys(manifest).length} 段，${(total / 1024).toFixed(0)} KB`);
