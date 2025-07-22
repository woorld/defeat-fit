import { createApp } from 'vue';
import App from './App.vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { createMemoryHistory, createRouter } from 'vue-router';
import HomeView from './views/HomeView.vue';
import SettingView from './views/SettingView.vue';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'system',
  },
});

const routes = [
  { path: '/', component: HomeView },
  { path: '/setting', component: SettingView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app');
