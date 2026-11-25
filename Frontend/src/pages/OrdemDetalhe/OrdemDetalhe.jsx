import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { buscarOrdem } from '../../api/ordens'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { formatarCpfCnpj, formatarDataHora, formatarTelefone } from '../../utils/formatadores'
import {
  concluirAguardaPrestador,
  orcamentoPendente,
  ordemFinalizada,
  podeCancelarOrdem,
  podeConcluirOrdem,
  podeDecidirOrcamento,
  podeGerarOrcamento,
  podeRegistrarAndamento,
} from '../../utils/permissoes'
import { rotuloTipoUsuario } from '../../utils/status'
import CancelarOrdem from './CancelarOrdem'
import DecisaoOrcamento from './DecisaoOrcamento'
import EncerrarOrdem from './EncerrarOrdem'
import FormAndamento from './FormAndamento'
import FormOrcamento from './FormOrcamento'
import ListaHistorico from './ListaHistorico'
import ListaOrcamentos from './ListaOrcamentos'
import estilos from './OrdemDetalhe.module.css'

/**
 * Detalhe da OS (TELAS.md 4.4). Os dados são somente leitura (RF006); as ações ficam no painel
 * "Ações" e cada uma é um componente desta pasta. Depois de uma ação, a OS é recarregada.
 */
export default function OrdemDetalhe() {
  const { id } = useParams()
  const { usuario } = useAuth()

  // versao muda depois de cada ação para buscar a OS de novo.
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ id: null, os: null, erro: null })
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true
    buscarOrdem(id)
      .then((os) => {
        if (ativo) setResultado({ id, os, erro: null })
      })
      .catch((erro) => {
        if (ativo) setResultado({ id, os: null, erro })
      })
    return () => {
      ativo = false
    }
  }, [id, versao])

  /** Chamado pelos componentes de ação depois de um sucesso. */
  function aoConcluirAcao(mensagem) {
    setSucesso(mensagem)
    setVersao((v) => v + 1)
  }

  // Enquanto a OS deste id ainda não chegou (recarregar após ação mantém a OS antiga na tela).
  if (resultado.id !== id) {
    return <Carregando texto="Carregando OS..." />
  }

  const { os, erro } = resultado

  if (erro) {
    return <ErroDetalhe erro={erro} />
  }

  const pendente = orcamentoPendente(os)
  const finalizada = ordemFinalizada(os)
  const mostrarConcluir = podeConcluirOrdem(usuario, os) || concluirAguardaPrestador(usuario, os)
  const temAcao =
    podeGerarOrcamento(usuario, os) ||
    podeDecidirOrcamento(usuario, os) ||
    podeRegistrarAndamento(usuario, os) ||
    mostrarConcluir ||
    podeCancelarOrdem(usuario, os)

  return (
    <div className={estilos.pagina}>
      <Link to="/os" className={estilos.voltar}>
        ← Voltar para a lista
      </Link>

      {/* 1. Cabeçalho */}
      <header className={estilos.cabecalho}>
        <div className={estilos.tituloLinha}>
          <h1>OS nº {os.numero}</h1>
          <StatusBadge status={os.status} />
        </div>
        <p className={estilos.datas}>
          Aberta em {formatarDataHora(os.dataAbertura)}
          {os.dataFinalizacao && <> · Finalizada em {formatarDataHora(os.dataFinalizacao)}</>}
        </p>
      </header>

      <MensagemErro tipo="sucesso" mensagem={sucesso} />

      <div className={estilos.grade}>
        {/* 2. Cliente */}
        <section className="cartao">
          <h2 className={estilos.tituloSecao}>Cliente</h2>
          <dl className={estilos.dados}>
            <dt>Nome</dt>
            <dd>{os.cliente.nome}</dd>
            <dt>CPF/CNPJ</dt>
            <dd>{formatarCpfCnpj(os.cliente.cpfCnpj)}</dd>
            <dt>Telefone</dt>
            <dd>{formatarTelefone(os.cliente.telefone) || '—'}</dd>
            <dt>E-mail</dt>
            <dd>{os.cliente.email || '—'}</dd>
          </dl>
        </section>

        {/* 3. Serviço */}
        <section className="cartao">
          <h2 className={estilos.tituloSecao}>Serviço</h2>
          <dl className={estilos.dados}>
            <dt>Descrição</dt>
            <dd className={estilos.textoLongo}>{os.descricao}</dd>
            <dt>Prestador responsável</dt>
            <dd>
              {os.prestador.nome}
              {os.prestador.tipoUsuario && ` (${rotuloTipoUsuario(os.prestador.tipoUsuario)})`}
            </dd>
          </dl>
        </section>
      </div>

      {/* 4. Ações (só aparece se houver alguma possível) */}
      {finalizada && (
        <MensagemErro tipo="aviso" mensagem="Esta OS foi finalizada e não aceita mais alterações." />
      )}
      {!finalizada && temAcao && (
        <section className={`cartao ${estilos.acoes}`} aria-labelledby="titulo-acoes">
          <h2 id="titulo-acoes" className={estilos.tituloSecao}>
            Ações
          </h2>
          <div className={estilos.botoesAcoes}>
            {podeGerarOrcamento(usuario, os) && <FormOrcamento os={os} aoConcluir={aoConcluirAcao} />}
            {podeDecidirOrcamento(usuario, os) && (
              <DecisaoOrcamento os={os} orcamento={pendente} aoConcluir={aoConcluirAcao} />
            )}
            {podeRegistrarAndamento(usuario, os) && (
              <FormAndamento os={os} aoConcluir={aoConcluirAcao} />
            )}
            {mostrarConcluir && (
              <EncerrarOrdem
                os={os}
                habilitado={podeConcluirOrdem(usuario, os)}
                aoConcluir={aoConcluirAcao}
              />
            )}
            {podeCancelarOrdem(usuario, os) && <CancelarOrdem os={os} aoConcluir={aoConcluirAcao} />}
          </div>
        </section>
      )}

      {/* 5. Orçamentos */}
      <section className="cartao">
        <h2 className={estilos.tituloSecao}>Orçamentos</h2>
        <ListaOrcamentos orcamentos={os.orcamentos} />
      </section>

      {/* 6. Histórico */}
      <section className="cartao">
        <h2 className={estilos.tituloSecao}>Histórico</h2>
        <ListaHistorico historico={os.historico} />
      </section>
    </div>
  )
}

/** Mensagens de erro ao carregar a OS (TELAS.md 4.4). */
function ErroDetalhe({ erro }) {
  let mensagem = erro.mensagem
  if (erro.status === 403) {
    mensagem = 'Você não tem acesso a esta OS. Ela está sob responsabilidade de outro prestador.'
  } else if (erro.status === 404 || erro.status === 400) {
    // 400 aparece quando o id da URL não é um número.
    mensagem = 'OS não encontrada.'
  }
  return (
    <div className={estilos.pagina}>
      <MensagemErro mensagem={mensagem}>
        <Link to="/os">Voltar para a lista de ordens de serviço</Link>
      </MensagemErro>
    </div>
  )
}
