import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/index.html", component: "index" },
  ],
  npmClient: 'pnpm',
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
});
