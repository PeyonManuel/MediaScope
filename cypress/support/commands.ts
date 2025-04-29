// cypress/support/commands.ts

/// <reference types="cypress" />
// --- END WORKAROUND ---

// Add type definitions for the new command
declare global {
  namespace Cypress {
    // Use Cypress.Chainable to be explicit after importing
    interface Chainable {
      /**
       * Custom command to log in via UI.
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password?: string): Cypress.Chainable; // Use explicit Cypress.Chainable
    }
  }
}

Cypress.Commands.add('login', (email, password = '123456') => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/');
      cy.contains('a', 'Login').click();

      cy.get('#email-address').should('be.visible').type(email);
      cy.get('#password').should('be.visible').type(password);
      cy.get('[type="submit"]').should('be.visible').as('submitBtn');
      cy.get('@submitBtn').click();
      cy.get('@submitBtn').should('be.disabled');

      cy.contains('h2', 'Popular Movies');
      cy.log(`User ${email} logged in successfully via UI`);
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});

export {};
