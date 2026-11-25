import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { listarClientes } from '../../api/clientes'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import { formatarCpfCnpj, formatarTelefone } from '../../utils/formatadores'
import estilos from './ClientesLista.module.css'

/** Lista e pesquisa de clientes (TELAS.md 4.6, RF001). Só Atendente. */
export default function ClientesLista() {
  const local = useLocation()
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('busca') || ''
  const [texto, setTexto] = useState(busca)

  // Mensagem enviada pelo formulário de cliente depois de salvar.
  const sucesso = local.state?.sucesso || ''

  const [resultado, setResultado] = useState({ chave: null, clientes: [], erro: null })
  const carregando = resultado.chave !== busca
  const { clientes, erro } = resultado

  useEffect(() => {
    let ativo = true
    listarClientes(busca)
      .then((dados) => {
        if (ativo) setResultado({ chave: busca, clientes: dados, erro: null })
      })
      .catch((e) => {
        if (ativo) setResultado({ chave: busca, clientes: [], erro: e })
      })
    return () => {
      ativo = false
    }
  }, [busca])

  function buscar(evento) {
    evento.preventDefault()
    setParametros(texto.trim() ? { busca: texto.trim() } : {})
  }

  function limpar() {
    setTexto('')
    setParametros({})
  }

  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <h1>Clientes</h1>
        <Link to="/clientes/novo" className={estilos.botaoNovo}>
          Novo cliente
        </Link>
      </div>

      <MensagemErro tipo="sucesso" mensagem={sucesso} />

      <form className={`cartao ${estilos.busca}`} onSubmit={buscar}>
        <Campo
          id="busca"
          rotulo="Pesquisar por nome ou CPF/CNPJ"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className={estilos.botoesBusca}>
          <Botao type="submit">Buscar</Botao>
          <Botao variante="secundario" onClick={limpar}>
            Limpar
          </Botao>
        </div>
      </form>

      {carregando && <Carregando texto="Carregando clientes..." />}

      {!carregando && erro && <MensagemErro mensagem={erro.mensagem} />}

      {!carregando && !erro && clientes.length === 0 && (
        <div className={`cartao ${estilos.vazio}`}>
          <p>
            {busca ? 'Nenhum cliente encontrado para esta pesquisa.' : 'Nenhum cliente cadastrado.'}
          </p>
          <Link to="/clientes/novo">Cadastrar novo cliente</Link>
        </div>
      )}

      {!carregando && !erro && clientes.length > 0 && (
        <>
          {/* Desktop: tabela */}
          <div className={`cartao ${estilos.tabelaCaixa}`}>
            <table className={estilos.tabela}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">CPF/CNPJ</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">
                    <span className="somente-leitor">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td className={estilos.semQuebra}>{formatarCpfCnpj(c.cpfCnpj)}</td>
                    <td className={estilos.semQuebra}>{formatarTelefone(c.telefone)}</td>
                    <td className="quebrar-texto">{c.email || '—'}</td>
                    <td>
                      <Link to={`/clientes/${c.id}/editar`} aria-label={`Editar ${c.nome}`}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões */}
          <ul className={estilos.cartoes}>
            {clientes.map((c) => (
              <li key={c.id} className={`cartao ${estilos.cartaoCliente}`}>
                <strong className="quebrar-texto">{c.nome}</strong>
                <span>{formatarCpfCnpj(c.cpfCnpj)}</span>
                <span>{formatarTelefone(c.telefone)}</span>
                <span className="quebrar-texto">{c.email || 'Sem e-mail'}</span>
                <Link to={`/clientes/${c.id}/editar`} className={estilos.editar}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
