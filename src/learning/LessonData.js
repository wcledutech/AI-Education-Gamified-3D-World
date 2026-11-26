// 教学内容入口：按当前语言提供 COURSE / CONCEPTS / SCENE / SPREADS。
// 这些对象的“身份”始终不变，切换语言时只替换其中的内容，
// 因此其他模块可以一直持有它们的引用（例如 scene.def），自动看到新语言的文字。
// 新增学习场景：在 lesson.zh.js 与 lesson.en.js 的 SCENES 中各加一项，并在这里的 SCENE / SPREADS 中登记。
import * as ZH from './lesson.zh.js';
import * as EN from './lesson.en.js';
import { getLang, onLangChange } from '../utils/i18n.js';

export const COURSE = {};
export const CONCEPTS = {};
export const SCENE = { city: {}, lab: {}, verify: {}, summary: {} };
export const SPREADS = [SCENE.city, SCENE.lab, SCENE.verify, SCENE.summary];

const fill = (target, source) => {
  Object.keys(target).forEach((k) => delete target[k]);
  Object.assign(target, source);
};

export function applyLessonLang(lang = getLang()) {
  const d = lang === 'en' ? EN : ZH;
  fill(COURSE, d.COURSE);
  fill(CONCEPTS, d.CONCEPTS);
  Object.keys(SCENE).forEach((k) => fill(SCENE[k], d.SCENES[k]));
}

applyLessonLang();
onLangChange(applyLessonLang);
