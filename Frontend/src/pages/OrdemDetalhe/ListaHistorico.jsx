import { formatarDataHora } from '../../utils/formatadores'
import { rotuloStatusOS } from '../../utils/status'
import estilos from './Listas.module.css'

/**
 * Histórico em ordem cronológica (o backend já manda ordenado), com data/hora, usuário,
 * observação e a transição de status quando houver (RF006, RNF005). Somente leitura.
 */
export default function ListaHistorico({ historico = [] }) {
  if (historico.length === 0) {
    return <p className={estilos.vazio}>Nenhum registro no histórico.</p>
  }

  return (
    <ol className={estilos.lista}>
      {historico.map((h) => (
        <li key={h.id} className={estilos.item}>
          <div className={estilos.itemTopo}>
            <span className={estilos.data}>{formatarDataHora(h.dataHora)}</span>
            <span className={estilos.usuario}>{h.usuario?.nome}</span>
          </div>
          {h.statusNovo && (
            <p className={estilos.transicao}>
              {h.statusAnterior ? `${rotuloStatusOS(h.statusAnterior)} → ` : ''}
              {rotuloStatusOS(h.statusNovo)}
            </p>
          )}
          {h.observacao && <p className={estilos.texto}>{h.observacao}</p>}
        </li>
      ))}
    </ol>
  )
}
