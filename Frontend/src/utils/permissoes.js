// Todas as regras "quem pode fazer o quê" ficam aqui (docs/TELAS.md, seções 1 e 3).
// As telas só perguntam podeX(usuario, os). O backend continua sendo quem decide (RNF002):
// estas funções servem para esconder o que o papel não pode usar.
//
// usuario = resposta de /auth/me: { id, nomeUsuario, login, cargos[] }
// os      = resposta de GET /os/{id}: { status, prestador: { id }, orcamentos[] ... }

import { CARGOS, STATUS_FINALIZADOS, STATUS_ORCAMENTO, STATUS_OS } from './status'

// ---------- Papéis ----------

export function temCargo(usuario, cargo) {
  return Boolean(usuario?.cargos?.includes(cargo))
}

export function ehAtendente(usuario) {
  return temCargo(usuario, CARGOS.ATENDENTE)
}

export function ehPrestador(usuario) {
  return temCargo(usuario, CARGOS.PRESTADOR)
}

/** O usuário é o prestador responsável pela OS? (o id do prestador é o id do usuário) */
export function ehResponsavel(usuario, os) {
  if (!usuario || !os?.prestador) {
    return false
  }
  return Number(os.prestador.id) === Number(usuario.id)
}

// ---------- Menus e telas ----------

/** Atendente vê todas as OS; quem é só prestador vê só as dele. */
export function podeVerTodasOrdens(usuario) {
  return ehAtendente(usuario)
}

export function podeAbrirOrdem(usuario) {
  return ehAtendente(usuario)
}

export function podeGerenciarClientes(usuario) {
  return ehAtendente(usuario)
}

// ---------- Ações no detalhe da OS (matriz da seção 3 do TELAS.md) ----------

export function ordemFinalizada(os) {
  return STATUS_FINALIZADOS.includes(os?.status)
}

/** Orçamento PENDENTE da OS (no máximo um por vez), ou null. */
export function orcamentoPendente(os) {
  return os?.orcamentos?.find((o) => o.status === STATUS_ORCAMENTO.PENDENTE) || null
}

/** Prestador responsável, OS ABERTA. */
export function podeGerarOrcamento(usuario, os) {
  return ehPrestador(usuario) && ehResponsavel(usuario, os) && os.status === STATUS_OS.ABERTA
}

/** Atendente, OS AGUARDANDO_APROVACAO e com orçamento PENDENTE. Vale para aprovar e recusar. */
export function podeDecidirOrcamento(usuario, os) {
  return (
    ehAtendente(usuario) &&
    os?.status === STATUS_OS.AGUARDANDO_APROVACAO &&
    orcamentoPendente(os) !== null
  )
}

/** Prestador responsável, OS EM_EXECUCAO. */
export function podeRegistrarAndamento(usuario, os) {
  return ehPrestador(usuario) && ehResponsavel(usuario, os) && os.status === STATUS_OS.EM_EXECUCAO
}

/** Atendente, OS PRONTA. */
export function podeConcluirOrdem(usuario, os) {
  return ehAtendente(usuario) && os?.status === STATUS_OS.PRONTA
}

/**
 * Atendente vendo uma OS ainda não PRONTA (e não finalizada): o botão "Concluir" aparece
 * desabilitado com a explicação "O prestador ainda não finalizou o serviço".
 */
export function concluirAguardaPrestador(usuario, os) {
  return ehAtendente(usuario) && !ordemFinalizada(os) && os?.status !== STATUS_OS.PRONTA
}

/** Atendente, qualquer status exceto ENCERRADA e CANCELADA. */
export function podeCancelarOrdem(usuario, os) {
  return ehAtendente(usuario) && Boolean(os) && !ordemFinalizada(os)
}

/** Há alguma ação para mostrar no painel "Ações"? */
export function temAlgumaAcao(usuario, os) {
  return (
    podeGerarOrcamento(usuario, os) ||
    podeDecidirOrcamento(usuario, os) ||
    podeRegistrarAndamento(usuario, os) ||
    podeConcluirOrdem(usuario, os) ||
    podeCancelarOrdem(usuario, os)
  )
}
