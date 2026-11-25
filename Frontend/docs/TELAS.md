# SoS – Especificação de telas e regras de interface

Este documento traduz o SRS (`SRS.md`) e a API (`API.md`) em telas. Se houver wireframes em
`docs/wireframes/`, use-os como referência de **layout**; as **regras** deste documento e do SRS
continuam valendo.

## 1. Papéis e o que cada um vê

Os papéis vêm em `usuario.cargos[]` (resposta de `/auth/login` e `/auth/me`). **Um usuário pode
ter os dois papéis** (ex.: `autonomo`); nesse caso ele vê a união dos menus e das ações.

| Menu / tela | Atendente | Prestador |
|---|---|---|
| Ordens de serviço (lista) | todas as OS | só as dele (o backend já filtra) |
| Detalhe da OS | sim | só as dele |
| Nova OS | sim | não |
| Clientes (lista, novo, editar) | sim | não |

O frontend esconde o que o papel não pode usar, mas **quem decide é o backend** (RNF002). Um `403`
vindo da API deve sempre ser tratado com uma mensagem clara, nunca com tela quebrada.

## 2. Ciclo de vida da OS

```text
                 gerar orçamento (Prestador)          aprovar (Atendente)
   ┌────────┐ ─────────────────────────────► ┌──────────────────────┐ ───────────► ┌─────────────┐
   │ ABERTA │                                 │ AGUARDANDO_APROVACAO │              │ EM_EXECUCAO │
   └────────┘ ◄───────────────────────────── └──────────────────────┘              └─────────────┘
        ▲            recusar (Atendente)                                                  │
        │                                                     marcar pronta (Prestador)   ▼
        │                                                                            ┌────────┐
        │                                                       concluir (Atendente) │ PRONTA │
        │                                                     ┌───────────────────── └────────┘
        │                                                     ▼
        │                                               ┌───────────┐
        │                                               │ ENCERRADA │
        │                                               └───────────┘
  cancelar (Atendente, com motivo) a partir de qualquer status, exceto ENCERRADA e CANCELADA
                                                ──────────► ┌───────────┐
                                                            │ CANCELADA │
                                                            └───────────┘
```

### Rótulos e cores de status (usar sempre os mesmos, em toda a aplicação)

| Valor da API | Rótulo na tela | Cor sugerida |
|---|---|---|
| `ABERTA` | Aberta | azul |
| `AGUARDANDO_APROVACAO` | Aguardando aprovação | âmbar |
| `EM_EXECUCAO` | Em execução | roxo/índigo |
| `PRONTA` | Pronta | verde |
| `ENCERRADA` | Encerrada | cinza |
| `CANCELADA` | Cancelada | vermelho |
| Orçamento `PENDENTE` | Pendente | âmbar |
| Orçamento `APROVADO` | Aprovado | verde |
| Orçamento `RECUSADO` | Recusado | vermelho |

O status nunca deve depender só da cor: o badge sempre mostra o texto.

## 3. Matriz de ações na tela de detalhe da OS

"Responsável" = `os.prestador.id === usuarioLogado.id`.

| Ação | Quem | Status exigido | Campos | Endpoint |
|---|---|---|---|---|
| Gerar orçamento | Prestador **responsável** | `ABERTA` | descrição*, valor* (> 0), prazo em dias* (inteiro > 0) | `POST /os/{id}/orcamentos` |
| Aprovar orçamento | Atendente | `AGUARDANDO_APROVACAO` e orçamento `PENDENTE` | — (pede confirmação) | `POST /orcamentos/{idOrcamento}/decisao` `{aprovado:true}` |
| Recusar orçamento | Atendente | idem | — (pede confirmação) | idem com `{aprovado:false}` |
| Registrar andamento | Prestador **responsável** | `EM_EXECUCAO` | observação*, caixa "Serviço concluído — marcar como Pronta" | `POST /os/{id}/andamentos` |
| Concluir OS | Atendente | `PRONTA` | observação (opcional na API) | `POST /os/{id}/encerramento` |
| Cancelar OS | Atendente | qualquer, exceto `ENCERRADA`/`CANCELADA` | motivo* (justificativa) | `POST /os/{id}/cancelamento` |

`*` = obrigatório.

Regras:
- Concluir, cancelar, aprovar e recusar **sempre** pedem confirmação explícita antes de chamar a
  API (RF003, RF005). Se a pessoa desistir na confirmação, nada é enviado e a OS fica como estava.
- Se o Atendente abrir uma OS que não está `PRONTA`, o botão "Concluir" não aparece (ou aparece
  desabilitado com a explicação "O prestador ainda não finalizou o serviço").
- OS `ENCERRADA` ou `CANCELADA`: nenhuma ação; mostrar um aviso "Esta OS foi finalizada".
- Depois de qualquer ação bem-sucedida: mostrar mensagem de sucesso e **recarregar** a OS
  (`GET /os/{id}`) para exibir o novo status, orçamentos e histórico.
- Toda a parte de dados da OS é **somente leitura** (RF006). As ações ficam em um painel/área
  separada ("Ações") e cada uma abre um formulário em diálogo (modal) ou seção expansível.

## 4. Telas

### 4.1 Login (`/login`)
- Campos: usuário*, senha*. Botão "Entrar".
- Erro `401`/`400`: "Usuário ou senha inválidos."
- Se a pessoa foi redirecionada por sessão expirada, mostrar "Sua sessão expirou. Entre novamente."
- Após login, ir para a página que a pessoa tentou abrir, ou para `/os`.

### 4.2 Layout (todas as telas logadas)
- Cabeçalho com nome do sistema ("SoS"), nome do usuário, papéis (ex.: "Atendente · Prestador") e
  botão "Sair" (`POST /auth/logout`).
- Menu: "Ordens de serviço", "Nova OS" (Atendente), "Clientes" (Atendente).
- Desktop: menu lateral. Celular (< 768 px): menu recolhido atrás de um botão (hambúrguer).
- Funciona de 360 px a 1920 px sem rolagem horizontal (RNF014).

### 4.3 Lista de OS (`/os`) – RF006
- Filtros: número da OS, cliente (nome ou CPF/CNPJ), status (select com "Todos"). Cliente e status
  combináveis. Botões "Buscar" e "Limpar".
- Colunas: Nº, cliente, descrição (truncada), prestador, status (badge), data de abertura.
- Desktop: tabela. Celular: cartões empilhados com as mesmas informações.
- Clicar na linha/cartão abre o detalhe.
- Vazio: "Nenhuma OS encontrada para esta pesquisa." com botão para limpar os filtros.
- Atendente vê o botão "Nova OS" no topo.
- Prestador: título "Minhas ordens de serviço".

### 4.4 Detalhe da OS (`/os/:id`) – RF003, RF004, RF005, RF006
Seções, nesta ordem:
1. **Cabeçalho:** "OS nº {numero}", badge de status, datas de abertura e finalização.
2. **Cliente:** nome, CPF/CNPJ (formatado), telefone, e-mail.
3. **Serviço:** descrição e prestador responsável.
4. **Ações:** conforme a matriz da seção 3 (só aparece se houver alguma ação possível).
5. **Orçamentos:** todos, inclusive os recusados, com descrição, valor (R$), prazo, status, data
   de criação, data da decisão e quem decidiu.
6. **Histórico:** ordem cronológica, cada item com data/hora, usuário, observação e a transição
   de status ("Aberta → Aguardando aprovação"), quando houver.
- `403`: "Você não tem acesso a esta OS. Ela está sob responsabilidade de outro prestador."
- `404`: "OS não encontrada." com link para a lista.

### 4.5 Nova OS (`/os/nova`) – RF002 (Atendente)
Fluxo em uma única página, em etapas visuais:
1. **Cliente:** campo de busca (nome ou CPF/CNPJ) → `GET /clientes?busca=`; lista de resultados
   para escolher. Se não encontrar: botão "Cadastrar novo cliente", que abre o cadastro e, ao
   salvar, **volta para a Nova OS com o cliente já selecionado**.
2. **Serviço:** descrição* (textarea) e prestador responsável* (select com `GET /prestadores`).
3. **Resumo:** cliente, serviço, prestador e data de abertura (hoje, só informativa).
4. Botão "Abrir OS". Sucesso: mensagem "OS nº {numero} aberta com sucesso" e link para o detalhe.

Validações: sem cliente, sem descrição ou sem prestador → não envia e destaca o campo.

### 4.6 Clientes (`/clientes`) – RF001 (Atendente)
- Busca por nome ou CPF/CNPJ. Lista com nome, CPF/CNPJ, telefone, e-mail. Botão "Editar" em cada
  linha e "Novo cliente" no topo.

### 4.7 Novo / editar cliente (`/clientes/novo`, `/clientes/:id/editar`) – RF001
- Campos: nome*, CPF ou CNPJ*, telefone*, e-mail (opcional).
- CPF/CNPJ: máscara automática conforme a quantidade de dígitos (11 = CPF, 14 = CNPJ) e validação
  dos **dígitos verificadores** no frontend antes de enviar.
- Telefone: máscara `(00) 00000-0000` / `(00) 0000-0000`.
- E-mail: se preenchido, formato válido.
- `409`: "Já existe um cliente com este CPF/CNPJ." e um link "Ver cadastro existente" (buscar o
  cliente pelo CPF/CNPJ e levar à edição dele). Não cria novo registro.

### 4.8 Páginas de erro
- `/sem-permissao` (ou mensagem inline) para 403 e uma página 404 para rotas inexistentes.

## 5. Regras gerais de formulário e mensagens (RNF012)
- Campos obrigatórios marcados com `*` e legenda "* obrigatório".
- Mensagens de erro em português, **abaixo do campo**, dizendo o que corrigir
  (ex.: "Informe um CPF ou CNPJ válido.", "O valor deve ser maior que zero.").
- Erro da API com `campo` → mostrar no campo correspondente; sem `campo` → mensagem no topo do
  formulário.
- Botão de envio desabilitado e com texto "Salvando..." enquanto a requisição está em andamento
  (evita envio duplo).
- Datas no formato `dd/mm/aaaa hh:mm`; valores em `R$ 1.234,56`.

## 6. Sessão (RNF001)
- Ao abrir a aplicação, chamar `GET /auth/me` para saber se já há sessão.
- Qualquer `401` de qualquer chamada (exceto o próprio login) → limpar o usuário, ir para
  `/login` com o aviso de sessão expirada e, depois do login, voltar à página onde a pessoa estava.
