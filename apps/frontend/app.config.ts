import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";

const app = await defineConfig({
  server: {
    experimental: {
      websocket: true,
    },
  },
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
  },
});

app.addRouter({
  name: "websocket",
  type: "http",
  handler: "./src/websocket.ts",
  target: "server",
  base: "/ws",
});

export default app;
