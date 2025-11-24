/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a user
       * @example cy.login('12345678901', 'senha123')
       */
      login(cpf: string, senha: string): Chainable<void>
      
      /**
       * Custom command to seed database with test data
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>
    }
  }
}

// Custom login command
Cypress.Commands.add('login', (cpf: string, senha: string) => {
  cy.session([cpf, senha], () => {
    cy.visit('/login')
    cy.get('input[name="cpf"]').type(cpf)
    cy.get('input[name="senha"]').type(senha)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Database seeding command (requires API endpoint)
Cypress.Commands.add('seedDatabase', () => {
  cy.request('POST', '/api/test/seed', {})
})

export {}
