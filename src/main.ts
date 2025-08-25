import { createApp } from 'vue';
import App from './App.vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { createMemoryHistory, createRouter } from 'vue-router';
import HomeView from './views/HomeView.vue';
import StatsView from './views/StatsView.vue';
import TimerView from './views/TimerView.vue';
import SettingView from './views/SettingView.vue';
import { createPinia } from 'pinia';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'system',
  },
});

// TODO: unpluginでファイルベースルーティングさせる
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/timer/:seconds/:setCount',
    name: 'timer',
    component: TimerView
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsView
  },
  {
    path: '/setting',
    name: 'setting',
    component: SettingView
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

const pinia = createPinia();

createApp(App)
  .use(vuetify)
  .use(router)
  .use(pinia)
  .mount('#app');
