import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API berjalan di http://localhost:${PORT}/api/v1`);
});
