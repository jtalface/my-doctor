import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'happy-dom', // Fast DOM implementation (alternative: 'jsdom')
    
    // Global test utilities
    globals: true, // Use describe, it, expect without importing
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/types/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.config.{ts,js}',
      ],
      // Coverage thresholds (will fail if below)
      thresholds: {
        lines: 0,      // Start at 0, increase gradually
        branches: 0,
        functions: 0,
        statements: 0,
      },
    },
    
    // Include/exclude patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Test timeout
    testTimeout: 10000, // 10 seconds
    
    // Reporter
    reporters: ['verbose'],
    
    // Watch mode (for development)
    watch: false,
    
    // Mock reset behavior
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  
  // Path aliases (match tsconfig.json)
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@auth': path.resolve(__dirname, './src/auth'),
    },
  },
});

