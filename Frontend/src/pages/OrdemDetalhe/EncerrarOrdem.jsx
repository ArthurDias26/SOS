import { useState } from 'react'
import { encerrarOrdem } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import ConfirmarDialogo from '../../components/ConfirmarDialogo/ConfirmarDialogo'
import Modal from '../../components/Modal/Modal'
import estilos from './Acoes.module.css'

/**
 * Concluir a OS (RF005): atendente, OS PRONTA. Observação opcional.
 * Duas etapas: formulário → confirmação explícita → API.
 * habilitado = false: mostra o botão desabilitado com a explicação (OS ainda não está PRONTA).
 */
export default function EncerrarOrdem({ os, habilitado, aoConcluir }) {
  // 'fechado' | 'formulario' | 'confirmacao'
  const [etapa, setEtapa] = useState('fechado')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  if (!habilitado) {
    return (
      <div className={estilos.indisponivel}>
        <Botao variante="secundario" disabled aria-describedby="explicacao-concluir">
          Concluir OS
        </Botao>
        <span id="explicacao-concluir" className={estilos.explicacao}>
          O prestador ainda não finalizou o serviço.
        </span>
      </div>
    )
  }

  function abrir() {
    setObservacao('')
    setErro('')
    setEtapa('formulario')
  }

  async function confirmar() {
    setEnviando(true)
    setErro('')
    try {
      await encerrarOrdem(os.id, observacao)
      setEtapa('fechado')
      aoConcluir(`OS nº ${os.numero} concluída com sucesso.`)
    } catch (e) {
      setErro(e.mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Botao onClick={abrir}>Concluir OS</Botao>

      <Modal
        aberto={etapa === 'formulario'}
        titulo={`Concluir OS nº ${os.numero}`}
        aoFechar={() => setEtapa('fechado')}
      >
        <form
          className={estilos.formulario}
          onSubmit={(e) => {
            e.preventDefault()
            setEtapa('confirmacao')
          }}
        >
          <Campo
            id="encerrar-observacao"
            rotulo="Observação (opcional)"
            como="textarea"
            placeholder="Ex.: cliente retirou o equipamento."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
          <div className={estilos.botoes}>
            <Botao variante="secundario" onClick={() => setEtapa('fechado')}>
              Cancelar
            </Botao>
            <Botao type="submit">Continuar</Botao>
          </div>
        </form>
      </Modal>

      <ConfirmarDialogo
        aberto={etapa === 'confirmacao'}
        titulo="Confirmar conclusão"
        mensagem={
          <>
            <p>Confirma a conclusão da OS nº {os.numero}?</p>
            <p>Depois de encerrada, a OS não poderá mais ser alterada.</p>
          </>
        }
        textoConfirmar="Confirmar conclusão"
        carregando={enviando}
        erro={erro}
        aoConfirmar={confirmar}
        aoCancelar={() => setEtapa('formulario')}
      />
    </>
  )
}
