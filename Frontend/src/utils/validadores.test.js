import { describe, expect, it } from 'vitest'
import {
  cnpjValido,
  cpfCnpjValido,
  cpfValido,
  emailValido,
  errosDaApi,
  inteiroPositivo,
  obrigatorio,
  semErros,
  telefoneValido,
  validarCliente,
  validarNovaOrdem,
  validarOrcamento,
} from './validadores'

describe('cpfValido', () => {
  it('aceita CPF válido com e sem máscara', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('52998224725')).toBe(true)
    expect(cpfValido('111.444.777-35')).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    expect(cpfValido('529.982.247-24')).toBe(false)
    expect(cpfValido('52998224735')).toBe(false)
  })

  it('recusa todos os dígitos iguais e tamanho errado', () => {
    expect(cpfValido('000.000.000-00')).toBe(false)
    expect(cpfValido('11111111111')).toBe(false)
    expect(cpfValido('5299822472')).toBe(false)
    expect(cpfValido('')).toBe(false)
  })
})

describe('cnpjValido', () => {
  it('aceita CNPJ válido com e sem máscara', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjValido('11222333000181')).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    expect(cnpjValido('11.222.333/0001-82')).toBe(false)
    expect(cnpjValido('11222333000191')).toBe(false)
  })

  it('recusa todos os dígitos iguais e tamanho errado', () => {
    expect(cnpjValido('00000000000000')).toBe(false)
    expect(cnpjValido('1122233300018')).toBe(false)
  })
})

describe('cpfCnpjValido', () => {
  it('decide pelo número de dígitos', () => {
    expect(cpfCnpjValido('529.982.247-25')).toBe(true)
    expect(cpfCnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cpfCnpjValido('123456789012')).toBe(false)
    expect(cpfCnpjValido(null)).toBe(false)
  })
})

describe('emailValido', () => {
  it('aceita formatos comuns', () => {
    expect(emailValido('maria@email.com')).toBe(true)
    expect(emailValido('joao.silva+os@empresa.com.br')).toBe(true)
  })

  it('recusa formatos inválidos', () => {
    expect(emailValido('maria')).toBe(false)
    expect(emailValido('maria@')).toBe(false)
    expect(emailValido('maria@email')).toBe(false)
    expect(emailValido('ma ria@email.com')).toBe(false)
    expect(emailValido('')).toBe(false)
  })
})

describe('outros validadores', () => {
  it('obrigatorio ignora espaços', () => {
    expect(obrigatorio('  ')).toBe(false)
    expect(obrigatorio(null)).toBe(false)
    expect(obrigatorio('a')).toBe(true)
  })

  it('telefoneValido exige 10 ou 11 dígitos', () => {
    expect(telefoneValido('(17) 99999-0000')).toBe(true)
    expect(telefoneValido('(17) 3333-4444')).toBe(true)
    expect(telefoneValido('99999-0000')).toBe(false)
  })

  it('inteiroPositivo', () => {
    expect(inteiroPositivo('3')).toBe(true)
    expect(inteiroPositivo(10)).toBe(true)
    expect(inteiroPositivo('0')).toBe(false)
    expect(inteiroPositivo('-1')).toBe(false)
    expect(inteiroPositivo('2,5')).toBe(false)
    expect(inteiroPositivo('')).toBe(false)
  })
})

describe('validarCliente', () => {
  const valido = {
    nome: 'Maria',
    cpfCnpj: '529.982.247-25',
    telefone: '(17) 99999-0000',
    email: '',
  }

  it('cliente válido (e-mail é opcional)', () => {
    expect(validarCliente(valido)).toEqual({})
    expect(semErros(validarCliente(valido))).toBe(true)
  })

  it('aponta todos os campos com problema de uma vez', () => {
    const erros = validarCliente({ nome: '', cpfCnpj: '123', telefone: '', email: 'x@' })
    expect(Object.keys(erros).sort()).toEqual(['cpfCnpj', 'email', 'nome', 'telefone'])
    expect(erros.cpfCnpj).toMatch(/CPF ou CNPJ válido/)
  })

  it('CPF/CNPJ vazio tem mensagem própria', () => {
    expect(validarCliente({ ...valido, cpfCnpj: '' }).cpfCnpj).toBe(
      'Informe o CPF ou o CNPJ do cliente.',
    )
  })
})

describe('validarOrcamento', () => {
  it('orçamento válido', () => {
    expect(validarOrcamento({ descricao: 'Troca', valor: '150,00', prazoDias: '3' })).toEqual({})
  })

  it('valor tem que ser maior que zero e prazo inteiro positivo', () => {
    const erros = validarOrcamento({ descricao: '', valor: '0', prazoDias: '0' })
    expect(erros.descricao).toBeDefined()
    expect(erros.valor).toBe('O valor deve ser maior que zero.')
    expect(erros.prazoDias).toMatch(/inteiro/)
  })

  it('valor em formato inválido', () => {
    expect(validarOrcamento({ descricao: 'a', valor: 'abc', prazoDias: '1' }).valor).toMatch(
      /inválido/,
    )
  })
})

describe('errosDaApi', () => {
  it('erro de um campo do formulário vai para o campo', () => {
    const erro = { status: 400, campo: 'valor', mensagem: 'O valor deve ser maior que zero.' }
    expect(errosDaApi(erro, ['descricao', 'valor'])).toEqual({
      erros: { valor: 'O valor deve ser maior que zero.' },
      geral: '',
    })
  })

  it('campo que não está no formulário (ex.: status) vai para o topo', () => {
    const erro = { status: 400, campo: 'status', mensagem: 'Somente OS Aberta.' }
    expect(errosDaApi(erro, ['valor'])).toEqual({ erros: {}, geral: 'Somente OS Aberta.' })
  })

  it('sem campo vai para o topo', () => {
    expect(errosDaApi({ status: 403, campo: null, mensagem: 'Sem permissão.' }, ['x']).geral).toBe(
      'Sem permissão.',
    )
  })

  it('traduz nomes de campo do backend', () => {
    const erro = { campo: 'clienteId', mensagem: 'Selecione o cliente.' }
    expect(errosDaApi(erro, ['cliente'], { clienteId: 'cliente' }).erros).toEqual({
      cliente: 'Selecione o cliente.',
    })
  })

  it('sem mensagem usa um texto padrão', () => {
    expect(errosDaApi(undefined, []).geral).toMatch(/Tente novamente/)
  })
})

describe('validarNovaOrdem', () => {
  it('exige cliente, descrição e prestador', () => {
    expect(Object.keys(validarNovaOrdem({ cliente: null, descricao: ' ', prestadorId: '' }))).toEqual(
      ['cliente', 'descricao', 'prestadorId'],
    )
    expect(validarNovaOrdem({ cliente: { id: 1 }, descricao: 'x', prestadorId: '2' })).toEqual({})
  })
})
