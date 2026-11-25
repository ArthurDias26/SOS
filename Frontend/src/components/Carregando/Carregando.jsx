import estilos from './Carregando.module.css'

export default function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className={estilos.carregando} role="status">
      <span className={estilos.giro} aria-hidden="true" />
      {texto}
    </div>
  )
}
