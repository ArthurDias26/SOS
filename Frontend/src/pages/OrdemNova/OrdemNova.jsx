import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { buscarCliente, listarClientes } from '../../api/clientes'
import { abrirOrdem, listarPrestadores } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import { dataDeHoje, formatarCpfCnpj, formatarTelefone } from '../../utils/formatadores'
import { rotuloTipoUsuario } from '../../utils/status'
import { errosDaApi, semErros, validarNovaOrdem } from '../../utils/validadores'
import estilos from './OrdemNova.module.css'

// O backend chama os campos de clienteId/prestadorId; no formulário o cliente é "cliente".
const CAMPOS = ['cliente', 'descricao', 'prestadorId']
const MAPA_CAMPOS = { clienteId: 'cliente' }

/**
 * Nova OS (TELAS.md 4.5, RF002). Uma página em etapas: 1. Cliente, 2. Serviço, 3. Resumo.
 * Quando volta do cadastro de cliente, a URL traz ?clienteId= e o cliente já vem selecionado.
 */
export default function OrdemNova() {
  const [parametros, setParametros] = useSearchParams()
  const clienteIdUrl = parametros.get('clienteId')

  // Etapa 1: cliente
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState(null) // null = ainda não pesquisou
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState('')
  const [cliente, setCliente] = useState(null)
  const [avisoCliente, setAvisoCliente] = useState('')

  // Etapa 2: serviço
  const [descricao, setDescricao] = useState('')
  const [prestadorId, setPrestadorId] = useState('')
  const [prestadores, setPrestadores] = useState({ lista: [], carregado: false, erro: null })

  // Envio
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [osCriada, setOsCriada] = useState(null)

  // Prestadores para o select
  useEffect(() => {
    let ativo = true
    listarPrestadores()
      .then((lista) => {
        if (ativo) setPrestadores({ lista, carregado: true, erro: null })
      })
      .catch((erro) => {
        if (ativo) setPrestadores({ lista: [], carregado: true, erro })
      })
    return () => {
      ativo = false
    }
  }, [])

  // Voltando do cadastro de cliente: seleciona o cliente recém-cadastrado
  useEffect(() => {
    if (!clienteIdUrl) {
      return
    }
    let ativo = true
    buscarCliente(clienteIdUrl)
      .then((c) => {
        if (!ativo) return
        setCliente(c)
        setAvisoCliente(`Cliente ${c.nome} cadastrado e selecionado.`)
      })
      .catch((erro) => {
        if (ativo) setErroBusca(erro.mensagem)
      })
    return () => {
      ativo = false
    }
  }, [clienteIdUrl])

  async function pesquisar(evento) {
    evento.preventDefault()
    setErroBusca('')
    if (!busca.trim()) {
      setErroBusca('Digite parte do nome ou do CPF/CNPJ para pesquisar.')
      return
    }
    setBuscando(true)
    try {
      setResultados(await listarClientes(busca.trim()))
    } catch (erro) {
      setErroBusca(erro.mensagem)
    } finally {
      setBuscando(false)
    }
  }

  function selecionar(c) {
    setCliente(c)
    setAvisoCliente('')
    setErros({ ...erros, cliente: undefined })
  }

  function trocarCliente() {
    setCliente(null)
    setAvisoCliente('')
    // Tira o clienteId da URL para não selecionar de novo ao recarregar.
    if (clienteIdUrl) setParametros({})
  }

  async function abrir() {
    setErroGeral('')
    const novosErros = validarNovaOrdem({ cliente, descricao, prestadorId })
    setErros(novosErros)
    if (!semErros(novosErros)) {
      return
    }
    setEnviando(true)
    try {
      const os = await abrirOrdem({
        clienteId: cliente.id,
        descricao: descricao.trim(),
        prestadorId: Number(prestadorId),
      })
      setOsCriada(os)
    } catch (erro) {
      const { erros: errosApi, geral } = errosDaApi(erro, CAMPOS, MAPA_CAMPOS)
      setErros(errosApi)
      setErroGeral(geral)
    } finally {
      setEnviando(false)
    }
  }

  function novaOs() {
    setBusca('')
    setResultados(null)
    setCliente(null)
    setAvisoCliente('')
    setDescricao('')
    setPrestadorId('')
    setErros({})
    setErroGeral('')
    setOsCriada(null)
    setParametros({})
  }

  // ---------- Sucesso ----------
  if (osCriada) {
    return (
      <div className={estilos.pagina}>
        <h1>Nova ordem de serviço</h1>
        <MensagemErro tipo="sucesso" mensagem={`OS nº ${osCriada.numero} aberta com sucesso.`}>
          <div className={estilos.acoesSucesso}>
            <Link to={`/os/${osCriada.id}`}>Ver detalhe da OS</Link>
            <Botao variante="link" onClick={novaOs}>
              Abrir outra OS
            </Botao>
          </div>
        </MensagemErro>
      </div>
    )
  }

  const prestadorEscolhido = prestadores.lista.find((p) => String(p.id) === String(prestadorId))
  const linkCadastro = '/clientes/novo?origem=nova-os'

  return (
    <div className={estilos.pagina}>
      <h1>Nova ordem de serviço</h1>
      <p className="legenda-obrigatorio">* obrigatório</p>

      <MensagemErro mensagem={erroGeral} />

      {/* ---------- 1. Cliente ---------- */}
      <section className={`cartao ${estilos.etapa}`} aria-labelledby="etapa-cliente">
        <h2 id="etapa-cliente" className={estilos.tituloEtapa}>
          <span className={estilos.numeroEtapa}>1</span> Cliente
          <span className={estilos.asterisco}> *</span>
        </h2>

        {cliente ? (
          <div className={estilos.clienteEscolhido}>
            <MensagemErro tipo="sucesso" mensagem={avisoCliente} />
            <div className={estilos.clienteDados}>
              <strong className="quebrar-texto">{cliente.nome}</strong>
              <span>{formatarCpfCnpj(cliente.cpfCnpj)}</span>
              <span>{formatarTelefone(cliente.telefone)}</span>
            </div>
            <Botao variante="secundario" onClick={trocarCliente}>
              Trocar cliente
            </Botao>
          </div>
        ) : (
          <>
            <form className={estilos.busca} onSubmit={pesquisar} noValidate>
              <Campo
                id="busca-cliente"
                rotulo="Pesquisar cliente (nome ou CPF/CNPJ)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                erro={erroBusca || erros.cliente}
              />
              <Botao type="submit" carregando={buscando} textoCarregando="Buscando...">
                Buscar
              </Botao>
            </form>

            {resultados && resultados.length === 0 && (
              <div className={estilos.semResultado}>
                <p>Nenhum cliente encontrado.</p>
                <Link to={linkCadastro} className={estilos.botaoCadastro}>
                  Cadastrar novo cliente
                </Link>
              </div>
            )}

            {resultados && resultados.length > 0 && (
              <ul className={estilos.resultados}>
                {resultados.map((c) => (
                  <li key={c.id} className={estilos.resultado}>
                    <div className={estilos.clienteDados}>
                      <strong className="quebrar-texto">{c.nome}</strong>
                      <span>{formatarCpfCnpj(c.cpfCnpj)}</span>
                    </div>
                    <Botao variante="secundario" onClick={() => selecionar(c)}>
                      Selecionar
                    </Botao>
                  </li>
                ))}
              </ul>
            )}

            {resultados && resultados.length > 0 && (
              <p className={estilos.dica}>
                Não é nenhum destes? <Link to={linkCadastro}>Cadastrar novo cliente</Link>
              </p>
            )}
          </>
        )}
      </section>

      {/* ---------- 2. Serviço ---------- */}
      <section className={`cartao ${estilos.etapa}`} aria-labelledby="etapa-servico">
        <h2 id="etapa-servico" className={estilos.tituloEtapa}>
          <span className={estilos.numeroEtapa}>2</span> Serviço
        </h2>
        <Campo
          id="descricao"
          rotulo="Descrição do serviço solicitado"
          como="textarea"
          obrigatorio
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          erro={erros.descricao}
        />
        {!prestadores.carregado ? (
          <Carregando texto="Carregando prestadores..." />
        ) : prestadores.erro ? (
          <MensagemErro mensagem={`Não foi possível carregar os prestadores: ${prestadores.erro.mensagem}`} />
        ) : (
          <Campo
            id="prestadorId"
            rotulo="Prestador responsável"
            como="select"
            obrigatorio
            value={prestadorId}
            onChange={(e) => setPrestadorId(e.target.value)}
            erro={erros.prestadorId}
          >
            <option value="">Selecione...</option>
            {prestadores.lista.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({rotuloTipoUsuario(p.tipoUsuario)})
              </option>
            ))}
          </Campo>
        )}
      </section>

      {/* ---------- 3. Resumo ---------- */}
      <section className={`cartao ${estilos.etapa}`} aria-labelledby="etapa-resumo">
        <h2 id="etapa-resumo" className={estilos.tituloEtapa}>
          <span className={estilos.numeroEtapa}>3</span> Resumo
        </h2>
        <dl className={estilos.resumo}>
          <dt>Cliente</dt>
          <dd>{cliente ? cliente.nome : '—'}</dd>
          <dt>Serviço</dt>
          <dd className={estilos.textoLongo}>{descricao.trim() || '—'}</dd>
          <dt>Prestador</dt>
          <dd>{prestadorEscolhido ? prestadorEscolhido.nome : '—'}</dd>
          <dt>Data de abertura</dt>
          <dd>{dataDeHoje()} (definida automaticamente)</dd>
        </dl>
        <div className={estilos.botoes}>
          <Link to="/os" className={estilos.cancelar}>
            Cancelar
          </Link>
          <Botao onClick={abrir} carregando={enviando} textoCarregando="Abrindo...">
            Abrir OS
          </Botao>
        </div>
      </section>
    </div>
  )
}
