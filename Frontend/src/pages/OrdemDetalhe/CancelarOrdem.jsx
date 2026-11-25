import { useState } from 'react'
import { cancelarOrdem } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import ConfirmarDialogo from '../../components/ConfirmarDialogo/ConfirmarDialogo'
import Modal from '../../components/Modal/Modal'
import { obrigatorio } from '../../utils/validadores'
import estilos from './Acoes.module.css'

/**
 * Cancelar a OS (RF005): atendente, qualquer status exceto ENCERRADA/CANCELADA.
 * Motivo obrigatório. Duas etapas: formulário → confirmação explícita → API.
 */
export default function CancelarOrdem({ os, aoConcluir }) {
  // 'fechado' | 'formulario' | 'confirmacao'
  const [etapa, setEtapa] = useState('fechado')
  const [motivo, setMotivo] = useState('')
  const [erroMotivo, setErroMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function abrir() {
    setMotivo('')
    setErroMotivo('')
    setErro('')
    setEtapa('formulario')
  }

  function continuar(evento) {
    evento.preventDefault()
    if (!obrigatorio(motivo)) {
      setErroMotivo('Informe o motivo do cancelamento.')
      return
    }
    setErroMotivo('')
    setErro('')
    setEtapa('confirmacao')
  }

  async function confirmar() {
    setEnviando(true)
    setErro('')
    try {
      await cancelarOrdem(os.id, motivo.trim())
      setEtapa('fechado')
      aoConcluir(`OS nº ${os.numero} cancelada.`)
    } catch (e) {
      if (e.campo === 'motivo') {
        // Problema no motivo: volta para o formulário mostrando o erro no campo.
        setErroMotivo(e.mensagem)
        setEtapa('formulario')
      } else {
        setErro(e.mensagem)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Botao variante="perigo" onClick={abrir}>
        Cancelar OS
      </Botao>

      <Modal
        aberto={etapa === 'formulario'}
        titulo={`Cancelar OS nº ${os.numero}`}
        aoFechar={() => setEtapa('fechado')}
      >
        <form className={estilos.formulario} onSubmit={continuar} noValidate>
          <Campo
            id="cancelar-motivo"
            rotulo="Motivo do cancelamento"
            como="textarea"
            obrigatorio
            placeholder="Ex.: cliente desistiu do serviço."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            erro={erroMotivo}
          />
          <p className="legenda-obrigatorio">* obrigatório</p>
          <div className={estilos.botoes}>
            <Botao variante="secundario" onClick={() => setEtapa('fechado')}>
              Voltar
            </Botao>
            <Botao type="submit" variante="perigo">
              Continuar
            </Botao>
          </div>
        </form>
      </Modal>

      <ConfirmarDialogo
        aberto={etapa === 'confirmacao'}
        titulo="Confirmar cancelamento"
        mensagem={
          <>
            <p>Confirma o cancelamento da OS nº {os.numero}?</p>
            <p className={estilos.resumo}>Motivo: {motivo.trim()}</p>
            <p>Depois de cancelada, a OS não poderá mais ser alterada.</p>
          </>
        }
        textoConfirmar="Confirmar cancelamento"
        variante="perigo"
        carregando={enviando}
        erro={erro}
        aoConfirmar={confirmar}
        aoCancelar={() => setEtapa('formulario')}
      />
    </>
  )
}
