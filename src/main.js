import './styles/main.css';
import './styles/pages.css';
import { setLang, detectLang } from './utils/i18n.js';
import { App } from './core/App.js';

// 先确定语言（网址参数 ?lang=en > 上次的选择 > 浏览器语言），再创建应用
setLang(detectLang(), { save: false });

const app = new App(document.getElementById('app'));
app.start();
// 便于在浏览器控制台中检查状态（调试用）
window.__helloAI = app;
