import { createApp } from 'vue';
import { ElButton, ElProgress } from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';
import App from './App.vue';
import request from './request';

const app = createApp(App);

app.component(ElButton.name, ElButton);
app.component(ElProgress.name, ElProgress);

app.config.globalProperties = {
  request,
}

app.mount('#root');
