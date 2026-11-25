import { describe, expect, it } from 'vitest'
import {
  concluirAguardaPrestador,
  ehResponsavel,
  orcamentoPendente,
  podeAbrirOrdem,
  podeCancelarOrdem,
  podeConcluirOrdem,
  podeDecidirOrcamento,
  podeGerarOrcamento,
  podeGerenciarClientes,
  podeRegistrarAndamento,
  podeVerTodasOrdens,
  temAlgumaAcao,
} from './permissoes'

// Usuários iguais aos de teste do backend (DadosIniciais.java), com ids fictícios.
const atendente = { id: 1, login: 'atendente', cargos: ['ATENDENTE'] }
const prestador = { id: 2, login: 'prestador', cargos: ['PRESTADOR'] }
const prestador2 = { id: 3, login: 'prestador2', cargos: ['PRESTADOR'] }
const autonomo = { id: 4, login: 'autonomo', cargos: ['PRESTADOR', 'ATENDENTE'] }

const TODOS_STATUS = [
  'ABERTA',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'PRONTA',
  'ENCERRADA',
  'CANCELADA',
]

/** OS fictícia: por padrão o responsável é o "prestador" (id 2). */
function criarOs(status, { prestadorId = 2, orcamentos = [] } = {}) {
  return { id: 10, status, prestador: { id: prestadorId, nome: 'X' }, orcamentos }
}

const pendente = { id: 50, status: 'PENDENTE' }
const recusado = { id: 49, status: 'RECUSADO' }

/** Status em que a função devolve true, para um usuário e uma OS montada por status. */
function statusPermitidos(funcao, usuario, opcoes) {
  return TODOS_STATUS.filter((s) => funcao(usuario, criarOs(s, opcoes)))
}

describe('menus por papel (TELAS.md seção 1)', () => {
  it('atendente vê todas as OS, abre OS e gerencia clientes', () => {
    expect(podeVerTodasOrdens(atendente)).toBe(true)
    expect(podeAbrirOrdem(atendente)).toBe(true)
    expect(podeGerenciarClientes(atendente)).toBe(true)
  })

  it('prestador não vê todas, não abre OS e não gerencia clientes', () => {
    expect(podeVerTodasOrdens(prestador)).toBe(false)
    expect(podeAbrirOrdem(prestador)).toBe(false)
    expect(podeGerenciarClientes(prestador)).toBe(false)
  })

  it('usuário com os dois papéis tem a união dos menus', () => {
    expect(podeVerTodasOrdens(autonomo)).toBe(true)
    expect(podeAbrirOrdem(autonomo)).toBe(true)
    expect(podeGerenciarClientes(autonomo)).toBe(true)
  })

  it('sem usuário, nada é permitido', () => {
    expect(podeVerTodasOrdens(null)).toBe(false)
    expect(podeAbrirOrdem(undefined)).toBe(false)
    expect(podeGerenciarClientes({})).toBe(false)
  })
})

describe('ehResponsavel', () => {
  it('compara o id do prestador da OS com o id do usuário', () => {
    expect(ehResponsavel(prestador, criarOs('ABERTA'))).toBe(true)
    expect(ehResponsavel(prestador2, criarOs('ABERTA'))).toBe(false)
  })

  it('aceita ids como texto ou número', () => {
    expect(ehResponsavel({ ...prestador, id: '2' }, criarOs('ABERTA'))).toBe(true)
  })

  it('sem usuário ou sem OS devolve false', () => {
    expect(ehResponsavel(null, criarOs('ABERTA'))).toBe(false)
    expect(ehResponsavel(prestador, null)).toBe(false)
  })
})

describe('Gerar orçamento: prestador responsável, OS ABERTA', () => {
  it('prestador responsável só em ABERTA', () => {
    expect(statusPermitidos(podeGerarOrcamento, prestador)).toEqual(['ABERTA'])
  })

  it('outro prestador nunca', () => {
    expect(statusPermitidos(podeGerarOrcamento, prestador2)).toEqual([])
  })

  it('atendente nunca', () => {
    expect(statusPermitidos(podeGerarOrcamento, atendente)).toEqual([])
  })

  it('autônomo: só quando é o responsável', () => {
    expect(statusPermitidos(podeGerarOrcamento, autonomo, { prestadorId: 4 })).toEqual(['ABERTA'])
    expect(statusPermitidos(podeGerarOrcamento, autonomo, { prestadorId: 2 })).toEqual([])
  })
})

describe('Aprovar/recusar orçamento: atendente, AGUARDANDO_APROVACAO e orçamento PENDENTE', () => {
  const comPendente = { orcamentos: [recusado, pendente] }

  it('atendente só em AGUARDANDO_APROVACAO com orçamento pendente', () => {
    expect(statusPermitidos(podeDecidirOrcamento, atendente, comPendente)).toEqual([
      'AGUARDANDO_APROVACAO',
    ])
  })

  it('sem orçamento pendente, não pode decidir', () => {
    expect(
      podeDecidirOrcamento(atendente, criarOs('AGUARDANDO_APROVACAO', { orcamentos: [recusado] })),
    ).toBe(false)
  })

  it('prestador (mesmo o responsável) nunca', () => {
    expect(statusPermitidos(podeDecidirOrcamento, prestador, comPendente)).toEqual([])
  })

  it('autônomo pode, por ter o cargo de atendente', () => {
    expect(statusPermitidos(podeDecidirOrcamento, autonomo, comPendente)).toEqual([
      'AGUARDANDO_APROVACAO',
    ])
  })

  it('orcamentoPendente devolve o pendente ou null', () => {
    expect(orcamentoPendente(criarOs('AGUARDANDO_APROVACAO', comPendente))).toBe(pendente)
    expect(orcamentoPendente(criarOs('ABERTA', { orcamentos: [recusado] }))).toBe(null)
  })
})

describe('Registrar andamento: prestador responsável, OS EM_EXECUCAO', () => {
  it('prestador responsável só em EM_EXECUCAO', () => {
    expect(statusPermitidos(podeRegistrarAndamento, prestador)).toEqual(['EM_EXECUCAO'])
  })

  it('outro prestador nunca', () => {
    expect(statusPermitidos(podeRegistrarAndamento, prestador2)).toEqual([])
  })

  it('atendente nunca', () => {
    expect(statusPermitidos(podeRegistrarAndamento, atendente)).toEqual([])
  })

  it('autônomo: só quando é o responsável', () => {
    expect(statusPermitidos(podeRegistrarAndamento, autonomo, { prestadorId: 4 })).toEqual([
      'EM_EXECUCAO',
    ])
    expect(statusPermitidos(podeRegistrarAndamento, autonomo, { prestadorId: 2 })).toEqual([])
  })
})

describe('Concluir OS: atendente, OS PRONTA', () => {
  it('atendente só em PRONTA', () => {
    expect(statusPermitidos(podeConcluirOrdem, atendente)).toEqual(['PRONTA'])
  })

  it('prestador nunca', () => {
    expect(statusPermitidos(podeConcluirOrdem, prestador)).toEqual([])
  })

  it('autônomo em PRONTA', () => {
    expect(statusPermitidos(podeConcluirOrdem, autonomo)).toEqual(['PRONTA'])
  })

  it('atendente vê "aguardando prestador" nos status anteriores a PRONTA', () => {
    expect(statusPermitidos(concluirAguardaPrestador, atendente)).toEqual([
      'ABERTA',
      'AGUARDANDO_APROVACAO',
      'EM_EXECUCAO',
    ])
    expect(statusPermitidos(concluirAguardaPrestador, prestador)).toEqual([])
  })
})

describe('Cancelar OS: atendente, qualquer status exceto ENCERRADA/CANCELADA', () => {
  it('atendente nos status não finalizados', () => {
    expect(statusPermitidos(podeCancelarOrdem, atendente)).toEqual([
      'ABERTA',
      'AGUARDANDO_APROVACAO',
      'EM_EXECUCAO',
      'PRONTA',
    ])
  })

  it('prestador nunca', () => {
    expect(statusPermitidos(podeCancelarOrdem, prestador)).toEqual([])
  })

  it('autônomo nos status não finalizados', () => {
    expect(statusPermitidos(podeCancelarOrdem, autonomo)).toEqual([
      'ABERTA',
      'AGUARDANDO_APROVACAO',
      'EM_EXECUCAO',
      'PRONTA',
    ])
  })
})

describe('temAlgumaAcao', () => {
  it('OS finalizada não tem ação para ninguém', () => {
    ;[atendente, prestador, prestador2, autonomo].forEach((u) => {
      expect(temAlgumaAcao(u, criarOs('ENCERRADA'))).toBe(false)
      expect(temAlgumaAcao(u, criarOs('CANCELADA'))).toBe(false)
    })
  })

  it('outro prestador não tem ação em nenhum status', () => {
    expect(statusPermitidos(temAlgumaAcao, prestador2)).toEqual([])
  })

  it('prestador responsável tem ação em ABERTA e EM_EXECUCAO', () => {
    expect(statusPermitidos(temAlgumaAcao, prestador)).toEqual(['ABERTA', 'EM_EXECUCAO'])
  })

  it('autônomo responsável em ABERTA pode gerar orçamento e cancelar', () => {
    const os = criarOs('ABERTA', { prestadorId: 4 })
    expect(podeGerarOrcamento(autonomo, os)).toBe(true)
    expect(podeCancelarOrdem(autonomo, os)).toBe(true)
  })
})
