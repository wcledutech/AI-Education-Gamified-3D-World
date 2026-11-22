// 书本控制器：开书、连续翻页、立体场景的收拢与展开。保证动画期间不会重复触发。
import gsap from 'gsap';
import { BOOK, STAGE } from '../utils/config.js';
import { BookModel } from '../book/BookModel.js';
import { PageLeaf } from '../book/PageModel.js';
import { Stage, Wings } from '../book/PopUp.js';
import { blankPageTexture } from '../book/SpreadTextures.js';

const done = (tl) => new Promise((res) => tl.eventCallback('onComplete', res));

export class BookController {
  constructor(app) {
    this.app = app;
    this.model = new BookModel();
    this.root = this.model.group;
    this.stage = new Stage();
    this.leaf = new PageLeaf();
    this.leafB = new PageLeaf();
    this.wings = new Wings(app.ui.leftEl, app.ui.rightEl);
    this.root.add(this.stage.group, this.leaf.group, this.leafB.group, ...this.wings.groups);

    this.state = 'closed';
    this.busy = false;
    this.index = 0;
    this.matTop = app.renderer.matTop;
    this.closedX = -(BOOK.W + BOOK.OV) / 2 + BOOK.COVER / 2;
    this.root.position.set(this.closedX, this.matTop, 0);
    this.root.rotation.y = -0.07;
    app.renderer.scene.add(this.root);
    this.shadowBlob = app.renderer.contactShadow;
    this.shadowBlob.position.x = 0;
  }

  init(spreads, scenes) {
    this.spreads = spreads;
    this.scenes = scenes;
    scenes.forEach((s) => {
      this.stage.content.add(s.group);
      s.group.scale.setScalar(STAGE.K);
      s.group.visible = false;
    });
    this.model.setPrints(spreads[0].left, spreads[0].right);
    this.blank = blankPageTexture();
  }

  /**
   * 预热：在加载画面背后把全部场景以“展开状态”渲染一次，
   * 提前完成着色器编译、几何体与贴图上传，避免开书和翻页时掉帧。
   */
  warmUp() {
    const { app, model, stage, wings } = this;
    const gl = app.renderer.webgl;
    const cam = app.cam.makeCamera('open');
    this.spreads.forEach((s) => [s.left, s.right, s.leftMirror, s.ground].forEach((t) => gl.initTexture(t)));
    gl.initTexture(this.blank);

    const pos = this.root.position.clone();
    const rotY = this.root.rotation.y;
    this.root.position.set(0, this.matTop, 0);
    this.root.rotation.y = 0;
    model.setAngles(-0.6, -0.3);
    stage.setGround(this.spreads[0].ground);
    stage.setLift(1);
    wings.setFold(1);
    [this.leaf, this.leafB].forEach((l) => {
      l.setMaps(this.blank, this.blank);
      l.set(0.5);
      l.group.visible = true;
    });
    this.scenes.forEach((s) => {
      s.group.visible = true;
      s.popups.forEach((p) => p.setFold(1));
    });
    app.renderer.scene.updateMatrixWorld(true);
    gl.compile(app.renderer.scene, cam);
    gl.render(app.renderer.scene, cam);
    app.renderer.css.render(app.renderer.scene, cam);

    // 还原为合书状态
    this.scenes.forEach((s) => {
      s.popups.forEach((p) => p.setFold(0));
      s.group.visible = false;
    });
    [this.leaf, this.leafB].forEach((l) => {
      l.group.visible = false;
      l.set(0);
    });
    stage.setLift(0);
    wings.setFold(0);
    model.setAngles(-Math.PI, -Math.PI);
    this.root.position.copy(pos);
    this.root.rotation.y = rotY;
  }

  // ---------- 开书：一条连贯的时间线 ----------
  async open() {
    if (this.state !== 'closed' || this.busy) return;
    this.busy = true;
    this.state = 'opening';
    const { app, model, root } = this;
    app.bus.emit('book:opening');
    // 第一页的内容在动画开始前就准备好，动画过程中不再做任何重活
    this.prepareSpread(0);

    const a = { cover: -Math.PI, block: -Math.PI };
    const upd = () => model.setAngles(a.cover, a.block);
    const tl = gsap.timeline();
    // 书本轻轻抬起、摆正，同时滑到画面中央
    tl.to(root.position, { y: this.matTop + 0.18, duration: 0.6, ease: 'sine.out' }, 0)
      .to(root.position, { y: this.matTop, duration: 1.1, ease: 'sine.inOut' }, 0.6)
      .to(root.rotation, { y: 0, duration: 1.4, ease: 'sine.inOut' }, 0)
      .to(root.position, { x: 0, duration: 2.9, ease: 'sine.inOut' }, 0.1)
      .to(this.shadowBlob.scale, { x: 23, y: 15.5, duration: 2.6, ease: 'sine.inOut' }, 0.3)
      // 封面先行，书页紧随其后，形成一个连续的“翻开”动作
      .to(a, { cover: 0, duration: 2.2, ease: 'power2.inOut', onUpdate: upd }, 0.25)
      .to(a, { block: 0, duration: 2.1, ease: 'power2.inOut', onUpdate: upd }, 0.75);
    // 两张扉页跟在书页后面翻过去
    [this.leaf, this.leafB].forEach((leaf, i) => {
      const p = { v: 0 };
      const at = 1.55 + i * 0.25;
      tl.add(() => {
        leaf.setMaps(this.blank, this.blank);
        leaf.set(0);
        leaf.group.visible = true;
      }, at);
      tl.to(p, { v: 1, duration: 1.15, ease: 'sine.inOut', onUpdate: () => leaf.set(p.v) }, at);
      tl.add(() => (leaf.group.visible = false), at + 1.16);
    });
    // 扉页落下的同时，内页立起、纸台升起、城市展开——中间不停顿
    tl.add(this.enterTimeline(0), 2.92);
    app.cam.goto('open', 3.7, 'sine.inOut');
    await done(tl);
    this.state = 'open';
    this.finishEnter(0);
    this.busy = false;
    app.bus.emit('book:opened');
  }

  // ---------- 场景展开 / 收拢 ----------
  /** 切换到第 i 个跨页的内容（此时纸台与内页都还收着，画面上看不到变化） */
  prepareSpread(i) {
    this.index = i;
    this.stage.setGround(this.spreads[i].ground);
    this.scenes.forEach((s, k) => (s.group.visible = k === i));
    this.app.ui.showSpread(i);
  }

  enterTimeline(i) {
    const { stage, wings } = this;
    const tl = gsap.timeline();
    tl.to(wings, { t: 1, duration: 0.95, ease: 'back.out(1.1)', onUpdate: () => wings.setFold(wings.t) }, 0);
    tl.to(stage, { lift: 1, duration: 0.55, ease: 'power2.out', onUpdate: () => stage.setLift(stage.lift) }, 0.1);
    tl.add(this.scenes[i].unfoldTimeline(), 0.3);
    return tl;
  }

  finishEnter(i) {
    this.scenes[i].activate();
    this.app.interaction.enabled = true;
    this.app.bus.emit('spread:entered', i);
  }

  async enterSpread(i) {
    this.prepareSpread(i);
    await done(this.enterTimeline(i));
    this.finishEnter(i);
  }

  async leaveSpread() {
    const { app, stage, wings } = this;
    const scene = this.scenes[this.index];
    app.interaction.enabled = false;
    scene.deactivate();
    app.speech.stop();
    app.ui.closeOverlays();
    const tl = gsap.timeline();
    const fold = scene.foldTimeline();
    tl.add(fold, 0);
    tl.to(wings, { t: 0, duration: 0.6, ease: 'power2.in', onUpdate: () => wings.setFold(wings.t) }, 0.15);
    tl.to(stage, { lift: 0, duration: 0.35, ease: 'power2.in', onUpdate: () => stage.setLift(stage.lift) }, Math.max(fold.duration() - 0.1, 0.3));
    await done(tl);
    scene.group.visible = false;
  }

  async flip(dir, duration = 1.25) {
    const { leaf, model, spreads } = this;
    const i = this.index;
    const p = { v: dir > 0 ? 0 : 1 };
    if (dir > 0) {
      leaf.setMaps(spreads[i].right, spreads[i + 1].leftMirror);
      model.setPrints(null, spreads[i + 1].right);
    } else {
      leaf.setMaps(spreads[i - 1].right, spreads[i].leftMirror);
      model.setPrints(spreads[i - 1].left, null);
    }
    leaf.set(p.v);
    leaf.group.visible = true;
    await done(gsap.to(p, { v: dir > 0 ? 1 : 0, duration, ease: 'sine.inOut', onUpdate: () => leaf.set(p.v) }));
    if (dir > 0) model.setPrints(spreads[i + 1].left, null);
    else model.setPrints(null, spreads[i - 1].right);
    leaf.group.visible = false;
    this.index = i + dir;
  }

  /** 翻到指定跨页（可跨多页，连续翻动） */
  async turnTo(target) {
    if (this.state !== 'open' || this.busy) return false;
    if (target === this.index || target < 0 || target >= this.scenes.length) return false;
    this.busy = true;
    this.app.bus.emit('book:turning', target);
    if (this.app.cam.mode !== 'open') this.app.cam.goto('open', 0.8);
    await this.leaveSpread();
    const steps = Math.abs(target - this.index);
    const dir = Math.sign(target - this.index);
    for (let k = 0; k < steps; k++) await this.flip(dir, steps > 1 ? 0.8 : 1.25);
    await this.enterSpread(target);
    this.busy = false;
    return true;
  }
}
