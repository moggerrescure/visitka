import { defineConfig } from 'vite';

export default defineConfig({
  // The base path for GitHub pages is typically the repository name if deploying to a project page.
  // We can default it to /WorkoutTracker/ or ./ for relative paths. Let's use relative paths to ensure it works anywhere.
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});
