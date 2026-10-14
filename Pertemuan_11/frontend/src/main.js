import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router/index.js";
import { pasangAuth } from "./api.js";
import { useAuthStore } from "./stores/auth.js";
import "./style.css";

const pinia = createPinia();
const app = createApp(App).use(pinia).use(router);

// Sambungkan lapisan API ke store sesi:
//   - token dibaca dari store setiap request
//   - 401 pada request ber-token -> logout terpusat + arahkan ke login (membawa tujuan awal)
const auth = useAuthStore(pinia);
pasangAuth({
  token: () => auth.token,
  onTidakSah: () => {
    auth.logout();
    router.push({
      name: "login",
      query: { next: router.currentRoute.value.fullPath, info: "sesi-berakhir" },
    });
  },
});

app.mount("#app");
