import Botao from '../Botao/Botao'
import MensagemErro from '../MensagemErro/MensagemErro'
import Modal from '../Modal/Modal'
import estilos from './ConfirmarDialogo.module.css'

/**
 * Pede confirmação explícita antes de uma ação importante (RF003, RF005).
 * Se a pessoa clicar em "Voltar" (ou fechar), nada é enviado.
 * erro: mensagem de falha da API, mostrada dentro do diálogo.
 */
export default function ConfirmarDialogo({
  aberto,
  titulo = 'Confirmar',
  mensagem,
  textoConfirmar = 'Confirmar',
  variante = 'primario',
  carregando = false,
  erro = '',
  aoConfirmar,
  aoCancelar,
}) {
  // Enquanto envia, não deixa fechar (a requisição já saiu).
  const fechar = carregando ? () => {} : aoCancelar

  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={fechar}>
      <div className={estilos.mensagem}>{mensagem}</div>
      {erro && (
        <div className={estilos.erro}>
          <MensagemErro mensagem={erro} />
        </div>
      )}
      <div className={estilos.botoes}>
        <Botao variante="secundario" onClick={aoCancelar} disabled={carregando}>
          Voltar
        </Botao>
        <Botao
          variante={variante}
          onClick={aoConfirmar}
          carregando={carregando}
          textoCarregando="Enviando..."
        >
          {textoConfirmar}
        </Botao>
      </div>
    </Modal>
  )
}
