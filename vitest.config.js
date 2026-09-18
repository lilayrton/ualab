import { defineConfig } from 'vitest/config';

// Los tests corren de forma secuencial y en un solo worker: comparten la base SQLite
// (fileParallelism:false + singleFork). Cada suite usa datos únicos para no pisarse.
export default defineConfig({
    test: {
        environment: 'node',
        globalSetup: ['./test/global-setup.js'],
        setupFiles: ['./test/setup.js'],
        fileParallelism: false,
        pool: 'forks',
        poolOptions: {
            forks: { singleFork: true, isolate: false }
        },
        testTimeout: 20000,
        hookTimeout: 30000
    }
});