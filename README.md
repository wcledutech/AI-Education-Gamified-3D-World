# Hello, AI！走进人工智能的世界

一本可以真实打开、连续翻页、立体展开的 **3D 互动立体纸艺人工智能通识教材**（面向初中七年级，40—45 分钟）。

学习路径：**认识 AI（AI 智慧城市）→ 理解 AI（AI 训练实验室）→ 判断 AI（AI 判断中心）→ 我的 AI 探索报告**

---

## 一、怎样打开

| 方式 | 做法 | 适合 |
|---|---|---|
| 在线访问 | 打开下面的在线地址 | 发链接给别人 |
| 单文件 | 执行 `npm run build:single`，得到 `dist-single/index.html`，这一个文件可以改名后发给别人，双击即可打开 | 断网演示、发文件 |
| 本地开发 | 在本目录执行 `npm install`，然后 `npm run dev` | 修改内容后预览 |

**在线地址**：<https://wcledutech.github.io/AI-Education-Gamified-3D-World/>

由本仓库的 `gh-pages` 分支通过 GitHub Pages 发布，`main` 分支是源代码。更新线上版本：修改并提交后执行 `npm run deploy`，它会重新构建并把 `dist/` 推送到 `gh-pages` 分支。旧地址 <https://wcledutech.github.io/hello-ai/> 会自动跳转到这里。

构建命令：

```bash
npm run build          # 生成 dist/（需放到任意静态服务器上访问）
npm run build:single   # 生成 dist-single/index.html（单个文件，可直接双击打开）
npm run deploy         # 重新构建并发布到 GitHub Pages（gh-pages 分支）
npm run preview        # 本地预览 dist/
```

环境要求：Node.js 18 及以上；浏览器建议使用新版 Chrome 或 Edge（需要 WebGL）。

---

## 二、怎样使用

- **打开书本**：点击封面。书本抬起、封面与书页翻开、立体场景从纸页中升起。
- **观察**：按住鼠标拖动旋转视角，滚轮缩放。底部控制栏可以“重置视角”“旋转视角”“专注实验”。
- **阅读**：左页是知识探索，右页是学习实验与反馈。页面右上角的 ⤢ 可把这一页放大到眼前。
- **互动**：点击立体场景里的人物（对话与朗读）和设备（查看原理）；点击左页的重点概念展开说明卡。
- **翻页**：完成当前页的全部任务后，下一页自动解锁；也可以用键盘 ← →。
- **教师模式**：“学习帮助”里可以勾选“教师模式”，解锁全部页面，方便课堂演示。
- **记录**：“探索记录”里可以查看并导出学习记录（JSON / 文本）。进度保存在本机浏览器的 LocalStorage。

---

## 三、三个场景做了什么

### 1. AI 智慧城市——人工智能在哪里？
- 7 种可点击的三维设备：智能音箱、定时台灯、图像识别站、人脸识别门禁、自动驾驶汽车、智能交通信号灯、光控路灯（其中 2 种是“规则控制”而不是人工智能）。
- 每种设备点击后播放一段“输入 → 处理 → 输出”的三维演示。
- 任务：预测 → 判断至少 4 种设备的主要工作方式（解释性反馈）→ 输入 / 处理 / 输出拖放匹配 → 对照预测做小结。

### 2. AI 训练实验室——人工智能怎样学会识别？（核心）
- 学生亲手给 20 张训练图片标注“猫 / 狗”，卡片会飞入三维收纳盒。
- 点击“开始训练”后，在浏览器里**真实训练**一个小型卷积神经网络；主机屏幕上的轮数、损失、正确率和损失曲线都是训练过程返回的真实数值。
- 用 10 张**从不参与训练**的测试图片检验模型，显示预测类别、置信度、实际类别和是否正确。
- 对比实验 A（均衡数据）/ B（类别不均衡）/ C（含错误标签），用同一组测试图片比较；结果完全由算法运行决定，没有写死任何结论。

### 3. AI 判断中心——人工智能说的都对吗？
- 三个预先审核的本地案例：基本正确的回答、包含事实错误的回答、证据不足却说得过于肯定的回答。
- 任务：记录第一印象 → 点击关键主张、选择相关证据并判断“支持 / 不支持 / 证据不足” → 修改有问题的回答 → 四个日常情境的合理使用判断。
- 三维场景里的信息展示屏、证据卡和事实判断仪表会随操作变化。

### 4. 我的 AI 探索报告
- 汇总三个场景的完成情况、五项学习表现、模型训练与测试结果、信息核验情况；可填写开放性反思并导出。

---

## 四、关于机器学习实验（重要说明）

| 项目 | 实现 |
|---|---|
| 框架 | TensorFlow.js（优先 WebGL 后端，不可用时自动改用 CPU 后端） |
| 数据 | 30 张 128×128 的猫 / 狗**纸艺风插画**，由 `src/ml/SampleArt.js` 用代码绘制（毛色、姿态、耳朵、花纹、背景、位置各不相同）。训练池 20 张（猫 10、狗 10），测试集 10 张（猫 5、狗 5），测试集含 2 张“不典型”样本 |
| 模型输入 | 缩小为 32×32 的 RGB 像素 |
| 模型 | 卷积(8, 5×5, 步长 2) → 卷积(16, 3×3) → 最大池化 → Dropout → 全连接(16) → Softmax(2)，每次都从随机初始值开始训练 |
| 训练 | Adam 优化器，44 轮；每张图做 6 种数据增强（水平翻转、小幅平移、随机通道增益、灰度、通道轮换） |
| 用时 | WebGL 后端约 10 秒；CPU 后端约 30 秒 |

需要知道的事实：

- **样本图不是照片。** 为了让项目自带全部数据、没有版权和外部链接依赖，猫狗图片是程序绘制的插画。如需换成真实照片，可改写 `DatasetManager.js` 让它从 `public/datasets/` 读取图片。
- **结果会波动。** 样本只有 20 张，每次训练的随机起点不同。开发时用最终设置在同一组 10 张测试图上做了 9 次试验：均衡且标注正确的数据 5 次，分别为 10、9、9、10、10；只保留 2 张狗 2 次，均为 7/10（5 张狗只判对 2 张）；随机改错 6 个标签 2 次，分别为 8/10 和 6/10。试验次数不多，实际课堂上仍可能出现不同的结果——这正是可以和学生讨论的现象。
- **模型不保存。** 训练出的模型只在浏览器内存中，刷新页面后需要重新训练；训练记录和测试结果会保存。
- 浏览器不支持训练时会显示明确的错误信息，不会伪造成功结果。

---

### 关于语音

- 人物台词是用开源模型 **MeloTTS** 预先合成的女声，打包在课本里，任何浏览器、断网时都能播放。
- 重新生成（例如改了台词）：
  1. 新建一个工具文件夹，在里面执行 `npm install sherpa-onnx-node @breezystack/lamejs`；
  2. 下载并解压模型 `vits-melo-tts-zh_en`（约 167 MB，地址写在 `tools/make-voice.mjs` 开头）；
  3. 在本目录执行 `node tools/make-voice.mjs <工具文件夹> <模型文件夹>`，然后重新构建。
- 没有预录音频的文字会使用浏览器语音。用 **Edge** 打开时会自动选用更自然的在线语音（如 Xiaoxiao）。

---

## 五、项目结构

```
hello-ai/
├── index.html
├── package.json / vite.config.js
├── src/
│   ├── main.js
│   ├── styles/            main.css（外壳） pages.css（左右内页）
│   ├── core/              App.js  Renderer.js  CameraManager.js  BookController.js  Interaction.js
│   ├── book/              BookModel.js（精装书） PageModel.js（弯曲翻页） PopUp.js（折叠机构 / 纸台 / 立页） SpreadTextures.js（书页印刷）
│   ├── scenes/            BaseScene.js  SmartCityScene.js  AITrainingScene.js  AIVerificationScene.js  SummaryScene.js
│   ├── characters/        CharacterFactory.js（学生 / 教师 / 机器人）
│   ├── learning/          LessonData.js（全部教学内容） LearningProgress.js（进度保存） Assessment.js（评价与导出）
│   ├── ml/                SampleArt.js  DatasetManager.js  ModelTrainer.js  ModelEvaluator.js
│   ├── ui/                UI.js（控制栏 / 弹层） SceneUI.js（任务步骤基类） CityUI.js  LabUI.js  VerifyUI.js  SummaryUI.js
│   ├── assets/audio/      37 段预先合成的人物台词（MP3）与 manifest.json
│   └── utils/             config.js  three-helpers.js  Speech.js  frame.js
├── tools/                 make-voice.mjs（重新合成台词音频） deploy.mjs（发布到 GitHub Pages）
└── docs/测试记录.md
```

说明：提示词建议的 `TaskManager.js` 的职责（任务步骤、解锁条件、反馈）由 `ui/SceneUI.js` 及各场景界面类承担；`SceneManager.js` 的职责合并进了 `core/BookController.js` 与 `core/App.js` 的场景注册表。

### 增加第四、第五个学习场景
1. 在 `learning/LessonData.js` 的 `SPREADS` 中追加一个场景定义（标题、概念、人物、台词、步骤）。
2. 新建 `scenes/XxxScene.js`（继承 `BaseScene`，实现 `build()` 与 `drawGround()`）和 `ui/XxxUI.js`（继承 `SceneUI`）。
3. 在 `core/App.js` 的 `REGISTRY` 中登记，并在 `LearningProgress.js` 中补充该场景的初始状态与解锁条件。

---

## 六、技术要点

- **Three.js**：书本、场景、人物、设备、光照与阴影全部用几何体程序化建模，没有外部模型或图片文件。
- **GSAP**：开书、翻页、纸艺展开与人物动作。
- **CSS3DRenderer**：左右内页是真实 HTML（文字清晰、可滚动、可输入），贴在三维“立页”上，随视角一起转动。
- **立体机构**：建筑和人物用“平行四边形折叠”压平到纸页；纸台升降；翻页的纸张带弯曲。
- **Raycaster**：人物、设备、样本卡片的点击与悬停轮廓。
- **语音**：37 句人物台词已预先合成为自然人声（`src/assets/audio/*.mp3`，离线可用，播放、停止、重播、总开关，翻页自动停止）；找不到对应音频时退回浏览器的 Web Speech API。
- **LocalStorage**：三个场景各自独立的学习状态与探索记录。

---

## 七、已知限制

1. 模型与设备采用程序化的低多边形纸艺风格，没有使用 GLTF/GLB 外部模型；没有做镜头景深后期（避免影响文字清晰度）。
2. 书脊在展开时用“倾倒并收短”的方式简化处理，没有做布面弯曲。
3. 立体场景中没有实现直接拖动三维样本卡片；拖放在右页的图片与按钮之间进行，也可以点击操作。
4. 主要面向桌面浏览器；窗口较窄时内页文字会变小，可用 ⤢ 放大。未针对手机触屏做专门适配。
5. 人物台词使用同一位合成女声，学生和机器人通过略微升调来区分，不是不同的配音演员。修改台词文字后需要重新运行 `tools/make-voice.mjs` 生成音频，否则该句会退回浏览器自带的语音。
6. 案例 C 的证据卡为教学用模拟资料（界面中已标明）。

## 八、资源与许可

- 代码依赖：three（MIT）、gsap（标准免费许可）、@tensorflow/tfjs（Apache-2.0）、vite（MIT）。
- 所有贴图、样本图片、模型均由本项目代码生成，不包含第三方素材。
- 人物台词音频由开源语音合成模型 MeloTTS（中英混合，MIT 许可）经 sherpa-onnx（Apache-2.0）在本机离线合成，属于 AI 合成语音。
