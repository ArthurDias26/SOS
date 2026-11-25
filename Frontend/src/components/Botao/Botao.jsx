import estilos from './Botao.module.css'

/**
 * Botão padrão.
 * variante: 'primario' | 'secundario' | 'perigo' | 'link'
 * carregando: desabilita e mostra textoCarregando (evita envio duplo).
 */
export default function Botao({
  variante = 'primario',
  carregando = false,
  textoCarregando = 'Salvando...',
  type = 'button',
  disabled,
  className = '',
  children,
  ...resto
}) {
  return (
    <button
      type={type}
      className={`${estilos.botao} ${estilos[variante]} ${className}`}
      disabled={disabled || carregando}
      {...resto}
    >
      {carregando ? textoCarregando : children}
    </button>
  )
}
