import app from "./app";
import { config } from "./config";

// ── Start ───────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 Server running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}\n`);
});
