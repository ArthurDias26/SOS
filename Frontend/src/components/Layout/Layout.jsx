import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { podeAbrirOrdem, podeGerenciarClientes } from '../../utils/permissoes'
import { rotuloCargos } from '../../utils/status'
import estilos from './Layout.module.css'

/**
 * Estrutura de todas as telas logadas: cabeçalho, menu e conteúdo.
 * Desktop: menu lateral. Celular (< 768px): menu escondido atrás do botão "Menu".
 */
export default function Layout() {
  const { usuario, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)

  // Itens do menu conforme o papel (TELAS.md 4.2). Quem tem os dois papéis vê todos.
  const itens = [{ para: '/os', texto: 'Ordens de serviço' }]
  if (podeAbrirOrdem(usuario)) {
    itens.push({ para: '/os/nova', texto: 'Nova OS' })
  }
  if (podeGerenciarClientes(usuario)) {
    itens.push({ para: '/clientes', texto: 'Clientes' })
  }

  async function aoSair() {
    setSaindo(true)
    // Ao limpar o usuário, a RotaProtegida leva para /login.
    await sair()
  }

  const classeLink = ({ isActive }) => `${estilos.link} ${isActive ? estilos.ativo : ''}`

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <button
          type="button"
          className={estilos.botaoMenu}
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          aria-label="Menu"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span aria-hidden="true">☰</span>
          <span className={estilos.textoMenu} aria-hidden="true">
            {' '}
            Menu
          </span>
        </button>

        <span className={estilos.marca}>SoS</span>

        <div className={estilos.usuario}>
          <span className={estilos.nome}>{usuario.nomeUsuario}</span>
          <span className={estilos.cargos}>{rotuloCargos(usuario.cargos)}</span>
        </div>

        <button type="button" className={estilos.sair} onClick={aoSair} disabled={saindo}>
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </header>

      <div className={estilos.corpo}>
        <nav
          id="menu-principal"
          className={`${estilos.menu} ${menuAberto ? estilos.menuAberto : ''}`}
          aria-label="Menu principal"
        >
          <ul>
            {itens.map((item) => (
              <li key={item.para}>
                {/* end: "/os" não fica marcado quando a página é "/os/nova" */}
                <NavLink to={item.para} end className={classeLink} onClick={() => setMenuAberto(false)}>
                  {item.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className={estilos.conteudo}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
