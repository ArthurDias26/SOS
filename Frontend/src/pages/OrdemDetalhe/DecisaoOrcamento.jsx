import { useState } from 'react'
import { decidirOrcamento } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import ConfirmarDialogo from '../../components/ConfirmarDialogo/ConfirmarDialogo'
import { formatarMoeda } from '../../utils/formatadores'
import estilos from './Acoes.module.css'

/**
 * Aprovar ou recusar o orçamento pendente (RF003): atendente, OS AGUARDANDO_APROVACAO.
 * As duas opções pedem confirmação antes de chamar a API.
 */
export default function DecisaoOrcamento({ os, orcamento, aoConcluir }) {
  // null = nenhum diálogo aberto; true = aprovar; false = recusar
  const [aprovar, setAprovar] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function abrir(valor) {
    setErro('')
    setAprovar(valor)
  }

  async function confirmar() {
    setEnviando(true)
    setErro('')
    try {
      await decidirOrcamento(orcamento.id, aprovar)
      const mensagem = aprovar
        ? 'Orçamento aprovado. A OS está em execução.'
        : 'Orçamento recusado. A OS voltou para "Aberta" e pode receber um novo orçamento.'
      setAprovar(null)
      aoConcluir(mensagem)
    } catch (e) {
      setErro(e.mensagem)
    } finally {
      setEnviando(false)
    }
  }

  const resumo = `${formatarMoeda(orcamento.valor)} · prazo de ${orcamento.prazoDias} dia(s)`

  return (
    <>
      <div className={estilos.grupo}>
        <Botao onClick={() => abrir(true)}>Aprovar orçamento</Botao>
        <Botao variante="perigo" onClick={() => abrir(false)}>
          Recusar orçamento
        </Botao>
      </div>

      <ConfirmarDialogo
        aberto={aprovar !== null}
        titulo={aprovar ? 'Aprovar orçamento' : 'Recusar orçamento'}
        mensagem={
          <>
            <p>
              {aprovar
                ? `Confirma que o cliente APROVOU o orçamento da OS nº ${os.numero}?`
                : `Confirma que o cliente RECUSOU o orçamento da OS nº ${os.numero}?`}
            </p>
            <p className={estilos.resumo}>
              {orcamento.descricao}
              {'\n'}
              {resumo}
            </p>
            <p>
              {aprovar
                ? 'A OS passará para "Em execução".'
                : 'O orçamento ficará registrado como recusado e a OS voltará para "Aberta".'}
            </p>
          </>
        }
        textoConfirmar={aprovar ? 'Confirmar aprovação' : 'Confirmar recusa'}
        variante={aprovar ? 'primario' : 'perigo'}
        carregando={enviando}
        erro={erro}
        aoConfirmar={confirmar}
        aoCancelar={() => setAprovar(null)}
      />
    </>
  )
}
