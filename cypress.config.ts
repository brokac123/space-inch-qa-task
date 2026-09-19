import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

// Load local settings from .env (CI provides them as real environment variables instead)
dotenv.config({ quiet: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'GSRI API Test Report',
    charts: true,
    embeddedScreenshots: false,
    inlineAssets: true, // single self-contained HTML file, easy to share as a CI artifact
  },
  video: false,
  screenshotOnRunFailure: false, // API-only suite - screenshots add no value
  e2e: {
    baseUrl: requireEnv('BASE_URL'),
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    expose: {
      firstNameLetter: requireEnv('FIRST_NAME_LETTER'),
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});
