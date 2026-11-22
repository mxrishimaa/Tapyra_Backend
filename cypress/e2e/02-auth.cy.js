describe('02 - Autenticação', () => {
  const email = `teste.cypress.${Date.now()}@tapyra.com`
  const senha = 'senha12345'
  const nome = 'Usuario Cypress API'

  it('deve cadastrar um novo usuário', () => {
    cy.request({
      method: 'POST',
      url: '/auth/cadastro',
      body: {
        nome,
        email,
        senha,
        telefone: '9299990000',
        aceitaWhatsapp: false,
      },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201])
      expect(res.body).to.have.property('token')
      expect(res.body).to.have.property('usuario')
    })
  })

  it('deve fazer login e obter token', () => {
    cy.request({
      method: 'POST',
      url: '/auth/login',
      body: { email, senha },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.token).to.be.a('string')
      Cypress.env('token', res.body.token)
    })
  })

  it('GET /auth/me com token deve retornar o usuário', () => {
    cy.request({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.usuario || res.body).to.exist
    })
  })

  it('login com senha errada deve falhar', () => {
    cy.request({
      method: 'POST',
      url: '/auth/login',
      body: { email, senha: 'errada99999' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401])
    })
  })
})