# SoS – Endpoints da API (referência para o frontend)

> Transcrição do documento "SoS_API_Endpoints_Front.pdf" entregue pela equipe de backend.
> **O código do backend em `../Backend` é a fonte da verdade.** Se algo aqui divergir do código
> (nomes de campos, valores de enum, formato de erro), siga o código e anote a divergência em
> `docs/NOTAS_BACKEND.md`.

## Informações gerais

| Item | Valor |
|---|---|
| URL base | `http://localhost:8080` |
| Swagger | `http://localhost:8080/swagger-ui.html` |
| Autenticação | Sessão por **cookie**. Toda requisição precisa de `credentials: 'include'` (fetch). |
| Formato de erro | `{ "campo": "...", "mensagem": "..." }` |
| Usuários de teste | `atendente`, `prestador`, `prestador2`, `autonomo` — senha `123` |

Códigos HTTP de erro: `400` inválido · `401` sem login · `403` sem permissão · `404` não encontrado · `409` duplicado.

## Autenticação

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | Todos | `{ login, senha }` | `{ id, nomeUsuario, login, cargos[] }` |
| GET | `/auth/me` | Logado | — | `{ id, nomeUsuario, login, cargos[] }` · `401` se não logado |
| POST | `/auth/logout` | Logado | — | `204` |

## Clientes

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/clientes` | Atendente | `{ nome, cpfCnpj, telefone, email? }` | `201` Cliente · `409` CPF/CNPJ já cadastrado |
| PUT | `/clientes/{id}` | Atendente | igual ao POST | Cliente |
| GET | `/clientes?busca=` | Atendente | `busca` = nome ou CPF/CNPJ (opcional) | `Cliente[]` |
| GET | `/clientes/{id}` | Atendente | — | Cliente |

## Ordens de serviço

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| GET | `/prestadores` | Atendente | — | `[{ id, nome, tipoUsuario }]` |
| POST | `/os` | Atendente | `{ clienteId, descricao, prestadorId }` | `201` OS (status `ABERTA`) |
| GET | `/os?numero=&cliente=&status=` | Atendente, Prestador | filtros opcionais e combináveis | `OS[]` (o prestador recebe só as dele) |
| GET | `/os/{id}` | Atendente, Prestador | — | OS + cliente completo + `orcamentos[]` + `historico[]` |

## Orçamento, andamento e encerramento

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/os/{id}/orcamentos` | Prestador responsável | `{ descricao, valor, prazoDias }` | `201` Orcamento · OS → `AGUARDANDO_APROVACAO` |
| POST | `/orcamentos/{id}/decisao` | Atendente | `{ aprovado: true \| false }` (id **do orçamento**) | Orcamento · OS → `EM_EXECUCAO` ou `ABERTA` |
| POST | `/os/{id}/andamentos` | Prestador responsável | `{ observacao, status?: "PRONTA" }` | `201` Historico · com `PRONTA`, OS → `PRONTA` |
| POST | `/os/{id}/encerramento` | Atendente | `{ observacao? }` (só OS `PRONTA`) | OS · OS → `ENCERRADA` |
| POST | `/os/{id}/cancelamento` | Atendente | `{ motivo }` | OS · OS → `CANCELADA` |

## Objetos de resposta

```text
Cliente    { id, nome, cpfCnpj, telefone, email, ativo }
OS         { id, numero, descricao, status, dataAbertura, dataFinalizacao,
             cliente: { id, nome, cpfCnpj },
             prestador: { id, nome, tipoUsuario } }
OS (GET /os/{id}) = OS acima + cliente completo + orcamentos[] + historico[]
Orcamento  { id, descricao, valor, prazoDias, status, dataCriacao, dataDecisao,
             decididoPor: { id, nome } }
Historico  { id, observacao, statusAnterior, statusNovo, dataHora,
             usuario: { id, nome } }
```

## Enums

- **Status da OS:** `ABERTA`, `AGUARDANDO_APROVACAO`, `EM_EXECUCAO`, `PRONTA`, `ENCERRADA`, `CANCELADA`
- **Status do orçamento:** `PENDENTE`, `APROVADO`, `RECUSADO`

## Pontos a confirmar no código do backend

O PDF não responde a estas perguntas; confirme no código antes de implementar:

1. Valores exatos de `cargos[]` (ex.: `"ATENDENTE"`, `"PRESTADOR"`?) e de `tipoUsuario`.
2. Configuração de CORS (origens permitidas, `allowCredentials`) e se há proteção CSRF ativa.
3. Nome e atributos do cookie de sessão (`JSESSIONID`? `SameSite`? `Path`?).
4. Formato do erro de validação quando há **vários** campos inválidos (objeto único ou lista?).
5. Se `cpfCnpj` e `telefone` devem ser enviados só com dígitos ou com máscara.
6. O que o filtro `cliente` de `GET /os` aceita (nome, CPF/CNPJ ou id).
7. Formato das datas (ISO 8601 com ou sem fuso) e tipo de `valor` (número ou string).
8. Se o `id` em `/prestadores` é o mesmo `id` do usuário retornado por `/auth/me`
   (necessário para saber se o usuário logado é o "prestador responsável" de uma OS).
