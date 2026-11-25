import { Link } from 'react-router'
import estilos from './NaoEncontrado.module.css'

/** Página 404: endereço que não existe na aplicação. */
export default function NaoEncontrado() {
  return (
    <section className={`cartao ${estilos.caixa}`}>
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe. Confira o link ou volte para a lista.</p>
      <Link to="/os">Ir para as ordens de serviço</Link>
    </section>
  )
}
