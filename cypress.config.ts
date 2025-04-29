// cypress.config.ts (Using CommonJS syntax)

// Use require instead of import for defineConfig
const { defineConfig } = require('cypress');

// Use module.exports instead of export default
module.exports = defineConfig({
  // Your E2E configuration options go here
  e2e: {
    // Recommended: Set your development server URL
    baseUrl: 'http://localhost:5173', // Adjust port if needed

    // Setup Node events (optional, but often needed for tasks like DB seeding or mocking)
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // Example: require('./cypress/plugins/index.js')(on, config)
      // return config;
    },

    // Other e2e options...
    // supportFile: 'cypress/support/e2e.js', // Default
    // specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', // Default
  },

  // Component testing configuration (if you use it)
  // component: {
  //   devServer: {
  //     framework: 'react',
  //     bundler: 'vite',
  //   },
  // },

  // Other global Cypress options...
  // projectId: "your-project-id", // If using Cypress Cloud
  // viewportWidth: 1280,
  // viewportHeight: 720,
});
