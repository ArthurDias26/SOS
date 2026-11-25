import { infoStatus } from '../../utils/status'
import estilos from './StatusBadge.module.css'

/** Etiqueta colorida de status. Sempre mostra o texto: a cor não é a única informação. */
export default function StatusBadge({ status, tipo = 'os' }) {
  const { rotulo, cor } = infoStatus(status, tipo)
  return (
    <span
      className={estilos.badge}
      style={{
        background: `var(--status-${cor}-fundo)`,
        color: `var(--status-${cor}-texto)`,
      }}
    >
      {rotulo}
    </span>
  )
}
