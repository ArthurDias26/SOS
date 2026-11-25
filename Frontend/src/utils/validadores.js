// Validações dos formulários. As regras seguem o backend (cliente/CpfCnpjValidator.java etc.)
// e as mensagens dizem qual campo corrigir e como (RNF012).

import { apenasDigitos, converterValor } from './formatadores'

/** Texto preenchido (ignorando espaços). */
export function obrigatorio(valor) {
  return String(valor ?? '').trim() !== ''
}

function todosIguais(numero) {
  return numero.split('').every((c) => c === numero[0])
}

function digitoVerificador(soma) {
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

/** CPF com dígitos verificadores corretos (aceita com ou sem máscara). */
export function cpfValido(valor) {
  const cpf = apenasDigitos(valor)
  if (cpf.length !== 11 || todosIguais(cpf)) {
    return false
  }
  const calcular = (quantidade) => {
    let soma = 0
    for (let i = 0; i < quantidade; i++) {
      soma += Number(cpf[i]) * (quantidade + 1 - i)
    }
    return digitoVerificador(soma)
  }
  return calcular(9) === Number(cpf[9]) && calcular(10) === Number(cpf[10])
}

/** CNPJ com dígitos verificadores corretos (aceita com ou sem máscara). */
export function cnpjValido(valor) {
  const cnpj = apenasDigitos(valor)
  if (cnpj.length !== 14 || todosIguais(cnpj)) {
    return false
  }
  const calcular = (quantidade) => {
    // Pesos: 5,4,3,2,9,8,...,2 para o 1º dígito e 6,5,4,3,2,9,...,2 para o 2º.
    let peso = quantidade - 7
    let soma = 0
    for (let i = 0; i < quantidade; i++) {
      soma += Number(cnpj[i]) * peso
      peso = peso === 2 ? 9 : peso - 1
    }
    return digitoVerificador(soma)
  }
  return calcular(12) === Number(cnpj[12]) && calcular(13) === Number(cnpj[13])
}

/** 11 dígitos → valida como CPF; 14 → como CNPJ; outro tamanho é inválido. */
export function cpfCnpjValido(valor) {
  const d = apenasDigitos(valor)
  if (d.length === 11) {
    return cpfValido(d)
  }
  if (d.length === 14) {
    return cnpjValido(d)
  }
  return false
}

/** Formato nome@dominio.ext, sem espaços. */
export function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor ?? '').trim())
}

/** Telefone com DDD: 10 (fixo) ou 11 (celular) dígitos. */
export function telefoneValido(valor) {
  const d = apenasDigitos(valor)
  return d.length === 10 || d.length === 11
}

/** Número inteiro maior que zero ('3' sim; '0', '-1', '2,5' não). */
export function inteiroPositivo(valor) {
  const texto = String(valor ?? '').trim()
  return /^\d+$/.test(texto) && Number(texto) > 0
}

// ---------- Validação de formulários inteiros ----------
// Cada função devolve um objeto { campo: 'mensagem' } só com os campos que têm erro.
// Objeto vazio = tudo certo. O backend devolve só o primeiro erro, por isso validamos tudo antes.

/** Cliente: { nome, cpfCnpj, telefone, email } */
export function validarCliente({ nome, cpfCnpj, telefone, email }) {
  const erros = {}
  if (!obrigatorio(nome)) {
    erros.nome = 'Informe o nome do cliente.'
  }
  if (!obrigatorio(cpfCnpj)) {
    erros.cpfCnpj = 'Informe o CPF ou o CNPJ do cliente.'
  } else if (!cpfCnpjValido(cpfCnpj)) {
    erros.cpfCnpj = 'Informe um CPF ou CNPJ válido. Confira os números digitados.'
  }
  if (!obrigatorio(telefone)) {
    erros.telefone = 'Informe o telefone do cliente.'
  } else if (!telefoneValido(telefone)) {
    erros.telefone = 'Informe o telefone com DDD, no formato (00) 00000-0000 ou (00) 0000-0000.'
  }
  if (obrigatorio(email) && !emailValido(email)) {
    erros.email = 'E-mail inválido. Use o formato nome@exemplo.com ou deixe em branco.'
  }
  return erros
}

/** Orçamento: { descricao, valor (texto digitado), prazoDias (texto) } */
export function validarOrcamento({ descricao, valor, prazoDias }) {
  const erros = {}
  if (!obrigatorio(descricao)) {
    erros.descricao = 'Descreva o serviço que será feito.'
  }
  if (!obrigatorio(valor)) {
    erros.valor = 'Informe o valor do orçamento.'
  } else {
    const numero = converterValor(valor)
    if (Number.isNaN(numero)) {
      erros.valor = 'Valor inválido. Use somente números, por exemplo 150,00.'
    } else if (numero <= 0) {
      erros.valor = 'O valor deve ser maior que zero.'
    }
  }
  if (!obrigatorio(prazoDias)) {
    erros.prazoDias = 'Informe o prazo em dias.'
  } else if (!inteiroPositivo(prazoDias)) {
    erros.prazoDias = 'O prazo deve ser um número inteiro de dias maior que zero.'
  }
  return erros
}

/** Nova OS: { cliente (objeto ou null), descricao, prestadorId } */
export function validarNovaOrdem({ cliente, descricao, prestadorId }) {
  const erros = {}
  if (!cliente) {
    erros.cliente = 'Pesquise e selecione o cliente.'
  }
  if (!obrigatorio(descricao)) {
    erros.descricao = 'Descreva o serviço solicitado.'
  }
  if (!obrigatorio(prestadorId)) {
    erros.prestadorId = 'Selecione o prestador responsável.'
  }
  return erros
}

/** true se o objeto de erros não tiver nenhum campo. */
export function semErros(erros) {
  return Object.keys(erros).length === 0
}

/**
 * Decide onde mostrar um erro da API (TELAS.md seção 5):
 * se erro.campo for um dos campos do formulário → embaixo do campo; senão → no topo.
 * mapaCampos traduz nomes do backend para nomes do formulário quando forem diferentes
 * (ex.: { clienteId: 'cliente' }).
 * Devolve { erros: { campo: mensagem }, geral: 'mensagem' | '' }.
 */
export function errosDaApi(erro, camposDoFormulario = [], mapaCampos = {}) {
  const mensagem = erro?.mensagem || 'Não foi possível concluir a operação. Tente novamente.'
  const campo = mapaCampos[erro?.campo] || erro?.campo
  if (campo && camposDoFormulario.includes(campo)) {
    return { erros: { [campo]: mensagem }, geral: '' }
  }
  return { erros: {}, geral: mensagem }
}
