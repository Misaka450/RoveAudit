import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 路径别名 @ -> src
    },
  },
  server: {
    port: 5173, // 前端开发服务器端口
    proxy: {
      // 代理配置：将 /api 请求转发到后端 NestJS 服务
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});