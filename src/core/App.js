// 应用入口：组装渲染器、书本、场景、教学界面与学习状态，并驱动主循环。
import * as THREE from 'three';
import gsap from 'gsap';
import { Renderer } from './Renderer.js';
import { CameraManager } from './CameraManager.js';
import { Interaction } from './Interaction.js';
import { BookController } from './BookController.js';
import { buildSpreadTextures } from '../book/SpreadTextures.js';
import { SPREADS, COURSE } from '../learning/LessonData.js';
import { LearningProgress } from '../learning/LearningProgress.js';
import { DatasetManager } from '../ml/DatasetManager.js';
import { loadTF } from '../ml/ModelTrainer.js';
import { Speech } from '../utils/Speech.js';
import { nextFrame } from '../utils/frame.js';
import { T, getLang, setLang } from '../utils/i18n.js';
import { redrawAllPanels } from '../utils/three-helpers.js';
import { UI } from '../ui/UI.js';
import { SmartCityScene } from '../scenes/SmartCityScene.js';
import { AITrainingScene } from '../scenes/AITrainingScene.js';
import { AIVerificationScene } from '../scenes/AIVerificationScene.js';
import { SummaryScene } from '../scenes/SummaryScene.js';
import { CityUI } from '../ui/CityUI.js';
import { LabUI } from '../ui/LabUI.js';
import { VerifyUI } from '../ui/VerifyUI.js';
import { SummaryUI } from '../ui/SummaryUI.js';

// 场景注册表：新增学习场景时在这里登记“场景类 + 界面类”
const REGISTRY = {
  city: [SmartCityScene, CityUI],
  lab: [AITrainingScene, LabUI],
  verify: [AIVerificationScene, VerifyUI],
  summary: [SummaryScene, SummaryUI],
};

// 人物的配音类型（决定音色的轻微差别）
const VOICE_KIND = { guide: 'robot', assistant: 'robot', student: 'student', mentor: 'teacher', teacher: 'teacher' };

class Bus {
  constructor() {
    this.m = {};
  }
  on(k, f) {
    (this.m[k] = this.m[k] || []).push(f);
  }
  emit(k, v) {
    (this.m[k] || []).forEach((f) => f(v));
  }
}

const frame = nextFrame;

export class App {
  constructor(root) {
    this.root = root;
    this.bus = new Bus();
    this.state = new LearningProgress();
    this.dialogue = null;
    root.innerHTML = '<div id="viewport"></div>';
    this.viewport = root.querySelector('#viewport');
    this.ui = new UI(this, root);
    this.speech = new Speech(() => this.ui.current && this.ui.render('right'));
    this.speech.setEnabled(this.state.data.voice);
    this.scenes = [];
    this.clock = new THREE.Clock();
    this.width = window.innerWidth;
  }

  async start() {
    const ui = this.ui;
    try {
      document.title = COURSE.title;
      ui.progress(0.05, T('准备三维渲染器…', 'Preparing the 3D renderer…'));
      await frame();
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error(T('当前浏览器或设备不支持 WebGL，无法显示三维书本。', 'This browser or device does not support WebGL, so the 3D book cannot be shown.'));
      this.renderer = new Renderer(this.viewport);
      this.cam = new CameraManager(this.renderer.webgl.domElement);
      this.interaction = new Interaction(this.renderer.webgl.domElement, this.cam.camera, ui.tooltip);

      ui.progress(0.15, T('绘制猫和狗的样本图片…', 'Drawing the cat and dog pictures…'));
      await frame();
      this.dataset = new DatasetManager();

      ui.progress(0.28, T('装订精装书…', 'Binding the book…'));
      await frame();
      this.book = new BookController(this);

      for (let i = 0; i < SPREADS.length; i++) {
        const def = SPREADS[i];
        ui.progress(0.36 + i * 0.12, T(`折叠立体场景：${def.title}…`, `Folding the pop-up scene: ${def.title}…`));
        await frame();
        const [SceneClass, UIClass] = REGISTRY[def.key];
        const scene = new SceneClass(this, def);
        scene.build();
        scene.ui = new UIClass(this, scene);
        this.scenes.push(scene);
      }

      ui.progress(0.86, T('印刷书页…', 'Printing the pages…'));
      await frame();
      this.spreads = buildSpreadTextures(SPREADS.map((def, i) => ({ def, drawGround: (ctx, w, h, P) => this.scenes[i].drawGround(ctx, w, h, P) })));
      this.book.init(this.spreads, this.scenes);

      ui.progress(0.94, T('预热画面…', 'Warming up…'));
      await frame();
      this.resize();
      this.book.warmUp();

      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.interaction.setTargets([{ root: this.book.model.clickTarget, label: ['Hello, AI！', 'Hello, AI!'], hint: ['点击封面打开', 'Click the cover to open'], active: true, onClick: () => this.openBook() }]);
      this.book.model.clickTarget.userData.interactive = this.interaction.targets[0];
      this.interaction.enabled = true;

      this.bus.on('book:turning', () => ui.updateBar());
      this.bus.on('spread:entered', () => ui.updateBar());

      ui.progress(1, T('完成', 'Done'));
      await frame();
      // 由 GSAP 的时钟统一驱动“动画更新 → 渲染”，保证同一帧内顺序一致；
      // 偶发的长帧按 33ms 计算，动画不会跳变
      gsap.ticker.lagSmoothing(150, 33);
      gsap.ticker.add(() => this.tick());
      ui.ready();
      // 开书动画结束后再预加载机器学习库，避免与动画争抢主线程
      this.bus.on('book:opened', () => setTimeout(() => loadTF().catch(() => {}), 2000));
    } catch (e) {
      console.error(e);
      ui.loadError(e?.message || String(e));
    }
  }

  async openBook() {
    if (this.book.state !== 'closed') return;
    this.interaction.enabled = false;
    this.interaction.setTargets([]);
    this.ui.hint.classList.add('hidden');
    this.ui.langChip.classList.add('hidden');
    await this.book.open();
    this.ui.bar.classList.remove('hidden');
    this.ui.updateBar();
    const d = SPREADS[0].characters.guide;
    if (!this.state.data.city.prediction) this.say(this.scenes[0], d.id);
  }

  /** 翻到第 i 个跨页（检查是否已解锁） */
  async turn(i) {
    if (i < 0 || i >= this.scenes.length || this.book.busy) return;
    if (!this.state.unlocked(i)) return this.toast(T('完成前面的学习任务后才能翻到这一页', 'Finish the earlier tasks before turning to this page.'));
    this.cam.autoRotate = false;
    this.dialogue = null;
    const p = this.book.turnTo(i);
    this.ui.updateBar();
    await p;
    this.ui.updateBar();
  }

  /** 人物说话：右页显示台词 + 字幕 + 可选语音 */
  say(scene, charId) {
    const ch = scene.characters[charId];
    const text = scene.ui.lineFor(charId);
    if (!ch || !text) return;
    // 只记录“谁在哪一步说话”，文字在显示时按当前语言取
    this.dialogue = { scene: scene.key, charId, step: scene.ui.lineStep(charId) };
    this.ui.render('right');
    this.ui.caption(`${ch.name}${T('：', ': ')}${text}`);
    this.speech.speak(text, { key: scene.ui.lineKey(charId), kind: VOICE_KIND[charId] || 'teacher' });
  }

  toast(msg) {
    this.ui.toast(msg);
  }

  /** 中文 ⇄ English：教学内容、界面文字、三维场景里的标牌与屏幕、书页印刷、封面一起切换 */
  switchLang() {
    if (this.book?.busy) return this.toast(T('翻页动画结束后再切换语言', 'Please switch language after the page has finished turning.'));
    this.speech.stop();
    setLang(getLang() === 'en' ? 'zh' : 'en');
    redrawAllPanels();
    this.spreads?.forEach((s) => s.repaint());
    this.book?.model.redrawCover();
    this.ui.applyLang();
    this.toast(T('已切换为中文', 'Switched to English'));
  }

  /** 在默认视角与某个特写视角之间切换 */
  toggleFocus(mode) {
    if (this.book.state !== 'open' || this.book.busy) return;
    this.cam.autoRotate = false;
    const target = this.cam.mode === mode ? 'open' : mode;
    this.cam.goto(target, 0.9).then(() => this.ui.updateBar());
    this.ui.updateBar();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.renderer.resize(w, h);
    this.cam.resize(w, h);
    // 立页 HTML 的像素尺寸按默认视角计算
    this.book.wings.layout(this.cam.makeCamera('open'), w);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.cam.update(dt);
    if (this.book.state === 'open') this.scenes[this.book.index]?.update(dt, t);
    this.interaction.update();
    this.renderer.render(this.cam.camera);
  }
}
