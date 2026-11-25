import { useState } from 'react'
import { registrarAndamento } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import Modal from '../../components/Modal/Modal'
import { errosDaApi, obrigatorio } from '../../utils/validadores'
import estilos from './Acoes.module.css'

/**
 * Registrar andamento (RF004): prestador responsável, OS EM_EXECUCAO.
 * Com a caixa marcada, a OS passa para PRONTA.
 */
export default function FormAndamento({ os, aoConcluir }) {
  const [aberto, setAberto] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [marcarPronta, setMarcarPronta] = useState(false)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function abrir() {
    setObservacao('')
    setMarcarPronta(false)
    setErros({})
    setErroGeral('')
    setAberto(true)
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErroGeral('')
    if (!obrigatorio(observacao)) {
      setErros({ observacao: 'Descreva o andamento do serviço.' })
      return
    }
    setErros({})

    setEnviando(true)
    try {
      await registrarAndamento(os.id, { observacao: observacao.trim(), marcarPronta })
      setAberto(false)
      aoConcluir(
        marcarPronta
          ? 'Andamento registrado e OS marcada como "Pronta". Aguarde o atendente concluir.'
          : 'Andamento registrado.',
      )
    } catch (erro) {
      const { erros: errosApi, geral } = errosDaApi(erro, ['observacao'])
      setErros(errosApi)
      setErroGeral(geral)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Botao onClick={abrir}>Registrar andamento</Botao>

      <Modal
        aberto={aberto}
        titulo={`Registrar andamento – OS nº ${os.numero}`}
        aoFechar={() => setAberto(false)}
      >
        <form className={estilos.formulario} onSubmit={enviar} noValidate>
          <MensagemErro mensagem={erroGeral} />
          <Campo
            id="andamento-observacao"
            name="observacao"
            rotulo="Observação"
            como="textarea"
            obrigatorio
            placeholder="O que foi feito até agora?"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            erro={erros.observacao}
          />
          <label className={estilos.caixaMarcar}>
            <input
              type="checkbox"
              checked={marcarPronta}
              onChange={(e) => setMarcarPronta(e.target.checked)}
            />
            Serviço concluído — marcar como Pronta
          </label>
          <p className="legenda-obrigatorio">* obrigatório</p>
          <div className={estilos.botoes}>
            <Botao variante="secundario" onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" carregando={enviando}>
              Registrar andamento
            </Botao>
          </div>
        </form>
      </Modal>
    </>
  )
}
