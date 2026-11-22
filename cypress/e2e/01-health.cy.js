describe('01 - Health e documentação', () => {
  it('GET /health deve retornar ok', () => {
    cy.request('/health').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.deep.equal({ ok: true })
    })
  })

  it('GET /docs deve responder (Swagger)', () => {
    cy.request('/docs/').its('status').should('be.oneOf', [200, 301, 302])
  })
})