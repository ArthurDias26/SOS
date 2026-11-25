# Notas sobre o backend (confirmadas lendo o código)

Lido em 25/11/2026 a partir de `../Backend/sos`. Caminhos abaixo são relativos a
`Backend/sos/src/main/java/br/com/sos/` (exceto quando indicado). **Se o código mudar, estas notas
precisam ser revisadas.**

## Respostas aos "Pontos a confirmar" de `API.md`

### 1. Valores de `cargos[]` e `tipoUsuario`
- `cargos[]` é um conjunto de strings: **`"ATENDENTE"`** e/ou **`"PRESTADOR"`**
  (`auth/Cargo.java`, constantes `ATENDENTE`/`PRESTADOR`; `auth/UsuarioResponse.java` devolve
  `Set<String> cargos`). A **ordem não é garantida** (é um `Set`).
- `tipoUsuario` (em `prestador` e em `/prestadores`): **`"PESSOA"`** ou **`"EQUIPE"`**
  (`auth/Usuario.java`, `TIPO_PESSOA`/`TIPO_EQUIPE`).
- Usuários de teste (`auth/DadosIniciais.java`), todos com senha `123`:

  | login | nome | tipoUsuario | cargos |
  |---|---|---|---|
  | `atendente` | Atendente Teste | PESSOA | ATENDENTE |
  | `prestador` | Prestador Teste | PESSOA | PRESTADOR |
  | `prestador2` | Equipe de Manutenção | EQUIPE | PRESTADOR |
  | `autonomo` | Prestador Autônomo | PESSOA | ATENDENTE, PRESTADOR |

### 2. CORS e CSRF
- **CSRF desligado** (`auth/SecurityConfig.java`: `.csrf(AbstractHttpConfigurer::disable)`).
  O frontend **não** precisa enviar token.
- CORS (`auth/SecurityConfig.java`, `corsConfigurationSource`): origens de `sos.cors.origens`
  (`src/main/resources/application.yml`, padrão `http://localhost:5173,http://localhost:3000,http://localhost:4200`,
  ou variável `CORS_ORIGENS`), métodos GET/POST/PUT/PATCH/DELETE/OPTIONS, todos os headers,
  **`allowCredentials = true`**.

### 3. Cookie de sessão
- Sessão HTTP padrão do Spring/Tomcat: cookie **`JSESSIONID`** (`auth/AuthController.java`,
  `auth/SecurityConfig.java` com `HttpSessionSecurityContextRepository`).
- Não há configuração de cookie no `application.yml`, então valem os padrões do Tomcat:
  `Path=/`, `HttpOnly`, **sem** `Secure` e **sem** `SameSite` explícito.
- Expira após **30 minutos sem uso** (`application.yml`: `server.servlet.session.timeout: 30m`).
- O login troca o id da sessão (`request.changeSessionId()`), contra fixação de sessão.

### 4. Formato de erro (inclusive com vários campos inválidos)
- Sempre **um único objeto** `{ "campo": string | null, "mensagem": string }`
  (`comum/ErroResponse.java`, `comum/GlobalExceptionHandler.java`).
- Com vários campos inválidos no `@Valid`, o backend devolve **só o primeiro** erro
  (`getBindingResult().getFieldError()`), e a ordem entre campos não é garantida.
  → O frontend valida **todos** os campos localmente antes de enviar.
- `campo` nem sempre é um campo de formulário: regras de estado usam `campo: "status"`
  (ex.: "Somente OS com status \"Aberta\" recebe orçamento."). Também aparecem `numero`/`status`
  em parâmetros de URL inválidos (`MethodArgumentTypeMismatchException`).
- Mensagens fixas relevantes:
  - `401` sem login (`SecurityConfig`, `authenticationEntryPoint`): `"Faça login para continuar."`
  - `401` login errado (`GlobalExceptionHandler.autenticacao`): `"Login ou senha inválidos."`
  - `400` login sem campo (`auth/LoginRequest.java`): `campo: "login"|"senha"`.
  - `403` por cargo (`@PreAuthorize`): `"Você não tem permissão para usar esta função."`
  - `403` OS de outro prestador (`os/OrdemServicoService.detalhar`): `"Você não pode ver a OS de outro prestador."`
  - `409` cliente (`cliente/ClienteService.java`): `campo: "cpfCnpj"`, `"Cliente já cadastrado."`
  - `400` corpo ilegível (ex.: `valor` não numérico, enum inválido): `campo: null`.
  - `500`: `"Erro interno. Tente novamente."`

### 5. `cpfCnpj` e `telefone`: com ou sem máscara?
- `cpfCnpj`: aceito **com ou sem máscara**; o backend remove `.`, `-`, `/` e espaços, confere os
  dígitos verificadores e **grava/devolve só os dígitos** (`cliente/CpfCnpjValidator.java`,
  `cliente/ClienteService.java`, `cliente/ClienteResponse.java`). Máximo 20 caracteres no request.
- `telefone`: **sem validação de formato**, só obrigatório e até 30 caracteres; é gravado como
  chegou (com `trim`) (`cliente/ClienteRequest.java`, `ClienteService.preencher`).
  → Decisão do frontend: enviar o telefone **com máscara** (como no exemplo do README do backend)
  e, ao exibir, sempre reformatar a partir dos dígitos (funciona para dados antigos sem máscara).
- `email`: opcional; `""` ou `null` viram `null`. Validado com `@Email`.

### 6. Filtro `cliente` de `GET /os`
- Texto livre: **parte do nome** (sem diferenciar maiúsculas) **ou parte do CPF/CNPJ**
  (`os/OrdemServicoService.listar`). Se o texto tiver dígitos, compara também os dígitos com o
  CPF/CNPJ (a máscara é ignorada). **Não aceita id.**
- `numero`: número **exato** (`Long`); texto não numérico → `400` com `campo: "numero"`.
- `status`: um valor do enum `StatusOS`; valor inválido → `400`.
- Resultado ordenado por número, **mais recentes primeiro**. Prestador sem cargo de atendente só
  recebe as OS dele; quem tem `ATENDENTE` (inclusive `autonomo`) recebe todas.
- `GET /clientes?busca=` usa a mesma lógica (nome ou dígitos do CPF/CNPJ).

### 7. Datas e `valor`
- Datas são `LocalDateTime` → JSON em **ISO 8601 sem fuso**, ex.: `"2026-11-25T14:03:12.123456"`.
  Confirmado com curl: a resposta de um `POST` (objeto ainda em memória) chegou com **7** casas
  (`"2026-11-25T08:31:46.8843123"`), e o `GET` (lido do banco) com 6. Representam o **horário local do servidor**.
  → O frontend faz o parse manual (ano, mês, dia, hora, minuto) para não depender de como cada
  navegador interpreta frações com mais de 3 dígitos.
- `valor` é `BigDecimal` → **número JSON** (ex.: `800.00`/`800.0`). O frontend envia número.
- `prazoDias` é `Integer`.

### 8. `id` de `/prestadores` x `id` de `/auth/me`
- **São o mesmo id** (id da tabela `usuario`): `os/PrestadorResponse.java` usa `u.getId()` e
  `auth/UsuarioResponse.java` usa o id do mesmo `Usuario`. Portanto
  "responsável" = `os.prestador.id === usuario.id`.

## Outros detalhes do código que afetam o frontend

| Endpoint | Detalhe confirmado | Fonte |
|---|---|---|
| `POST /auth/login` | Corpo `{ login, senha }`; responde `200` com `{ id, nomeUsuario, login, cargos }` | `auth/AuthController.java` |
| `POST /auth/logout` | `204`, sem corpo | `auth/SecurityConfig.java` |
| `POST /clientes` | `201` + `ClienteResponse` | `cliente/ClienteController.java` |
| `GET /clientes` | sem `busca` lista todos por nome | `cliente/ClienteService.buscar` |
| `GET /prestadores` | todos com cargo PRESTADOR (inclui `autonomo`), por nome | `os/OrdemServicoService.listarPrestadores` |
| `POST /os` | `201` + OS resumida; `404` se cliente/prestador não existir | `os/OrdemServicoController.java` |
| `GET /os/{id}` | `cliente` completo (`ClienteResponse`), `orcamentos` por id crescente, `historico` por data crescente | `os/OrdemServicoDetalheResponse.java`, `OrdemServicoService.detalhar` |
| `POST /os/{id}/orcamentos` | `201` + Orçamento; gera histórico `ABERTA → AGUARDANDO_APROVACAO` sem observação | `orcamento/OrcamentoService.gerar` |
| `POST /orcamentos/{id}/decisao` | `200` + Orçamento; `400` se não estiver `PENDENTE` ou se a OS não estiver `AGUARDANDO_APROVACAO` | `orcamento/OrcamentoService.decidir` |
| `POST /os/{id}/andamentos` | `{ observacao, status: null | "PRONTA" }`; `201` + item de histórico; `403` se não for o responsável | `os/AndamentoService.registrarAndamento` |
| `POST /os/{id}/encerramento` | corpo **opcional** `{ observacao }`; `200` + OS resumida | `os/AndamentoController.java` |
| `POST /os/{id}/cancelamento` | `{ motivo }` obrigatório; `200` + OS resumida | `os/AndamentoService.cancelar` |

- Histórico: `statusAnterior`/`statusNovo` são `null` quando é só observação de andamento.
  `observacao` pode ser `null` (ex.: mudança de status por orçamento/decisão).
- Cliente tem `ativo` (sempre `true` hoje; não há rota para desativar).

## Divergências entre o código e `API.md`/`SRS.md`

1. **Gerar orçamento não confere se o prestador é o responsável.** `OrcamentoService.gerar` só
   verifica o cargo `PRESTADOR`; qualquer prestador (ex.: `prestador2`) consegue gerar orçamento
   para a OS de outro, mesmo sem poder vê-la. `API.md`/`TELAS.md` dizem "Prestador responsável" e
   o SRS (RNF002) exige que o servidor recuse. **Frontend:** só mostra a ação para o responsável.
   O backend deveria ser corrigido (ver "Possíveis mudanças no backend").
2. **`prazoDias` não é validado como > 0 no backend** (só `@NotNull`). `TELAS.md` exige inteiro > 0.
   **Frontend:** valida antes de enviar.
3. **Erro de validação traz só um campo**, não uma lista (ver item 4).
4. **`API.md` não menciona o campo `status` opcional** no andamento como `null`; o código aceita
   `null`/ausente ou `"PRONTA"` (outro valor → `400`). Coincide no restante.
5. **Senha padrão do banco diverge:** `application.yml` usa `DB_PASSWORD` padrão `12345`, mas o
   `docker-compose.yml` e o README do backend usam `postgres`. Quem usa o docker-compose precisa
   rodar com `DB_PASSWORD=postgres`.
6. **Java:** o `pom.xml` exige **Java 21** (README também). Com Java 17 o build falha.
7. `OrcamentoService.gerar` não trava a linha da OS (diferente de andamento/encerramento): dois
   orçamentos simultâneos na mesma OS poderiam passar. Impacto baixo no frontend (botão
   desabilitado durante o envio evita duplo clique).

## Para a equipe de backend

Pontos encontrados na leitura do código. O frontend **não** alterou o backend; cada item tem o
contorno usado do lado do frontend.

1. **Gerar orçamento não confere o prestador responsável** (`orcamento/OrcamentoService.gerar`).
   Qualquer usuário com cargo `PRESTADOR` gera orçamento para qualquer OS, inclusive de outro
   prestador — contraria `API.md` ("Prestador responsável"), RF003 e RNF002.
   Sugestão (menor mudança): depois de buscar a OS, comparar `os.getPrestador().getId()` com o
   usuário logado e lançar `AcessoNegadoException`, como já faz `AndamentoService.registrarAndamento`.
   *Frontend:* mostra a ação só para o responsável e trata um `403` como qualquer outro erro.

   **Confirmado com curl em 25/11/2026** (backend local, banco recém-criado). Como reproduzir:
   ```bash
   B=http://localhost:8080; J='Content-Type: application/json'
   # 1. Sessões
   curl -s -c at.txt -H "$J" -d '{"login":"atendente","senha":"123"}'  $B/auth/login
   curl -s -c p2.txt -H "$J" -d '{"login":"prestador2","senha":"123"}' $B/auth/login
   # 2. Atendente cadastra cliente e abre OS para "prestador" (id 2)
   curl -s -b at.txt -H "$J" -d '{"nome":"Cliente Repro Bug","cpfCnpj":"111.444.777-35","telefone":"(17) 99999-0000"}' $B/clientes
   curl -s -b at.txt -H "$J" -d '{"clienteId":1,"descricao":"Repro bug responsavel","prestadorId":2}' $B/os
   # 3. prestador2 NÃO consegue ver a OS...
   curl -s -b p2.txt $B/os/1
   #    → 403 {"campo":null,"mensagem":"Você não pode ver a OS de outro prestador."}
   # 4. ...mas CONSEGUE gerar orçamento nela
   curl -s -b p2.txt -H "$J" -d '{"descricao":"Orcamento indevido","valor":10.5,"prazoDias":1}' $B/os/1/orcamentos
   #    → 201 {"id":1,...,"status":"PENDENTE",...}
   ```
   Resultado observado em `GET /os/1` (atendente): status `AGUARDANDO_APROVACAO`, orçamento
   "Orcamento indevido" pendente e histórico `ABERTA → AGUARDANDO_APROVACAO` com
   `usuario: { id: 3, nome: "Equipe de Manutenção" }` — o prestador2 alterou a OS de outro.
   Para comparação, `POST /os/{id}/andamentos` com o prestador2 numa OS alheia responde corretamente
   `403 "Somente o prestador responsável pode registrar o andamento desta OS."`.
   (Ajuste os ids `clienteId`/`/os/1` se o banco já tiver dados.)
2. **`prazoDias` sem validação de valor positivo** (`orcamento/OrcamentoRequest.java` só tem
   `@NotNull`; `OrcamentoService.gerar` só checa `null`). Aceita `0` ou negativo.
   Sugestão: `@Positive` no campo ou checagem no service com `campo: "prazoDias"`.
   *Frontend:* valida inteiro > 0 antes de enviar.
   **Confirmado com curl:** `POST /os/{id}/orcamentos` com `{"descricao":"Prazo zero","valor":100,"prazoDias":0}`
   pelo prestador responsável → `201` com `"prazoDias":0`.
3. **Senha padrão do banco divergente:** `application.yml` usa `DB_PASSWORD` padrão `12345`;
   `docker-compose.yml` e `README.md` usam `postgres`. Quem segue o README com Docker recebe erro
   de autenticação. Sugestão: alinhar o padrão do `application.yml` com o docker-compose (ou
   documentar `DB_PASSWORD=postgres` no README).

## Verificação com o backend rodando (25/11/2026)

- **curl direto no backend:** sessão/cookie (`Set-Cookie: JSESSIONID=...; Path=/; HttpOnly`, sem
  `SameSite`), mensagens de `401`/`403`, erro de validação com um só campo, preflight CORS de
  `localhost:5173` com `Access-Control-Allow-Credentials: true`, ids de `/prestadores` iguais aos
  de `/auth/me`, filtros inválidos (`status=XYZ`, `numero=abc` → `400`) e os itens 1 e 2 de
  "Para a equipe de backend".
- **Interface pelo proxy do Vite** (Chrome headless controlado pelo DevTools Protocol, clicando e
  preenchendo a tela), em 360, 768 e 1280 px, 28 passos cada, todos OK: login (inválido/vazio),
  cadastro de cliente com máscaras e validação, 409 com "Ver cadastro existente", edição, Nova OS
  (validação, abertura, desvio "cadastrar novo cliente"), filtros da lista, orçamento → recusa
  (desistindo antes na confirmação) → novo orçamento → aprovação → andamento → pronta → conclusão,
  cancelamento com motivo, `prestador` vendo só as dele e barrado em `/clientes`, `prestador2`
  recebendo a mensagem de acesso negado pela URL, `autonomo` com menus e ações dos dois papéis,
  sessão expirada (volta à página depois do login), 404, menu hambúrguer, e **nenhuma rolagem
  horizontal** em todas as telas visitadas.
- Nenhum passo falhou por causa do backend.

## Como subir o backend localmente

Fonte: `Backend/sos/README.md`, `pom.xml`, `application.yml`, `docker-compose.yml`.

1. **Java 21+** (Spring Boot 4.1.3). Maven não precisa estar instalado: use o wrapper `mvnw`.
2. **PostgreSQL** em `localhost:5432` com o banco `sos`:
   - via Docker: `docker compose up -d` dentro de `Backend/sos` (usuário/senha `postgres`); ou
   - Postgres local: criar o banco `sos` e informar a senha em `DB_PASSWORD`.
   As tabelas são criadas pelo Hibernate (`ddl-auto: update`) e a sequence por `schema.sql`.
3. Rodar, em `Backend/sos`:
   ```bash
   DB_PASSWORD=<senha> ./mvnw spring-boot:run      # Git Bash / Linux / macOS
   ```
   ```powershell
   $env:DB_PASSWORD="<senha>"; .\mvnw.cmd spring-boot:run   # PowerShell
   ```
4. API em `http://localhost:8080`; Swagger em `http://localhost:8080/swagger-ui.html`.
   Os usuários de teste são criados na primeira subida.

## Decisões do frontend

- **Proxy do Vite** (`/api` → `http://localhost:8080`, sem o prefixo): o navegador vê tudo como
  mesma origem, então não dependemos do CORS nem dos atributos do cookie. Chamar o backend direto
  também funcionaria (CORS libera `localhost:5173` com credenciais), mas o proxy é mais simples e
  é o padrão do `CLAUDE.md`.
- CSRF desligado no backend → `client.js` não envia token.
- Erros de validação: o frontend valida todos os campos antes de enviar; se a API devolver
  `campo` que existe no formulário, o erro aparece embaixo do campo; senão, no topo do formulário.
- Telefone enviado com máscara; CPF/CNPJ enviado só com dígitos (o backend aceita os dois).
- Datas: parse manual do ISO sem fuso, exibidas em `dd/mm/aaaa hh:mm`.
- "Gerar orçamento" só aparece para o prestador responsável (o backend não confere — divergência 1).
- `403` no detalhe da OS mostra o texto do `TELAS.md` ("Você não tem acesso a esta OS..."); em
  outras ações mostra a `mensagem` do backend.
- `401` fora do login: limpa o usuário e redireciona para `/login` com aviso de sessão expirada,
  guardando a página de origem para voltar depois.
- Usuário com os dois cargos vê a união dos menus e ações (regra em `utils/permissoes.js`).
- **Versões:** template oficial `create-vite` 9 (Vite 8, React 19). `react-router` ficou na
  **7.18.x**: a 8.x exige Node ≥ 22.22 e a máquina de desenvolvimento tinha Node 22.14. A API usada
  (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `NavLink`, hooks) é a mesma na 8; para
  atualizar basta `npm install react-router@8` com Node ≥ 22.22.
- **Linter:** o template atual do Vite traz o **oxlint** (não ESLint). `npm run lint` roda `oxlint`.
- **Página `/sem-permissao`** (`pages/SemPermissao/`): para onde a `RotaProtegida` manda quem não
  tem o cargo exigido pela rota (ex.: prestador abrindo `/clientes`).
- **Concluir e cancelar OS em duas etapas:** formulário (observação/motivo) → `ConfirmarDialogo`
  → API. "Voltar" na confirmação retorna ao formulário sem perder o texto; nada é enviado antes de
  confirmar. Aprovar/recusar vão direto para o `ConfirmarDialogo`.
- **Registrar andamento** não tem diálogo de confirmação extra: o envio do formulário é a
  confirmação do passo 6 do RF004 (o `TELAS.md` só exige confirmação para concluir, cancelar,
  aprovar e recusar).
- **"Concluir" para OS que não está `PRONTA`:** aparece desabilitado com a explicação "O prestador
  ainda não finalizou o serviço." (opção do `TELAS.md` 3).
- **Desvio "cadastrar novo cliente" da Nova OS:** `/clientes/novo?origem=nova-os`; ao salvar,
  volta para `/os/nova?clienteId={id}` e a Nova OS busca e seleciona esse cliente. Usar a URL (e não
  estado em memória) faz o fluxo sobreviver a um recarregar da página. A descrição digitada antes
  do desvio não é guardada (o fluxo começa pelo cliente, então normalmente ainda está vazia).
- **409 no cliente:** "Ver cadastro existente" chama `GET /clientes?busca={dígitos}`, pega o
  cliente com o CPF/CNPJ exatamente igual e abre a edição dele (mantendo `origem=nova-os`, se houver).
- Filtros da lista de OS e a busca de clientes ficam na **URL** (`?numero=&cliente=&status=`,
  `?busca=`), para que voltar do detalhe mantenha a pesquisa.
- Estilos compartilhados entre os componentes de ação do detalhe ficam em
  `pages/OrdemDetalhe/Acoes.module.css` (e `Listas.module.css` para orçamentos/histórico).
- Validação local do número da OS no filtro (só dígitos) evita o `400` do backend.
- Ao abrir a aplicação, um `401` em `/auth/me` não mostra "sessão expirada" (é só "não logado").
  O aviso aparece apenas quando uma chamada já logada recebe `401`.
