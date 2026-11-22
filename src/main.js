import './styles/main.css';
import './styles/pages.css';
import { App } from './core/App.js';

const app = new App(document.getElementById('app'));
app.start();
// 便于在浏览器控制台中检查状态（调试用）
window.__helloAI = app;
