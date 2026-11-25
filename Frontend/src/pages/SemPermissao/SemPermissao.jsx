import { Link } from 'react-router'
import estilos from './SemPermissao.module.css'

/** Página para quando o papel do usuário não pode usar a tela (403). */
export default function SemPermissao() {
  return (
    <section className={`cartao ${estilos.caixa}`}>
      <h1>Acesso não permitido</h1>
      <p>
        Seu perfil não tem permissão para usar esta função. Se precisar dela, fale com o responsável
        pelo sistema.
      </p>
      <Link to="/os">Ir para as ordens de serviço</Link>
    </section>
  )
}
