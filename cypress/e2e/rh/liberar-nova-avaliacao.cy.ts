/**
 * Teste E2E: RH libera nova avaliação
 * Item 18: RH libera → nova avaliação aparece
 */

describe('RH - Liberar Nova Avaliação', () => {
  const rhCPF = '99999999999'
  const rhSenha = 'senhaRH123'
  const funcionarioCPF = '12345678901'
  const funcionarioSenha = 'senha123'

  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('deve permitir RH fazer login', () => {
    cy.visit('/login')
    cy.get('input[name="cpf"]').type(rhCPF)
    cy.get('input[name="senha"]').type(rhSenha)
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/rh')
    cy.contains(/dashboard|gerenciar|liberar/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve exibir opção de liberar avaliações no dashboard do RH', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    cy.contains(/liberar/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve permitir liberar avaliações em massa', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    // Clicar em liberar avaliações
    cy.contains(/liberar/i).click()

    // Deve haver opção de selecionar empresa
    cy.get('select[name="empresa"]', { timeout: 5000 }).should('exist')

    // Selecionar empresa
    cy.get('select[name="empresa"]').select('1')

    // Clicar em confirmar liberação
    cy.contains('button', /confirmar|liberar/i).click()

    // Deve exibir mensagem de sucesso
    cy.contains(/sucesso|criadas/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve permitir liberar para níveis específicos', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    cy.contains(/liberar/i).click()

    // Selecionar empresa
    cy.get('select[name="empresa"]').select('1')

    // Selecionar nível
    cy.get('select[name="nivel"]', { timeout: 5000 }).select('2')

    cy.contains('button', /confirmar|liberar/i).click()

    cy.contains(/sucesso|criadas/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve exibir número de avaliações criadas após liberação', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    cy.contains('button', /confirmar|liberar/i).click()

    // Deve exibir quantas foram criadas
    cy.contains(/\d+ avaliações? criadas?/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve fazer avaliação aparecer no dashboard do funcionário após liberação', () => {
    // 1. RH libera avaliação
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')
    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    cy.contains('button', /confirmar|liberar/i).click()
    cy.contains(/sucesso|criadas/i, { timeout: 10000 }).should('be.visible')

    // 2. Logout do RH
    cy.clearCookies()

    // 3. Funcionário faz login
    cy.login(funcionarioCPF, funcionarioSenha)
    cy.visit('/dashboard')

    // 4. Nova avaliação deve aparecer
    cy.contains(/iniciar avaliação/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve permitir múltiplas liberações', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    // Primeira liberação
    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    cy.contains('button', /confirmar|liberar/i).click()
    cy.contains(/sucesso|criadas/i, { timeout: 10000 }).should('be.visible')

    // Voltar
    cy.visit('/rh')

    // Segunda liberação
    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    cy.contains('button', /confirmar|liberar/i).click()
    cy.contains(/sucesso|criadas/i, { timeout: 10000 }).should('be.visible')
  })

  it('deve validar que apenas RH pode liberar avaliações', () => {
    // Funcionário tenta acessar página de RH
    cy.login(funcionarioCPF, funcionarioSenha)
    cy.visit('/rh', { failOnStatusCode: false })

    // Deve ser bloqueado ou redirecionado
    cy.url({ timeout: 5000 }).should('not.include', '/rh')
  })

  it('deve exibir histórico de liberações', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    // Liberar uma avaliação
    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    cy.contains('button', /confirmar|liberar/i).click()
    cy.contains(/sucesso/i, { timeout: 10000 }).should('be.visible')

    // Voltar para dashboard
    cy.visit('/rh')

    // Deve haver algum histórico ou contagem
    cy.contains(/histórico|liberações|avaliações/i).should('be.visible')
  })

  it('deve permitir liberar para toda a empresa', () => {
    cy.login(rhCPF, rhSenha)
    cy.visit('/rh')

    cy.contains(/liberar/i).click()
    cy.get('select[name="empresa"]').select('1')
    
    // Não selecionar nível (ou selecionar "Todos")
    // Isso deve liberar para todos os funcionários

    cy.contains('button', /confirmar|liberar/i).click()
    
    cy.contains(/sucesso/i, { timeout: 10000 }).should('be.visible')
    // Deve mostrar que criou para múltiplos funcionários
    cy.contains(/\d+/, { timeout: 5000 }).should('be.visible')
  })
})
