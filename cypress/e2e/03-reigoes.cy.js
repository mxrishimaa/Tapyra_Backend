describe('03 - Regiões', () => {
  it('GET /regioes deve listar o catálogo', () => {
    cy.request('/regioes').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.regioes || res.body).to.exist
    })
  })
})