import { defineConfig } from 'cypress';

export default defineConfig({
    retries: {
        runMode: 4,
        openMode: 1,
    },
    e2e: {
        baseUrl: 'http://localhost:4200',
        video: false,
        experimentalStudio: true,
    },
});
