import { useState } from 'react'
import { gerarOrcamento } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import Modal from '../../components/Modal/Modal'
import { converterValor } from '../../utils/formatadores'
import { errosDaApi, semErros, validarOrcamento } from '../../utils/validadores'
import estilos from './Acoes.module.css'

const VAZIO = { descricao: '', valor: '', prazoDias: '' }
const CAMPOS = Object.keys(VAZIO)

/** Gerar orçamento (RF003): prestador responsável, OS ABERTA. */
export default function FormOrcamento({ os, aoConcluir }) {
  const [aberto, setAberto] = useState(false)
  const [dados, setDados] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function abrir() {
    setDados(VAZIO)
    setErros({})
    setErroGeral('')
    setAberto(true)
  }

  function alterar(evento) {
    const { name, value } = evento.target
    setDados({ ...dados, [name]: value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    const novosErros = validarOrcamento(dados)
    setErros(novosErros)
    setErroGeral('')
    if (!semErros(novosErros)) {
      return
    }

    setEnviando(true)
    try {
      await gerarOrcamento(os.id, {
        descricao: dados.descricao.trim(),
        valor: converterValor(dados.valor),
        prazoDias: Number(dados.prazoDias),
      })
      setAberto(false)
      aoConcluir('Orçamento gerado. A OS agora aguarda a aprovação do cliente.')
    } catch (erro) {
      const { erros: errosApi, geral } = errosDaApi(erro, CAMPOS)
      setErros(errosApi)
      setErroGeral(geral)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Botao onClick={abrir}>Gerar orçamento</Botao>

      <Modal aberto={aberto} titulo={`Gerar orçamento – OS nº ${os.numero}`} aoFechar={() => setAberto(false)}>
        <form className={estilos.formulario} onSubmit={enviar} noValidate>
          <MensagemErro mensagem={erroGeral} />
          <Campo
            id="orcamento-descricao"
            name="descricao"
            rotulo="Descrição do serviço"
            como="textarea"
            obrigatorio
            value={dados.descricao}
            onChange={alterar}
            erro={erros.descricao}
          />
          <div className={estilos.linhaDupla}>
            <Campo
              id="orcamento-valor"
              name="valor"
              rotulo="Valor (R$)"
              inputMode="decimal"
              placeholder="0,00"
              obrigatorio
              value={dados.valor}
              onChange={alterar}
              erro={erros.valor}
            />
            <Campo
              id="orcamento-prazo"
              name="prazoDias"
              rotulo="Prazo (dias)"
              inputMode="numeric"
              obrigatorio
              value={dados.prazoDias}
              onChange={alterar}
              erro={erros.prazoDias}
            />
          </div>
          <p className="legenda-obrigatorio">* obrigatório</p>
          <div className={estilos.botoes}>
            <Botao variante="secundario" onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </Botao>
            <Botao type="submit" carregando={enviando}>
              Gerar orçamento
            </Botao>
          </div>
        </form>
      </Modal>
    </>
  )
}
