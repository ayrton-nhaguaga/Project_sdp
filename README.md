# CloudExpense — Smart Personal Finance

Gestão financeira pessoal em meticais, com React e uma API serverless real em Cloudflare Workers + D1. Projecto académico sem contas: um único espaço financeiro partilhado, protegido por Cloudflare Access quando publicado. Não adequado para dados financeiros privados reais.

## Funcionalidades

- Dashboard por ano: saldo, receitas, despesas, contagem, evolução mensal e despesas por categoria.
- CRUD de transacções com paginação, pesquisa e filtros combinados.
- CRUD de categorias, com protecção de categorias utilizadas.
- Formulários validados no browser e Worker; valores em centavos inteiros.
- Modais acessíveis, feedback de operações, loading, estados vazios e de erro.
- Indicadores reais de ligação à API e tempo HTTP medido no cliente.
- Logs estruturados, migrações e testes React/Workers/D1.

## Tecnologias e arquitectura

React, TypeScript, Vite, Tailwind CSS, React Router, Lucide, Recharts, React Hook Form, Zod, TanStack Query e Fetch. Backend com Hono, Cloudflare Workers, D1 e Wrangler. Vitest/React Testing Library e integração oficial Cloudflare; Playwright para verificação no browser.

Utilizador → React → HTTP REST → Worker/Hono → Service → Repository → D1. Respostas JSON; frontend e API no mesmo domínio de produção através de Workers Static Assets.

## Pré-requisitos

Node.js >=22.12.0 e npm. Não é necessário login Cloudflare para desenvolvimento local. Os comandos abaixo usam npm.cmd/npx.cmd para funcionar no PowerShell mesmo quando scripts .ps1 estão bloqueados; em Linux/macOS use npm/npx.

## Instalação e execução

Na pasta raiz deste projecto:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run dev
```

Abra http://127.0.0.1:5173. Vite encaminha /api para http://127.0.0.1:8787. Encerre com Ctrl+C.

Também pode iniciar em dois terminais:

```powershell
npm.cmd run dev:worker
npm.cmd run dev:frontend
```

São criadas 11 categorias iniciais e nenhuma transacção fictícia. A migração é versionada e pode ser invocada novamente sem duplicar categorias.

## Demonstração rápida

1. Crie uma receita, categoria Salário, valor 25000, data no ano seleccionado.
2. Crie uma despesa, categoria Alimentação, valor 5000, no mesmo ano.
3. O dashboard deve mostrar 25.000,00 MT de receitas, 5.000,00 MT de despesas e saldo de 20.000,00 MT.
4. Edite um movimento, consulte os filtros e elimine com confirmação.
5. Recarregue a página para verificar persistência.

O formulário aceita 1500,50 ou 1500.50; não use separadores de milhares na entrada. A apresentação usa 1.500,50 MT. O saldo do dashboard refere-se ao ano seleccionado.

## Base de dados local

```powershell
npm.cmd run db:migrate
cd worker
npx.cmd wrangler d1 execute cloudexpense --local --config wrangler.local.jsonc --command "SELECT id, type, amount, transaction_date FROM transactions"
cd ..
```

O campo amount contém centavos. A API chama-lhe amountCents. A base local permanece em worker/.wrangler/state; não é a base remota. O D1 remoto é criado apenas no procedimento de deploy.

## Testes, tipos e build

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run deploy:check
```

Os testes de integração executam o Worker e D1 no runtime Cloudflare local, com uma base de teste separada. Os testes React usam mocks só para a fronteira HTTP. deploy:check compila e executa Wrangler --dry-run, sem publicar.

Para testes de browser, consulte docs/TESTING.md. Estes usam dados identificados para teste e eliminam os registos que criam.

Para ver o build compilado com API e assets no mesmo servidor local:

```powershell
npm.cmd run preview
```

Abra http://127.0.0.1:8788. Este comando não publica.

## Estrutura

```text
frontend/
  src/
    components/   layout, dashboard, transacções, categorias e UI
    pages/        quatro páginas navegáveis
    services/     cliente HTTP e serviços tipados
    hooks/        consultas e mutações
    utils/        valores monetários e datas
    tests/        testes de componentes, formulários e HTTP
worker/
  src/
    routes/       endpoints Hono
    services/     regras de negócio e relatórios
    repositories/ SQL parametrizado D1
    schemas/      exportação das validações
    middlewares/  Access, origem e erros
    types/        bindings do Worker
  migrations/     esquema, constraints, índices e seed controlado
  tests/          integração Worker + D1
  wrangler.jsonc  produção protegida, sem ID remoto inventado
  wrangler.local.jsonc  desenvolvimento local
shared/           contratos e Zod reutilizados
docs/             arquitectura, API, serverless, deploy e testes
e2e/              testes de browser
```

A raiz actual já é o projecto CloudExpense; não há uma subpasta redundante com o mesmo nome.

## Publicação

Siga [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): login Cloudflare, criação D1, configuração do ID real/domínio/Access, migrações remotas revistas, build e deploy explícito. A produção recusa acesso quando não está configurada; workers.dev e previews estão desactivados.

Não foi efectuado deploy. Não coloque APP_ENV=development em produção. Não existem credenciais no frontend.

## Documentação

- [Arquitectura e diagrama](docs/ARCHITECTURE.md)
- [Contrato da API](docs/API.md)
- [Computação serverless e roteiro de defesa](docs/SERVERLESS.md)
- [Publicação e segurança](docs/DEPLOYMENT.md)
- [Testes e verificações](docs/TESTING.md)