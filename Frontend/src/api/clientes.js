import { montarQuery, requisicao } from './client'

// Cliente: { id, nome, cpfCnpj (só dígitos), telefone, email, ativo }
// Corpo de criar/atualizar: { nome, cpfCnpj, telefone, email }

/** GET /clientes?busca= — sem busca, lista todos. busca = parte do nome ou do CPF/CNPJ. */
export function listarClientes(busca = '') {
  return requisicao(`/clientes${montarQuery({ busca })}`)
}

/** GET /clientes/{id} */
export function buscarCliente(id) {
  return requisicao(`/clientes/${id}`)
}

/** POST /clientes → 201 Cliente · 409 se o CPF/CNPJ já existir */
export function criarCliente(dados) {
  return requisicao('/clientes', { metodo: 'POST', corpo: dados })
}

/** PUT /clientes/{id} → Cliente · 409 se o CPF/CNPJ for de outro cliente */
export function atualizarCliente(id, dados) {
  return requisicao(`/clientes/${id}`, { metodo: 'PUT', corpo: dados })
}
