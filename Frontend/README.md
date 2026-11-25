# SoS – Frontend

Frontend em React do **SoS – Sistema de Ordem de Serviço**. Consome a API Java/Spring que está em
`../Backend/sos`.

## Pré-requisitos

- **Node.js 22.12 ou mais recente** (testado com 22.14) e npm.
- O **backend rodando em `http://localhost:8080`**, que por sua vez precisa de:
  - Java 21 ou mais recente;
  - PostgreSQL em `localhost:5432` com um banco chamado `sos`.

## Como rodar com o backend

1. Suba o backend (detalhes em `../Backend/sos/README.md` e em `docs/NOTAS_BACKEND.md`):

   ```bash
   cd ../Backend/sos
   DB_PASSWORD=<senha do postgres> ./mvnw spring-boot:run          # Git Bash / Linux / macOS
   ```

   ```powershell
   cd ..\Backend\sos
   $env:DB_PASSWORD="<senha do postgres>"; .\mvnw.cmd spring-boot:run   # PowerShell
   ```

   Se o Java padrão da máquina for anterior ao 21, aponte `JAVA_HOME` para um JDK 21+ antes.
   Na primeira subida o backend cria os usuários de teste.

2. Em outro terminal, nesta pasta:

   ```bash
   npm install
   npm run dev
   ```

3. Abra `http://localhost:5173` e entre com um usuário de teste (senha `123`):

   | Usuário | Papel |
   |---|---|
   | `atendente` | Atendente |
   | `prestador` | Prestador |
   | `prestador2` | Prestador (equipe) |
   | `autonomo` | Atendente e Prestador |

Em desenvolvimento, o navegador chama `/api/...` no próprio Vite, que repassa para
`http://localhost:8080` sem o prefixo `/api` (proxy em `vite.config.js`). Assim não há problema de
CORS nem de cookie de sessão.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:5173` |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` para conferir o build |
| `npm run lint` | Verifica o código com o oxlint |
| `npm run test` | Roda os testes (Vitest) das funções de `src/utils/` |

## Variáveis de ambiente

Copie `.env.example` para `.env` se precisar mudar algo.

| Variável | Padrão | Para que serve |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base da API. `/api` usa o proxy do Vite. Para chamar o backend direto, use `http://localhost:8080` (a origem do frontend precisa estar liberada no CORS do backend, variável `CORS_ORIGENS`). |

Em produção, sirva o `dist/` atrás de um servidor que repasse `/api` para o backend (como o proxy
faz em desenvolvimento) ou gere o build com `VITE_API_URL` apontando para a URL do backend.

## Estrutura de pastas

```text
src/
  main.jsx      Ponto de entrada: monta o React com o roteador e o AuthProvider.
  App.jsx       Todas as rotas da aplicação, em um só lugar.
  api/          Funções que chamam o backend; client.js é o único lugar que usa fetch.
  context/      AuthContext: o usuário logado, entrar(), sair() e temCargo() (único estado global).
  components/   Peças reutilizáveis sem regra de negócio (botão, campo, modal, layout, badge...).
  pages/        Uma pasta por tela; os subcomponentes da tela ficam dentro da pasta dela.
  utils/        Funções puras: status e rótulos, permissões, formatadores e validadores (com testes).
  styles/       global.css com reset, variáveis de cor/espaçamento/fonte e cores de status.
docs/           Requisitos (SRS), telas, API e as notas sobre o código do backend.
```

## Como adicionar uma tela

1. Crie `src/pages/NovaTela/NovaTela.jsx` e `src/pages/NovaTela/NovaTela.module.css`.
2. Se a tela usar um endpoint novo, crie a função no arquivo certo de `src/api/` (nunca use
   `fetch` direto na tela).
3. Registre a rota em `src/App.jsx`. Se exigir login, coloque-a dentro do bloco
   `<RotaProtegida />`; se exigir um cargo, dentro de `<RotaProtegida cargo={CARGOS.ATENDENTE} />`.
4. Se a tela tiver item de menu, adicione-o em `src/components/Layout/Layout.jsx`, usando uma
   função de `utils/permissoes.js` para decidir quem vê.
5. Se houver regra de "quem pode fazer o quê", crie a função em `src/utils/permissoes.js` e um teste
   em `src/utils/permissoes.test.js`.
6. Trate os três estados de cada chamada à API (carregando, erro, sucesso/vazio) e rode
   `npm run build`, `npm run lint` e `npm run test`.
