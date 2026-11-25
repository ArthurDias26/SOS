import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Botao from '../../components/Botao/Botao'
import Campo from '../../components/Campo/Campo'
import Carregando from '../../components/Carregando/Carregando'
import MensagemErro from '../../components/MensagemErro/MensagemErro'
import { useAuth } from '../../context/AuthContext'
import { obrigatorio } from '../../utils/validadores'
import estilos from './Login.module.css'

/** Tela de login (TELAS.md 4.1). */
export default function Login() {
  const { usuario, carregando, motivoLogin, entrar } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()

  const [dados, setDados] = useState({ login: '', senha: '' })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Página que a pessoa tentou abrir antes de ser mandada para o login.
  const destino = local.state?.de || '/os'

  if (carregando) {
    return <Carregando texto="Verificando sessão..." />
  }
  if (usuario) {
    return <Navigate to={destino} replace />
  }

  function alterar(evento) {
    const { name, value } = evento.target
    setDados({ ...dados, [name]: value })
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErroGeral('')

    const novosErros = {}
    if (!obrigatorio(dados.login)) novosErros.login = 'Informe o usuário.'
    if (!obrigatorio(dados.senha)) novosErros.senha = 'Informe a senha.'
    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) {
      return
    }

    setEnviando(true)
    try {
      await entrar(dados.login.trim(), dados.senha)
      navegar(destino, { replace: true })
    } catch (erro) {
      if (erro.status === 401 || erro.status === 400) {
        setErroGeral('Usuário ou senha inválidos.')
      } else {
        setErroGeral(erro.mensagem)
      }
      setEnviando(false)
    }
  }

  return (
    <div className={estilos.fundo}>
      <form className={`cartao ${estilos.cartao}`} onSubmit={enviar} noValidate>
        <h1 className={estilos.titulo}>SoS</h1>
        <p className={estilos.subtitulo}>Sistema de Ordem de Serviço</p>

        {motivoLogin === 'expirou' && !erroGeral && (
          <MensagemErro tipo="aviso" mensagem="Sua sessão expirou. Entre novamente." />
        )}
        <MensagemErro mensagem={erroGeral} />

        <Campo
          id="login"
          rotulo="Usuário"
          obrigatorio
          autoComplete="username"
          value={dados.login}
          onChange={alterar}
          erro={erros.login}
        />
        <Campo
          id="senha"
          rotulo="Senha"
          type="password"
          obrigatorio
          autoComplete="current-password"
          value={dados.senha}
          onChange={alterar}
          erro={erros.senha}
        />

        <p className="legenda-obrigatorio">* obrigatório</p>

        <Botao type="submit" carregando={enviando} textoCarregando="Entrando...">
          Entrar
        </Botao>
      </form>
    </div>
  )
}
