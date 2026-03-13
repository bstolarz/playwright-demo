import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

export default defineConfig({
  testDir: './tests',
  reporter: 'html',
  use: {
    headless: false,
    baseURL: 'http://localhost:8080',
    testIdAttribute: 'data-testid-brenda',
    trace: 'on',
    video: 'on'
  },
  projects: [
    {
      name: 'chromium',
      testMatch: 'tests/test-servicios.spec.ts',
      use: { browserName: 'chromium' },
    },
    /*,
    {
       name: 'iPhone',
       testMatch: 'tests/test-servicios.spec.ts',
       use: { ...devices['iPhone 13'], video: 'retain-on-failure'},
    } */
  ],
});

