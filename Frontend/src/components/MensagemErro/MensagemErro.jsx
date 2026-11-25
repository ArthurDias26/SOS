import estilos from './MensagemErro.module.css'

/**
 * Caixa de mensagem. tipo: 'erro' (padrão) | 'sucesso' | 'aviso'.
 * Aceita texto em "mensagem" e/ou conteúdo extra em children (ex.: um link).
 */
export default function MensagemErro({ mensagem, tipo = 'erro', children }) {
  if (!mensagem && !children) {
    return null
  }
  return (
    <div
      className={`${estilos.caixa} ${estilos[tipo]}`}
      role={tipo === 'erro' ? 'alert' : 'status'}
    >
      {mensagem && <p>{mensagem}</p>}
      {children}
    </div>
  )
}
