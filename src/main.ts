import { createApp } from 'vue';
import App from '@src/App.vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { createMemoryHistory, createRouter } from 'vue-router';
import HomeView from '@src/views/home/HomeView.vue';
import TimerView from '@src/views/timer/TimerView.vue';
import MenuView from '@src/views/menu/MenuView.vue';
import MenuEditView from '@src/views/menu/edit/MenuEditView.vue';
import MenuPresetView from '@src/views/menu/preset/MenuPresetView.vue';
import StatsView from '@src/views/stats/StatsView.vue';
import SettingView from '@src/views/setting/SettingView.vue';
import AboutView from '@src/views/about/AboutView.vue';
import { createPinia } from 'pinia';

const colorTheme = await window.setting.getSetting('colorTheme');
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: colorTheme ?? 'system',
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
    path: '/menu',
    name: 'menu',
    component: MenuView,
    children: [
      { path: 'edit', component: MenuEditView },
      { path: 'preset', component: MenuPresetView },
    ],
  },
  {
    path: '/menu-edit',
    name: 'menu-edit',
    component: MenuEditView
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
  {
    path: '/about',
    name: 'about',
    component: AboutView
  }
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
