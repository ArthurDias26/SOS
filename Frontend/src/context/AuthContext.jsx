// Estado global do usuário logado. É o ÚNICO estado global da aplicação.
//
// - Ao abrir a aplicação chama GET /auth/me para saber se já há sessão (RNF001).
// - Qualquer 401 fora do login (detectado em api/client.js) limpa o usuário e marca a sessão como
//   expirada; a RotaProtegida então leva para /login, que mostra o aviso.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as apiLogin, logout as apiLogout, usuarioAtual } from '../api/auth'
import { definirAoSessaoExpirar } from '../api/client'
import { temCargo as usuarioTemCargo } from '../utils/permissoes'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  // Por que a pessoa está indo para o login: null (primeiro acesso), 'expirou' ou 'saiu'.
  const [motivoLogin, setMotivoLogin] = useState(null)

  useEffect(() => {
    definirAoSessaoExpirar(() => {
      setUsuario(null)
      setMotivoLogin('expirou')
    })

    let ativo = true
    usuarioAtual()
      .then((dados) => {
        if (ativo) setUsuario(dados)
      })
      .catch(() => {
        // 401 = sem sessão; erro de conexão também cai aqui e a tela de login mostra o problema.
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
      definirAoSessaoExpirar(null)
    }
  }, [])

  const entrar = useCallback(async (loginUsuario, senha) => {
    const dados = await apiLogin(loginUsuario, senha)
    setUsuario(dados)
    setMotivoLogin(null)
    return dados
  }, [])

  const sair = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Mesmo se o servidor falhar, a sessão local é encerrada.
    }
    setUsuario(null)
    setMotivoLogin('saiu')
  }, [])

  const temCargo = useCallback((cargo) => usuarioTemCargo(usuario, cargo), [usuario])

  const valor = { usuario, carregando, motivoLogin, entrar, sair, temCargo }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

/** Uso: const { usuario, entrar, sair, temCargo } = useAuth() */
// oxlint-disable-next-line react/only-export-components -- o hook fica junto do contexto de propósito
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return contexto
}
