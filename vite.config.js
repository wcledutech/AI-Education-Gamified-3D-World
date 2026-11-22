import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 普通构建输出到 dist/；“single” 模式把全部脚本与样式内联成一个可双击打开的 HTML。
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173, host: '127.0.0.1' },
}));
