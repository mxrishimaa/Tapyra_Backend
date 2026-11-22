const API = Cypress.config('baseUrl')

Cypress.Commands.add('cadastrarUsuario', (usuario) => {
  return cy.request({
    method: 'POST',
    url: `${API}/auth/cadastro`,
    body: usuario,
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('loginApi', (email, senha) => {
  return cy.request({
    method: 'POST',
    url: `${API}/auth/login`,
    body: { email, senha },
  }).then((res) => {
    expect(res.status).to.eq(200)
    expect(res.body).to.have.property('token')
    return res.body
  })
})








// COMENTÁRIOS ÚTEIS CYPRESS
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })