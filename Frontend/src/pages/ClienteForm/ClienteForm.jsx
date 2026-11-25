import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { atualizarCliente, buscarCliente, criarCliente, listarClientes } from '../../api/clientes'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import { apenasDigitos, formatarCpfCnpj, formatarTelefone } from '../../utils/formatadores'
import { errosDaApi, semErros, validarCliente } from '../../utils/validadores'
import estilos from './ClienteForm.module.css'

const VAZIO = { nome: '', cpfCnpj: '', telefone: '', email: '' }
const CAMPOS = Object.keys(VAZIO)

/**
 * Novo cliente (/clientes/novo) e editar cliente (/clientes/:id/editar) – TELAS.md 4.7, RF001.
 * Com ?origem=nova-os, depois de salvar volta para a Nova OS com o cliente já selecionado.
 *
 * A "key" faz o React criar um formulário novo quando o id muda (ex.: do cadastro para a
 * edição do cliente que já existia), sem sobrar estado da tela anterior.
 */
export default function ClienteForm() {
  const { id } = useParams()
  return <FormularioCliente key={id || 'novo'} id={id} />
}

function FormularioCliente({ id }) {
  const editando = Boolean(id)
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const vemDaNovaOs = parametros.get('origem') === 'nova-os'
  const sufixoOrigem = vemDaNovaOs ? '?origem=nova-os' : ''

  const [dados, setDados] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [conflito, setConflito] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // Carregamento do cliente na edição
  const [carga, setCarga] = useState({ pronto: !editando, erro: null })

  useEffect(() => {
    if (!editando) {
      return
    }
    let ativo = true
    buscarCliente(id)
      .then((cliente) => {
        if (!ativo) return
        setDados({
          nome: cliente.nome,
          cpfCnpj: formatarCpfCnpj(cliente.cpfCnpj),
          telefone: formatarTelefone(cliente.telefone),
          email: cliente.email || '',
        })
        setCarga({ pronto: true, erro: null })
      })
      .catch((erro) => {
        if (ativo) setCarga({ pronto: true, erro })
      })
    return () => {
      ativo = false
    }
  }, [editando, id])

  function alterar(evento) {
    const { name, value } = evento.target
    let valor = value
    // Máscaras automáticas
    if (name === 'cpfCnpj') valor = formatarCpfCnpj(value)
    if (name === 'telefone') valor = formatarTelefone(value)
    setDados({ ...dados, [name]: valor })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErroGeral('')
    setConflito(false)

    const novosErros = validarCliente(dados)
    setErros(novosErros)
    if (!semErros(novosErros)) {
      return
    }

    const corpo = {
      nome: dados.nome.trim(),
      cpfCnpj: apenasDigitos(dados.cpfCnpj),
      telefone: dados.telefone,
      email: dados.email.trim() || null,
    }

    setEnviando(true)
    try {
      const salvo = editando ? await atualizarCliente(id, corpo) : await criarCliente(corpo)
      if (vemDaNovaOs) {
        navegar(`/os/nova?clienteId=${salvo.id}`)
      } else {
        const mensagem = editando
          ? `Cliente ${salvo.nome} atualizado com sucesso.`
          : `Cliente ${salvo.nome} cadastrado com sucesso.`
        navegar('/clientes', { state: { sucesso: mensagem } })
      }
    } catch (erro) {
      setEnviando(false)
      if (erro.status === 409) {
        setConflito(true)
        setErros({ cpfCnpj: 'Este CPF/CNPJ já pertence a outro cliente.' })
        return
      }
      const { erros: errosApi, geral } = errosDaApi(erro, CAMPOS)
      setErros(errosApi)
      setErroGeral(geral)
    }
  }

  /** 409: procura o cliente que já tem esse CPF/CNPJ e abre a edição dele. */
  async function verCadastroExistente() {
    const digitos = apenasDigitos(dados.cpfCnpj)
    try {
      const encontrados = await listarClientes(digitos)
      const existente = encontrados.find((c) => c.cpfCnpj === digitos)
      if (existente) {
        navegar(`/clientes/${existente.id}/editar${sufixoOrigem}`)
      } else {
        setErroGeral('Não foi possível localizar o cadastro existente. Pesquise na lista de clientes.')
      }
    } catch (erro) {
      setErroGeral(erro.mensagem)
    }
  }

  const titulo = editando ? 'Editar cliente' : 'Novo cliente'
  const destinoVoltar = vemDaNovaOs ? '/os/nova' : '/clientes'

  if (!carga.pronto) {
    return <Carregando texto="Carregando cliente..." />
  }

  if (carga.erro) {
    const mensagem = carga.erro.status === 404 ? 'Cliente não encontrado.' : carga.erro.mensagem
    return (
      <MensagemErro mensagem={mensagem}>
        <Link to="/clientes">Voltar para a lista de clientes</Link>
      </MensagemErro>
    )
  }

  return (
    <div className={estilos.pagina}>
      <Link to={destinoVoltar} className={estilos.voltar}>
        ← {vemDaNovaOs ? 'Voltar para a Nova OS' : 'Voltar para a lista'}
      </Link>
      <h1>{titulo}</h1>
      {vemDaNovaOs && (
        <MensagemErro
          tipo="aviso"
          mensagem="Ao salvar, você volta para a Nova OS com este cliente já selecionado."
        />
      )}

      <form className={`cartao ${estilos.formulario}`} onSubmit={enviar} noValidate>
        {conflito && (
          <MensagemErro mensagem="Já existe um cliente com este CPF/CNPJ.">
            <Botao variante="link" onClick={verCadastroExistente}>
              Ver cadastro existente
            </Botao>
          </MensagemErro>
        )}
        <MensagemErro mensagem={erroGeral} />

        <Campo
          id="nome"
          rotulo="Nome"
          obrigatorio
          autoComplete="off"
          value={dados.nome}
          onChange={alterar}
          erro={erros.nome}
        />
        <div className={estilos.linhaDupla}>
          <Campo
            id="cpfCnpj"
            rotulo="CPF ou CNPJ"
            obrigatorio
            inputMode="numeric"
            placeholder="000.000.000-00"
            ajuda="11 dígitos para CPF ou 14 para CNPJ."
            value={dados.cpfCnpj}
            onChange={alterar}
            erro={erros.cpfCnpj}
          />
          <Campo
            id="telefone"
            rotulo="Telefone"
            obrigatorio
            type="tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={dados.telefone}
            onChange={alterar}
            erro={erros.telefone}
          />
        </div>
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          placeholder="nome@exemplo.com"
          value={dados.email}
          onChange={alterar}
          erro={erros.email}
        />

        <p className="legenda-obrigatorio">* obrigatório</p>

        <div className={estilos.botoes}>
          <Link to={destinoVoltar} className={estilos.cancelar}>
            Cancelar
          </Link>
          <Botao type="submit" carregando={enviando}>
            {editando ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Botao>
        </div>
      </form>
    </div>
  )
}
