import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { reactRouterDevTools } from "react-router-devtools"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [reactRouterDevTools(), reactRouter()]
});
