import { montarQuery, requisicao } from './client'

// Ordens de serviço, orçamentos, andamento e encerramento. Formatos em docs/API.md e
// docs/NOTAS_BACKEND.md.

/** GET /os?numero=&cliente=&status= — o prestador recebe só as OS dele. */
export function listarOrdens({ numero, cliente, status } = {}) {
  return requisicao(`/os${montarQuery({ numero, cliente, status })}`)
}

/** GET /os/{id} — OS + cliente completo + orcamentos[] + historico[] */
export function buscarOrdem(id) {
  return requisicao(`/os/${id}`)
}

/** POST /os { clienteId, descricao, prestadorId } → 201 OS (status ABERTA) */
export function abrirOrdem({ clienteId, descricao, prestadorId }) {
  return requisicao('/os', { metodo: 'POST', corpo: { clienteId, descricao, prestadorId } })
}

/** GET /prestadores → [{ id, nome, tipoUsuario }] */
export function listarPrestadores() {
  return requisicao('/prestadores')
}

/** POST /os/{id}/orcamentos { descricao, valor, prazoDias } → 201 Orcamento */
export function gerarOrcamento(idOrdem, { descricao, valor, prazoDias }) {
  return requisicao(`/os/${idOrdem}/orcamentos`, {
    metodo: 'POST',
    corpo: { descricao, valor, prazoDias },
  })
}

/** POST /orcamentos/{idOrcamento}/decisao { aprovado } — atenção: id do ORÇAMENTO, não da OS. */
export function decidirOrcamento(idOrcamento, aprovado) {
  return requisicao(`/orcamentos/${idOrcamento}/decisao`, {
    metodo: 'POST',
    corpo: { aprovado },
  })
}

/** POST /os/{id}/andamentos { observacao, status } — status null ou 'PRONTA'. → 201 Historico */
export function registrarAndamento(idOrdem, { observacao, marcarPronta }) {
  return requisicao(`/os/${idOrdem}/andamentos`, {
    metodo: 'POST',
    corpo: { observacao, status: marcarPronta ? 'PRONTA' : null },
  })
}

/** POST /os/{id}/encerramento { observacao? } — só OS PRONTA. → OS */
export function encerrarOrdem(idOrdem, observacao = '') {
  return requisicao(`/os/${idOrdem}/encerramento`, {
    metodo: 'POST',
    corpo: { observacao: observacao.trim() || null },
  })
}

/** POST /os/{id}/cancelamento { motivo } → OS */
export function cancelarOrdem(idOrdem, motivo) {
  return requisicao(`/os/${idOrdem}/cancelamento`, {
    metodo: 'POST',
    corpo: { motivo },
  })
}
