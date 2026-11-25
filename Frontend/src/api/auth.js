import { requisicao } from './client'

// Nestas três chamadas um 401 não quer dizer "sessão expirou" (ex.: senha errada ou ainda não
// logado), por isso usam ignorar401.

/** POST /auth/login → { id, nomeUsuario, login, cargos[] } */
export function login(loginUsuario, senha) {
  return requisicao('/auth/login', {
    metodo: 'POST',
    corpo: { login: loginUsuario, senha },
    ignorar401: true,
  })
}

/** GET /auth/me → { id, nomeUsuario, login, cargos[] } ou erro 401 se não houver sessão */
export function usuarioAtual() {
  return requisicao('/auth/me', { ignorar401: true })
}

/** POST /auth/logout → 204 */
export function logout() {
  return requisicao('/auth/logout', { metodo: 'POST', ignorar401: true })
}
