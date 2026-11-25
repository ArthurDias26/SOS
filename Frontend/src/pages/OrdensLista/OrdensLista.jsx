import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { listarOrdens } from '../../api/ordens'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { formatarData, truncar } from '../../utils/formatadores'
import { podeAbrirOrdem, podeVerTodasOrdens } from '../../utils/permissoes'
import { LISTA_STATUS_OS } from '../../utils/status'
import estilos from './OrdensLista.module.css'

/**
 * Lista de OS com filtros (TELAS.md 4.3, RF006).
 * Os filtros aplicados ficam na URL (?numero=&cliente=&status=), assim voltar do detalhe
 * mantém a pesquisa.
 */
export default function OrdensLista() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [parametros, setParametros] = useSearchParams()

  // Filtros aplicados (vêm da URL) — são eles que disparam a busca.
  const numero = parametros.get('numero') || ''
  const cliente = parametros.get('cliente') || ''
  const status = parametros.get('status') || ''
  const temFiltro = Boolean(numero || cliente || status)

  // Filtros sendo digitados no formulário (só valem depois de "Buscar").
  const [formulario, setFormulario] = useState({ numero, cliente, status })
  const [erroNumero, setErroNumero] = useState('')

  // O resultado guarda a "chave" da pesquisa que o gerou. Enquanto a chave atual for diferente,
  // a busca nova ainda não chegou → está carregando.
  const chave = `${numero}|${cliente}|${status}`
  const [resultado, setResultado] = useState({ chave: null, ordens: [], erro: null })
  const carregando = resultado.chave !== chave
  const { ordens, erro } = resultado

  useEffect(() => {
    let ativo = true // evita gravar a resposta de uma busca antiga
    listarOrdens({ numero, cliente, status })
      .then((dados) => {
        if (ativo) setResultado({ chave, ordens: dados, erro: null })
      })
      .catch((e) => {
        if (ativo) setResultado({ chave, ordens: [], erro: e })
      })
    return () => {
      ativo = false
    }
  }, [chave, numero, cliente, status])

  function alterar(evento) {
    const { name, value } = evento.target
    setFormulario({ ...formulario, [name]: value })
  }

  function buscar(evento) {
    evento.preventDefault()
    const numeroDigitado = formulario.numero.trim()
    if (numeroDigitado && !/^\d+$/.test(numeroDigitado)) {
      setErroNumero('O número da OS deve ter apenas dígitos, por exemplo 15.')
      return
    }
    setErroNumero('')
    const novos = {}
    if (numeroDigitado) novos.numero = numeroDigitado
    if (formulario.cliente.trim()) novos.cliente = formulario.cliente.trim()
    if (formulario.status) novos.status = formulario.status
    setParametros(novos)
  }

  function limpar() {
    setFormulario({ numero: '', cliente: '', status: '' })
    setErroNumero('')
    setParametros({})
  }

  const titulo = podeVerTodasOrdens(usuario) ? 'Ordens de serviço' : 'Minhas ordens de serviço'

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <h1>{titulo}</h1>
        {podeAbrirOrdem(usuario) && (
          <Link to="/os/nova" className={estilos.botaoNova}>
            Nova OS
          </Link>
        )}
      </div>

      <form className={`cartao ${estilos.filtros}`} onSubmit={buscar} noValidate>
        <Campo
          id="numero"
          rotulo="Número da OS"
          inputMode="numeric"
          value={formulario.numero}
          onChange={alterar}
          erro={erroNumero}
        />
        <Campo
          id="cliente"
          rotulo="Cliente (nome ou CPF/CNPJ)"
          value={formulario.cliente}
          onChange={alterar}
        />
        <Campo id="status" rotulo="Status" como="select" value={formulario.status} onChange={alterar}>
          <option value="">Todos</option>
          {LISTA_STATUS_OS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </Campo>
        <div className={estilos.botoesFiltro}>
          <Botao type="submit">Buscar</Botao>
          <Botao variante="secundario" onClick={limpar}>
            Limpar
          </Botao>
        </div>
      </form>

      {carregando && <Carregando texto="Carregando ordens de serviço..." />}

      {!carregando && erro && <MensagemErro mensagem={erro.mensagem} />}

      {!carregando && !erro && ordens.length === 0 && (
        <div className={`cartao ${estilos.vazio}`}>
          <p>Nenhuma OS encontrada para esta pesquisa.</p>
          {temFiltro && (
            <Botao variante="secundario" onClick={limpar}>
              Limpar filtros
            </Botao>
          )}
        </div>
      )}

      {!carregando && !erro && ordens.length > 0 && (
        <>
          <p className={estilos.total}>
            {ordens.length === 1 ? '1 OS encontrada' : `${ordens.length} OS encontradas`}
          </p>

          {/* Desktop: tabela */}
          <div className={`cartao ${estilos.tabelaCaixa}`}>
            <table className={estilos.tabela}>
              <thead>
                <tr>
                  <th scope="col">Nº</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Prestador</th>
                  <th scope="col">Status</th>
                  <th scope="col">Abertura</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((os) => (
                  <tr key={os.id} className={estilos.linha} onClick={() => navegar(`/os/${os.id}`)}>
                    <td>
                      {/* O link deixa a linha acessível pelo teclado */}
                      <Link to={`/os/${os.id}`} onClick={(e) => e.stopPropagation()}>
                        {os.numero}
                      </Link>
                    </td>
                    <td>{os.cliente?.nome}</td>
                    <td title={os.descricao}>{truncar(os.descricao, 50)}</td>
                    <td>{os.prestador?.nome}</td>
                    <td>
                      <StatusBadge status={os.status} />
                    </td>
                    <td>{formatarData(os.dataAbertura)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões */}
          <ul className={estilos.cartoes}>
            {ordens.map((os) => (
              <li key={os.id}>
                <Link to={`/os/${os.id}`} className={`cartao ${estilos.cartaoOs}`}>
                  <div className={estilos.cartaoTopo}>
                    <strong>OS nº {os.numero}</strong>
                    <StatusBadge status={os.status} />
                  </div>
                  <span className={estilos.cartaoCliente}>{os.cliente?.nome}</span>
                  <span className="quebrar-texto">{truncar(os.descricao, 90)}</span>
                  <span className={estilos.cartaoRodape}>
                    {os.prestador?.nome} · {formatarData(os.dataAbertura)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
