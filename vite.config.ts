import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { UPLOAD_PROXY } from './src/constants';
// import styleImport from 'vite-plugin-style-import';

export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    proxy: {
      [UPLOAD_PROXY]: {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: path => path.replace(new RegExp(`\\${UPLOAD_PROXY}`), ''),
      }
    }
  }
})
