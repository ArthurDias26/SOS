import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { temCargo } from '../../utils/permissoes'
import Carregando from '../Carregando/Carregando'

/**
 * Protege rotas: exige login e, opcionalmente, um cargo ('ATENDENTE' ou 'PRESTADOR').
 * Sem login → /login (guardando a página para voltar depois do login).
 * Sem o cargo → /sem-permissao.
 * Usada como elemento de rota "pai": as rotas filhas aparecem no <Outlet />.
 */
export default function RotaProtegida({ cargo }) {
  const { usuario, carregando, motivoLogin } = useAuth()
  const local = useLocation()

  if (carregando) {
    return <Carregando texto="Verificando sessão..." />
  }

  if (!usuario) {
    // Se a pessoa clicou em "Sair", não faz sentido voltar para a página anterior depois.
    const estado = motivoLogin === 'saiu' ? undefined : { de: local.pathname + local.search }
    return <Navigate to="/login" replace state={estado} />
  }

  if (cargo && !temCargo(usuario, cargo)) {
    return <Navigate to="/sem-permissao" replace />
  }

  return <Outlet />
}
