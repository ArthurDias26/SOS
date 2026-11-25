// Única função que fala com o backend. Todos os módulos de src/api usam requisicao().
//
// - URL base vem de VITE_API_URL (padrão /api, que passa pelo proxy do Vite).
// - credentials: 'include' envia o cookie de sessão (JSESSIONID) em toda chamada.
// - O backend não usa CSRF (ver docs/NOTAS_BACKEND.md), então não há token a enviar.
// - Erros viram um ErroApi com { status, campo, mensagem }, no mesmo formato do backend.

const URL_BASE = import.meta.env.VITE_API_URL || '/api'

/** Erro padronizado das chamadas à API. status 0 = sem conexão com o servidor. */
export class ErroApi extends Error {
  constructor(status, campo, mensagem) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.campo = campo
    this.mensagem = mensagem
  }
}

// O AuthContext registra aqui o que fazer quando a sessão expira (401).
let aoSessaoExpirar = null

export function definirAoSessaoExpirar(funcao) {
  aoSessaoExpirar = funcao
}

// Mensagens usadas quando o backend não manda uma (ex.: proxy sem backend rodando).
const MENSAGENS_PADRAO = {
  400: 'Dados inválidos. Confira os campos e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para usar esta função.',
  404: 'Registro não encontrado.',
  409: 'Este registro já existe.',
}

const SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

function mensagemPadrao(status) {
  if (MENSAGENS_PADRAO[status]) {
    return MENSAGENS_PADRAO[status]
  }
  // 502/503/504: o proxy do Vite (ou outro) não conseguiu falar com o backend.
  if (status >= 502 && status <= 504) {
    return SEM_CONEXAO
  }
  return 'Erro no servidor. Tente novamente em instantes.'
}

/**
 * Faz uma chamada à API e devolve o JSON da resposta (ou null quando não há corpo).
 * @param {string} caminho  ex.: '/os?status=ABERTA'
 * @param {object} opcoes   { metodo, corpo, ignorar401 }
 *   ignorar401: true nas chamadas de login/sessão, onde 401 não significa "sessão expirou".
 */
export async function requisicao(caminho, { metodo = 'GET', corpo, ignorar401 = false } = {}) {
  const config = {
    method: metodo,
    credentials: 'include',
    headers: { Accept: 'application/json' },
  }
  if (corpo !== undefined) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(corpo)
  }

  let resposta
  try {
    resposta = await fetch(URL_BASE + caminho, config)
  } catch {
    throw new ErroApi(0, null, SEM_CONEXAO)
  }

  // Lê o corpo como texto primeiro: respostas 204 ou de erro do proxy podem não ser JSON.
  const texto = await resposta.text()
  let dados = null
  if (texto) {
    try {
      dados = JSON.parse(texto)
    } catch {
      dados = null
    }
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && !ignorar401 && aoSessaoExpirar) {
      aoSessaoExpirar()
    }
    const mensagem = dados?.mensagem || mensagemPadrao(resposta.status)
    throw new ErroApi(resposta.status, dados?.campo ?? null, mensagem)
  }

  return dados
}

/** Monta a query string ignorando filtros vazios. Ex.: { status: 'ABERTA', cliente: '' } → '?status=ABERTA' */
export function montarQuery(filtros) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      params.append(chave, String(valor).trim())
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}
