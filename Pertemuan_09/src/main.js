import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router/index.js";
import "./style.css";

createApp(App)
  .use(createPinia()) // Pinia HARUS terpasang sebelum guard router memakai store
  .use(router)
  .mount("#app");
