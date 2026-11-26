// 全局尺寸与配色。所有三维尺寸使用同一套“书本单位”。
import { isEn } from './i18n.js';

export const COLORS = {
  cover: '#E8C86A',
  coverDark: '#C9A84B',
  paper: '#F7F2E6',
  paperShade: '#EDE6D4',
  mat: '#A3B5A1',
  wood: '#D6B894',
  ink: '#34434A',
  inkSoft: '#5E6E75',
  tech: '#87B5C9',
  techDark: '#5F93AB',
  coral: '#E6A18C',
  coralDark: '#C9806A',
  mint: '#B8D6BF',
  mintDark: '#7FAF8C',
  sand: '#E9DCC2',
  cream: '#FBF8F0',
  warmGray: '#CFC8BA',
  mustard: '#D9B24C',
  green: '#8FAE8B',
  greenDark: '#6F8F7A',
  brown: '#A9825E',
  road: '#B9B6AE',
};

export const BOOK = { W: 9.0, D: 11.0, COVER: 0.14, OV: 0.22, T: 0.9 };
export const PAGE_TOP = BOOK.COVER + BOOK.T / 2; // 展开后纸页表面高度

// 中央立体舞台（跨越书脊的纸艺平台）
// UX/UZ：场景内部使用的坐标范围；K：整体放大倍数；SX/SZ：纸台在书页上的实际尺寸
export const STAGE = { UX: 7.6, UZ: 7.4, K: 1.08, SX: 7.6 * 1.08, SZ: 7.4 * 1.08, CZ: -0.9, LIFT: 0.2, TH: 0.06 };

// 左右“立起的内页”——知识页与实验页
export const WING = { W: 4.8, H: 7.0, X: 6.55, Z: 2.7, YAW: 0.2, LEAN: 0.44, TH: 0.07 };

// 画布文字用的字体。它们是带 toString 的对象：写进 ctx.font 模板字符串时，会按当前语言给出字体。
const font = (zh, en) => ({ toString: () => (isEn() ? en : zh) });
export const FONT_CN = font('"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans GB",sans-serif', '"Segoe UI","Helvetica Neue",Arial,sans-serif');
export const FONT_KAI = font('"KaiTi","STKaiti","Kaiti SC","Noto Serif SC",serif', 'Cambria,"Palatino Linotype","Book Antiqua",Georgia,serif');
export const FONT_SERIF = 'Georgia,"Times New Roman","Noto Serif SC","Songti SC",serif';
