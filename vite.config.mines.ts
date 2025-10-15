import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/mines/src/index.js"),
      name: "MinesGame",
      formats: ["es", "umd"],
      fileName: (format) =>
        format === "umd" ? "mines-game.umd.js" : "mines-game.js",
    },
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
