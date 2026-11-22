// 渲染器：WebGL（三维书本与场景）+ CSS3D（贴在立起内页上的教材界面）、桌面环境与光照。
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { COLORS } from '../utils/config.js';
import { makeCanvas, canvasTex } from '../utils/three-helpers.js';

export class Renderer {
  constructor(container) {
    this.container = container;
    const webgl = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    webgl.shadowMap.enabled = true;
    webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    webgl.outputColorSpace = THREE.SRGBColorSpace;
    webgl.toneMapping = THREE.NoToneMapping;
    webgl.domElement.className = 'webgl-layer';
    this.webgl = webgl;

    this.css = new CSS3DRenderer();
    this.css.domElement.className = 'css3d-layer';

    container.append(webgl.domElement, this.css.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#EADFCB');
    this.scene.fog = new THREE.Fog('#EADFCB', 46, 86);

    this.buildLights();
    this.buildDesk();
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight('#FFF6E6', '#C9B899', 1.75);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#FFF0DA', 1.75);
    sun.position.set(-9, 19, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -15;
    c.right = 15;
    c.top = 13;
    c.bottom = -13;
    c.near = 2;
    c.far = 50;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    const fill = new THREE.DirectionalLight('#E3ECF2', 0.42);
    fill.position.set(12, 8, 6);
    this.scene.add(fill);
  }

  buildDesk() {
    // 浅橡木桌面：程序化木纹
    const wc = makeCanvas(1024, 1024);
    const ctx = wc.getContext('2d');
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(0, 0, 1024, 1024);
    const planks = 4;
    for (let i = 0; i < planks; i++) {
      const y = (i * 1024) / planks;
      ctx.fillStyle = ['rgba(255,240,215,0.10)', 'rgba(120,80,40,0.05)', 'rgba(255,240,215,0.04)', 'rgba(120,80,40,0.08)'][i];
      ctx.fillRect(0, y, 1024, 1024 / planks);
      ctx.fillStyle = 'rgba(110,75,40,0.28)';
      ctx.fillRect(0, y, 1024, 2);
    }
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const y = rnd() * 1024;
      ctx.strokeStyle = `rgba(${120 + rnd() * 40},${82 + rnd() * 30},${44 + rnd() * 20},${0.05 + rnd() * 0.09})`;
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const a = 2 + rnd() * 5;
      const f = 0.004 + rnd() * 0.006;
      const ph = rnd() * 6.28;
      for (let x = 0; x <= 1024; x += 32) ctx.lineTo(x, y + Math.sin(x * f + ph) * a);
      ctx.stroke();
    }
    const woodTex = canvasTex(wc);
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(5, 5);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.78 }));
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    this.scene.add(desk);

    // 鼠尾草绿桌垫：圆角 + 细织纹 + 缝线
    const mw = 27;
    const md = 17.5;
    const mc = makeCanvas(1080, 700);
    const m = mc.getContext('2d');
    m.fillStyle = COLORS.mat;
    m.fillRect(0, 0, 1080, 700);
    for (let i = 0; i < 9000; i++) {
      m.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(40,60,45,0.05)';
      m.fillRect(rnd() * 1080, rnd() * 700, 1 + rnd() * 2, 1);
    }
    m.strokeStyle = 'rgba(245,250,240,0.55)';
    m.lineWidth = 2;
    m.setLineDash([9, 7]);
    m.strokeRect(16, 16, 1048, 668);
    const shape = new THREE.Shape();
    const r = 0.5;
    const hx = mw / 2;
    const hz = md / 2;
    shape.moveTo(-hx + r, -hz);
    shape.lineTo(hx - r, -hz);
    shape.quadraticCurveTo(hx, -hz, hx, -hz + r);
    shape.lineTo(hx, hz - r);
    shape.quadraticCurveTo(hx, hz, hx - r, hz);
    shape.lineTo(-hx + r, hz);
    shape.quadraticCurveTo(-hx, hz, -hx, hz - r);
    shape.lineTo(-hx, -hz + r);
    shape.quadraticCurveTo(-hx, -hz, -hx + r, -hz);
    const mg = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false, curveSegments: 6 });
    // 把挤出体的 UV（形状坐标）归一化到 0..1
    const uv = mg.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / mw + 0.5, uv.getY(i) / md + 0.5);
    const matTex = canvasTex(mc);
    const matMesh = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.96 }));
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.y = 0;
    matMesh.receiveShadow = true;
    matMesh.castShadow = true;
    this.scene.add(matMesh);
    this.matTop = 0.06;

    // 书本下方的柔和接触阴影
    const sc = makeCanvas(256, 256);
    const s = sc.getContext('2d');
    const g = s.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, 'rgba(45,40,30,0.55)');
    g.addColorStop(0.6, 'rgba(45,40,30,0.22)');
    g.addColorStop(1, 'rgba(45,40,30,0)');
    s.fillStyle = g;
    s.fillRect(0, 0, 256, 256);
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: canvasTex(sc), transparent: true, depthWrite: false, opacity: 0.8 })
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = this.matTop + 0.004;
    blob.scale.set(13, 15, 1);
    this.scene.add(blob);
    this.contactShadow = blob;

    // 远处的暖色墙面，给画面一个安静的地平线
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(260, 60), new THREE.MeshBasicMaterial({ color: '#EFE6D5', fog: true }));
    wall.position.set(0, 26, -62);
    this.scene.add(wall);
  }

  resize(w, h) {
    this.webgl.setSize(w, h);
    this.css.setSize(w, h);
  }

  render(camera) {
    this.webgl.render(this.scene, camera);
    this.css.render(this.scene, camera);
  }
}
