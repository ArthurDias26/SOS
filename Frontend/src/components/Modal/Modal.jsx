import { useEffect, useId, useRef } from 'react'
import estilos from './Modal.module.css'

/**
 * Janela modal usando o <dialog> nativo do navegador (já trata foco e a tecla Esc).
 * aberto: mostra/esconde · aoFechar: chamado no Esc, no botão "×" e ao clicar fora.
 */
export default function Modal({ aberto, titulo, aoFechar, children }) {
  const refDialogo = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = refDialogo.current
    if (!dialogo) {
      return
    }
    if (aberto && !dialogo.open) {
      dialogo.showModal()
    } else if (!aberto && dialogo.open) {
      dialogo.close()
    }
  }, [aberto])

  // A tecla Esc dispara "cancel": impedimos o fechamento automático e deixamos o React decidir.
  function aoCancelar(evento) {
    evento.preventDefault()
    aoFechar()
  }

  // Clique no fundo escuro (fora da caixa) fecha.
  function aoClicar(evento) {
    if (evento.target === refDialogo.current) {
      aoFechar()
    }
  }

  return (
    <dialog
      ref={refDialogo}
      className={estilos.dialogo}
      onCancel={aoCancelar}
      onClick={aoClicar}
      aria-labelledby={idTitulo}
    >
      {aberto && (
        <div className={estilos.caixa}>
          <div className={estilos.cabecalho}>
            <h2 id={idTitulo}>{titulo}</h2>
            <button type="button" className={estilos.fechar} onClick={aoFechar} aria-label="Fechar">
              ×
            </button>
          </div>
          <div className={estilos.corpo}>{children}</div>
        </div>
      )}
    </dialog>
  )
}
