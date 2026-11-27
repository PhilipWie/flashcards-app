import react from '@vitejs/plugin-react'
// defineConfig from vitest/config: same as vite's, plus the "test" section
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // simulated browser (DOM, localStorage) for components and lib/settings.ts
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
