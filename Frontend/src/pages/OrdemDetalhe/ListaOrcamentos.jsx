import StatusBadge from '../../components/StatusBadge/StatusBadge'
import { formatarDataHora, formatarMoeda } from '../../utils/formatadores'
import estilos from './Listas.module.css'

/** Todos os orçamentos da OS, inclusive os recusados (RF003, RF006). Somente leitura. */
export default function ListaOrcamentos({ orcamentos = [] }) {
  if (orcamentos.length === 0) {
    return <p className={estilos.vazio}>Nenhum orçamento gerado ainda.</p>
  }

  return (
    <ul className={estilos.lista}>
      {orcamentos.map((o) => (
        <li key={o.id} className={estilos.item}>
          <div className={estilos.itemTopo}>
            <strong className={estilos.valor}>{formatarMoeda(o.valor)}</strong>
            <StatusBadge status={o.status} tipo="orcamento" />
          </div>
          <p className={estilos.texto}>{o.descricao}</p>
          <dl className={estilos.detalhes}>
            <div>
              <dt>Prazo</dt>
              <dd>{o.prazoDias === 1 ? '1 dia' : `${o.prazoDias} dias`}</dd>
            </div>
            <div>
              <dt>Criado em</dt>
              <dd>{formatarDataHora(o.dataCriacao)}</dd>
            </div>
            <div>
              <dt>Decidido em</dt>
              <dd>{formatarDataHora(o.dataDecisao)}</dd>
            </div>
            <div>
              <dt>Decidido por</dt>
              <dd>{o.decididoPor?.nome || '—'}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
