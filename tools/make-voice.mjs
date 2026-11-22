// 把人物台词预先合成为自然人声（MP3），供课本离线播放。
// 用法：node tools/make-voice.mjs <工具目录> <模型目录>
//   工具目录：已执行过 `npm install sherpa-onnx-node @breezystack/lamejs` 的文件夹
//   模型目录：解压后的 vits-melo-tts-zh_en（MeloTTS 中英混合模型，MIT 许可）
//   模型下载：https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-melo-tts-zh_en.tar.bz2
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const [toolsDir, modelDir] = process.argv.slice(2);
if (!toolsDir || !modelDir) {
  console.error('用法：node tools/make-voice.mjs <工具目录> <模型目录>');
  process.exit(1);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(path.resolve(toolsDir), 'package.json'));
const sherpa = require('sherpa-onnx-node');
const lame = await import(pathToFileURL(path.join(path.resolve(toolsDir), 'node_modules/@breezystack/lamejs/dist/lamejs.js')).href);
const Mp3Encoder = lame.Mp3Encoder || lame.default?.Mp3Encoder;
const { SPREADS } = await import(pathToFileURL(path.join(here, '../src/learning/LessonData.js')).href);

const m = (f) => path.join(path.resolve(modelDir), f);
const tts = new sherpa.OfflineTts({
  model: { vits: { model: m('model.onnx'), lexicon: m('lexicon.txt'), tokens: m('tokens.txt'), dictDir: m('dict') }, numThreads: 4, provider: 'cpu', debug: false },
  ruleFsts: [m('date.fst'), m('number.fst')].join(','),
  maxNumSentences: 1,
});

// 合成语速：学生与机器人的音频在播放时会略微升调加速，所以这里合成得慢一些
const SPEED = { teacher: 0.94, student: 0.86, robot: 0.83 };
const KIND = { guide: 'robot', assistant: 'robot', student: 'student', mentor: 'teacher', teacher: 'teacher' };
// 让“AI”按字母读出来
const normalize = (t) => t.replace(/AI/g, ' A I ').replace(/“|”/g, '').replace(/——/g, '，');

const outDir = path.join(here, '../src/assets/audio');
fs.mkdirSync(outDir, { recursive: true });
const manifest = {};
let total = 0;
for (const def of SPREADS) {
  for (const [charId, lines] of Object.entries(def.lines || {})) {
    for (const [step, text] of Object.entries(lines)) {
      const key = `${def.key}.${charId}.${step}`;
      const kind = KIND[charId] || 'teacher';
      const audio = tts.generate({ text: normalize(text), sid: 0, speed: SPEED[kind] });
      const f32 = audio.samples;
      // 峰值归一化到 -1.5 dB，并在首尾加入极短的淡入淡出
      let peak = 0;
      for (let i = 0; i < f32.length; i++) peak = Math.max(peak, Math.abs(f32[i]));
      const gain = peak > 0 ? 0.84 / peak : 1;
      const fade = Math.floor(audio.sampleRate * 0.012);
      const pcm = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const k = Math.min(1, i / fade, (f32.length - 1 - i) / fade);
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * gain * k * 32767)));
      }
      const enc = new Mp3Encoder(1, audio.sampleRate, 64);
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
      manifest[key] = { kind, sec: +sec.toFixed(2), text };
      total += buf.length;
      console.log(`${key}  ${sec.toFixed(1)}s  ${(buf.length / 1024).toFixed(0)}KB  peak=${peak.toFixed(2)}`);
    }
  }
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`共 ${Object.keys(manifest).length} 段，${(total / 1024).toFixed(0)} KB`);
