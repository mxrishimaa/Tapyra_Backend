const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // Troque se for testar só no Railway:
    // baseUrl: 'https://tapyrabcknd.up.railway.app',
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    screenshotOnRunFailure: true,
  },
})