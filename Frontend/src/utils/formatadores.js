// Formatação de dados para exibir na tela (e máscaras dos campos de formulário).

/** Remove tudo que não for dígito. */
export function apenasDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

/**
 * Máscara de CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos), aplicada aos poucos enquanto digita.
 * '52998224725' → '529.982.247-25' · '11222333000181' → '11.222.333/0001-81'
 */
export function formatarCpfCnpj(valor) {
  const d = apenasDigitos(valor).slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/**
 * Máscara de telefone: (00) 0000-0000 (fixo, 10 dígitos) ou (00) 00000-0000 (celular, 11).
 * Também serve para exibir telefones gravados sem máscara.
 */
export function formatarTelefone(valor) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length === 0) {
    return ''
  }
  if (d.length <= 2) {
    return `(${d}`
  }
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) {
    return `(${ddd}) ${resto}`
  }
  // Celular (11 dígitos) tem 5 antes do traço; fixo tem 4.
  const meio = d.length === 11 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`
}

/**
 * Lê uma data do backend. Ele manda LocalDateTime em ISO sem fuso
 * (ex.: '2026-11-25T14:03:12.123456'), no horário local do servidor.
 * O parse é feito à mão porque frações com mais de 3 dígitos não são padrão em todos os navegadores.
 */
export function lerDataApi(texto) {
  if (!texto) {
    return null
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(texto))
  if (!partes) {
    return null
  }
  const [, ano, mes, dia, hora = '0', minuto = '0', segundo = '0'] = partes
  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo),
  )
}

const doisDigitos = (n) => String(n).padStart(2, '0')

/** '2026-11-25T14:03:12' → '25/11/2026' · vazio → '—' */
export function formatarData(texto) {
  const data = lerDataApi(texto)
  if (!data) {
    return '—'
  }
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`
}

/** '2026-11-25T14:03:12' → '25/11/2026 14:03' · vazio → '—' */
export function formatarDataHora(texto) {
  const data = lerDataApi(texto)
  if (!data) {
    return '—'
  }
  return `${formatarData(texto)} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
}

/** Data de hoje em dd/mm/aaaa (resumo da Nova OS). */
export function dataDeHoje(agora = new Date()) {
  return `${doisDigitos(agora.getDate())}/${doisDigitos(agora.getMonth() + 1)}/${agora.getFullYear()}`
}

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 1234.5 → 'R$ 1.234,50' (o espaço depois de R$ é um espaço não separável). */
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(Number(valor))) {
    return '—'
  }
  return formatoMoeda.format(Number(valor))
}

/**
 * Converte o valor digitado no formulário em número.
 * Aceita '1234,56', '1.234,56', '1234.56' e 'R$ 1.234,56'. Inválido → NaN.
 */
export function converterValor(texto) {
  let limpo = String(texto ?? '')
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
  if (limpo === '') {
    return NaN
  }
  if (limpo.includes(',')) {
    // Formato brasileiro: ponto separa milhar, vírgula separa decimais.
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  }
  if (!/^\d+(\.\d+)?$/.test(limpo)) {
    return NaN
  }
  return Number(limpo)
}

/** Corta textos longos para tabelas: 'abcdef', 4 → 'abc…' */
export function truncar(texto, maximo = 60) {
  const t = String(texto ?? '')
  if (t.length <= maximo) {
    return t
  }
  return `${t.slice(0, maximo - 1).trimEnd()}…`
}
