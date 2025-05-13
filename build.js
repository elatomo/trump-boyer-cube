const esbuild = require("esbuild");

// Common options
const commonOptions = {
  entryPoints: ["src/trump-boyer-cube.js"],
  bundle: true,
  sourcemap: true,
};

// Build minified IIFE version
esbuild
  .build({
    ...commonOptions,
    minify: true,
    format: "iife",
    outfile: "dist/trump-boyer-cube.min.js",
  })
  .catch(() => process.exit(1));

// Build non-minified IIFE version
esbuild
  .build({
    ...commonOptions,
    format: "iife",
    outfile: "dist/trump-boyer-cube.js",
  })
  .catch(() => process.exit(1));

// Build ESM version
esbuild
  .build({
    ...commonOptions,
    format: "esm",
    outfile: "dist/trump-boyer-cube.esm.js",
  })
  .then(() => console.log("✅ Build completed successfully"))
  .catch(() => {
    console.error("❌ Build failed");
    process.exit(1);
  });
