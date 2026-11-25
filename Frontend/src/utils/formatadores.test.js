import { describe, expect, it } from 'vitest'
import {
  apenasDigitos,
  converterValor,
  dataDeHoje,
  formatarCpfCnpj,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
  lerDataApi,
  truncar,
} from './formatadores'

// Intl usa espaço não separável depois de "R$"; trocamos por espaço comum para comparar.
const normalizar = (texto) => texto.replace(/ /g, ' ')

describe('apenasDigitos', () => {
  it('remove tudo que não é número', () => {
    expect(apenasDigitos('529.982.247-25')).toBe('52998224725')
    expect(apenasDigitos(null)).toBe('')
  })
})

describe('formatarCpfCnpj', () => {
  it('formata CPF completo', () => {
    expect(formatarCpfCnpj('52998224725')).toBe('529.982.247-25')
  })

  it('formata CNPJ completo', () => {
    expect(formatarCpfCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('aplica a máscara aos poucos enquanto digita', () => {
    expect(formatarCpfCnpj('529')).toBe('529')
    expect(formatarCpfCnpj('5299')).toBe('529.9')
    expect(formatarCpfCnpj('5299822')).toBe('529.982.2')
    expect(formatarCpfCnpj('5299822472')).toBe('529.982.247-2')
    expect(formatarCpfCnpj('112223330001')).toBe('11.222.333/0001')
  })

  it('reaplica a máscara em texto já formatado e corta depois de 14 dígitos', () => {
    expect(formatarCpfCnpj('529.982.247-25')).toBe('529.982.247-25')
    expect(formatarCpfCnpj('112223330001819999')).toBe('11.222.333/0001-81')
  })
})

describe('formatarTelefone', () => {
  it('celular com 11 dígitos', () => {
    expect(formatarTelefone('17999990000')).toBe('(17) 99999-0000')
  })

  it('fixo com 10 dígitos', () => {
    expect(formatarTelefone('1733334444')).toBe('(17) 3333-4444')
  })

  it('parcial enquanto digita', () => {
    expect(formatarTelefone('')).toBe('')
    expect(formatarTelefone('1')).toBe('(1')
    expect(formatarTelefone('179')).toBe('(17) 9')
    expect(formatarTelefone('1799999')).toBe('(17) 9999-9')
  })

  it('reformata telefone gravado com outra máscara', () => {
    expect(formatarTelefone('(17) 99999-0000')).toBe('(17) 99999-0000')
    expect(formatarTelefone('17 99999 0000')).toBe('(17) 99999-0000')
  })
})

describe('datas', () => {
  it('lê ISO sem fuso com microssegundos', () => {
    const d = lerDataApi('2026-11-25T14:03:12.123456')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(25)
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(3)
  })

  it('formata data e hora como dd/mm/aaaa hh:mm', () => {
    expect(formatarDataHora('2026-01-05T08:07:00')).toBe('05/01/2026 08:07')
    expect(formatarData('2026-01-05T08:07:00')).toBe('05/01/2026')
  })

  it('valor vazio ou inválido vira travessão', () => {
    expect(formatarDataHora(null)).toBe('—')
    expect(formatarData('')).toBe('—')
    expect(formatarData('ontem')).toBe('—')
  })

  it('dataDeHoje usa a data informada', () => {
    expect(dataDeHoje(new Date(2026, 10, 25))).toBe('25/11/2026')
  })
})

describe('formatarMoeda', () => {
  it('formata em reais', () => {
    expect(normalizar(formatarMoeda(1234.56))).toBe('R$ 1.234,56')
    expect(normalizar(formatarMoeda(800))).toBe('R$ 800,00')
    expect(normalizar(formatarMoeda('0.5'))).toBe('R$ 0,50')
  })

  it('valor ausente vira travessão', () => {
    expect(formatarMoeda(null)).toBe('—')
    expect(formatarMoeda('abc')).toBe('—')
  })
})

describe('converterValor', () => {
  it('aceita formatos brasileiro e com ponto decimal', () => {
    expect(converterValor('1234,56')).toBe(1234.56)
    expect(converterValor('1.234,56')).toBe(1234.56)
    expect(converterValor('1234.56')).toBe(1234.56)
    expect(converterValor('R$ 150,00')).toBe(150)
    expect(converterValor('0')).toBe(0)
  })

  it('texto inválido devolve NaN', () => {
    expect(converterValor('')).toBeNaN()
    expect(converterValor('abc')).toBeNaN()
    expect(converterValor('-10')).toBeNaN()
    expect(converterValor('1,2,3')).toBeNaN()
  })
})

describe('truncar', () => {
  it('mantém textos curtos e corta os longos com reticências', () => {
    expect(truncar('abc', 5)).toBe('abc')
    expect(truncar('abcdefgh', 5)).toBe('abcd…')
    expect(truncar(null)).toBe('')
  })
})
