import estilos from './Campo.module.css'

/**
 * Campo de formulário com rótulo, marca de obrigatório e mensagem de erro abaixo.
 * como: 'input' (padrão) | 'textarea' | 'select'. Para select, passe as <option> como children.
 * Os demais props (value, onChange, type...) vão direto para o elemento.
 */
export default function Campo({
  id,
  rotulo,
  obrigatorio = false,
  erro,
  ajuda,
  como = 'input',
  children,
  ...resto
}) {
  const idErro = erro ? `${id}-erro` : undefined
  const idAjuda = ajuda ? `${id}-ajuda` : undefined
  const descricao = [idErro, idAjuda].filter(Boolean).join(' ') || undefined

  const props = {
    id,
    name: id,
    className: `${estilos.controle} ${erro ? estilos.comErro : ''}`,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricao,
    'aria-required': obrigatorio || undefined,
    ...resto,
  }

  let controle
  if (como === 'textarea') {
    controle = <textarea rows={4} {...props} />
  } else if (como === 'select') {
    controle = <select {...props}>{children}</select>
  } else {
    controle = <input {...props} />
  }

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
        {obrigatorio && (
          <span className={estilos.asterisco} aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      {controle}
      {ajuda && (
        <p id={idAjuda} className={estilos.ajuda}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className={estilos.erro}>
          {erro}
        </p>
      )}
    </div>
  )
}
