const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/trump-boyer-cube.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: "iife",
    globalName: "TrumpBoyerCube",
    outfile: "dist/trump-boyer-cube.min.js",
  })
  .catch(() => process.exit(1));

// Also build non-minified version
esbuild
  .build({
    entryPoints: ["src/trump-boyer-cube.js"],
    bundle: true,
    sourcemap: true,
    format: "iife",
    globalName: "TrumpBoyerCube",
    outfile: "dist/trump-boyer-cube.js",
  })
  .then(() => console.log("✅ Build completed successfully"))
  .catch(() => {
    console.error("❌ Build failed");
    process.exit(1);
  });
