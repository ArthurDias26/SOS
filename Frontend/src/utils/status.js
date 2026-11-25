// Único lugar com os valores, rótulos e cores de status. As telas nunca escrevem esses textos.
// Valores iguais aos enums do backend: StatusOS.java e StatusOrcamento.java.

export const STATUS_OS = {
  ABERTA: 'ABERTA',
  AGUARDANDO_APROVACAO: 'AGUARDANDO_APROVACAO',
  EM_EXECUCAO: 'EM_EXECUCAO',
  PRONTA: 'PRONTA',
  ENCERRADA: 'ENCERRADA',
  CANCELADA: 'CANCELADA',
}

export const STATUS_ORCAMENTO = {
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  RECUSADO: 'RECUSADO',
}

// cor = nome usado nas variáveis --status-{cor}-fundo / --status-{cor}-texto do global.css
const INFO_STATUS_OS = {
  ABERTA: { rotulo: 'Aberta', cor: 'azul' },
  AGUARDANDO_APROVACAO: { rotulo: 'Aguardando aprovação', cor: 'ambar' },
  EM_EXECUCAO: { rotulo: 'Em execução', cor: 'indigo' },
  PRONTA: { rotulo: 'Pronta', cor: 'verde' },
  ENCERRADA: { rotulo: 'Encerrada', cor: 'cinza' },
  CANCELADA: { rotulo: 'Cancelada', cor: 'vermelho' },
}

const INFO_STATUS_ORCAMENTO = {
  PENDENTE: { rotulo: 'Pendente', cor: 'ambar' },
  APROVADO: { rotulo: 'Aprovado', cor: 'verde' },
  RECUSADO: { rotulo: 'Recusado', cor: 'vermelho' },
}

/** Lista na ordem do ciclo de vida, para montar o select de filtro. */
export const LISTA_STATUS_OS = Object.keys(INFO_STATUS_OS).map((valor) => ({
  valor,
  rotulo: INFO_STATUS_OS[valor].rotulo,
}))

/** OS nesses status não aceitam mais nenhuma ação (RF005). */
export const STATUS_FINALIZADOS = [STATUS_OS.ENCERRADA, STATUS_OS.CANCELADA]

/** tipo = 'os' ou 'orcamento'. Valor desconhecido devolve o próprio valor, em cinza. */
export function infoStatus(status, tipo = 'os') {
  const tabela = tipo === 'orcamento' ? INFO_STATUS_ORCAMENTO : INFO_STATUS_OS
  return tabela[status] || { rotulo: status || '—', cor: 'cinza' }
}

export function rotuloStatusOS(status) {
  return infoStatus(status, 'os').rotulo
}

export function rotuloStatusOrcamento(status) {
  return infoStatus(status, 'orcamento').rotulo
}

// Cargos (valores de usuario.cargos[], ver auth/Cargo.java)
export const CARGOS = {
  ATENDENTE: 'ATENDENTE',
  PRESTADOR: 'PRESTADOR',
}

const ROTULOS_CARGO = {
  ATENDENTE: 'Atendente',
  PRESTADOR: 'Prestador',
}

/** ['PRESTADOR', 'ATENDENTE'] → 'Atendente · Prestador' (ordem fixa, o backend manda um Set). */
export function rotuloCargos(cargos = []) {
  return Object.keys(ROTULOS_CARGO)
    .filter((cargo) => cargos.includes(cargo))
    .map((cargo) => ROTULOS_CARGO[cargo])
    .join(' · ')
}

// tipoUsuario do prestador (ver auth/Usuario.java)
const ROTULOS_TIPO_USUARIO = {
  PESSOA: 'Pessoa',
  EQUIPE: 'Equipe',
}

export function rotuloTipoUsuario(tipo) {
  return ROTULOS_TIPO_USUARIO[tipo] || tipo || ''
}
