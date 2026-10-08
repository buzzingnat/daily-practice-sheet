import * as esbuild from 'esbuild';
import * as fs from 'fs';

// Native cross-platform copy command using built-in Node.js
function copyPublicFolder() {
  try {
    // Recursively copies everything from public/ into dist/
    fs.cpSync('./public', './dist', { recursive: true });
    console.log('Public assets synchronized cleanly.');
  } catch (err) {
    console.error('Error copying assets:', err);
  }
}

// Ensure the dist folder exists and copy initial assets
fs.mkdirSync('./dist', { recursive: true });
copyPublicFolder();

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  sourcemap: true,
  plugins: [
    {
      name: 'watch-public',
      setup(build) {
        build.onEnd(() => {
          copyPublicFolder();
        });
      },
    }
  ]
};

if (isWatch) {
  const context = await esbuild.context(config);
  await context.watch();
  console.log('esbuild is watching for changes...');
} else {
  await esbuild.build(config);
  console.log('Production build complete!');
}
