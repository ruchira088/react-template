import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import { reactRouterDevTools } from "react-router-devtools"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), reactRouterDevTools(), reactRouter()]
});
