# Publicação na Cloudflare

Não foi efectuado deploy automaticamente. Execute estes passos apenas na conta e domínio autorizados. A configuração de produção não inclui database_id inventado; o binding local funciona sem uma base remota.

## Pré-requisitos e verificação

Node.js >=22.12, npm, conta Cloudflare com D1/Workers e um domínio sob controlo da conta. O lockfile fixa as versões instaladas. Este projecto foi configurado com Wrangler 4.149.0.

Na raiz:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd test
npm.cmd run build
npm.cmd run deploy:check
```

deploy:check termina com --dry-run; não publica nem aplica migrações. Não confunda sucesso do empacotamento com validação de credenciais, domínio ou Access.

## 1. Autenticar e criar D1

```powershell
cd worker
npx.cmd wrangler login
npx.cmd wrangler whoami
npx.cmd wrangler d1 create cloudexpense
```

Copie o database_id real devolvido pelo último comando. Não execute d1 create novamente se a base já existir; confirme-a com wrangler d1 list.

## 2. Preparar a configuração real

Copie worker/wrangler.jsonc para worker/wrangler.production.jsonc (ficheiro ignorado pelo Git). No ficheiro copiado:

- Acrescente database_id ao objecto de d1_databases, usando o ID real.
- Mantenha binding DB, database_name cloudexpense e migrations_dir migrations.
- Mantenha APP_ENV como production.
- Acrescente ACCESS_TEAM_DOMAIN em vars com o hostname real da equipa, terminado em .cloudflareaccess.com, sem https://.
- Acrescente ACCESS_AUD em vars com o Audience (AUD) Tag real da aplicação Access.
- Acrescente routes com um objecto contendo pattern igual ao domínio exacto escolhido e custom_domain: true.
- Preserve workers_dev: false e preview_urls: false para não criar URLs alternativas sem a política do domínio.

Os valores de domínio, AUD e database_id são configuração, não passwords. Não há secrets necessários para validar JWT com chaves públicas. Se introduzir outros serviços no futuro, use wrangler secret put para os respectivos secrets, nunca o frontend.

## 3. Configurar Cloudflare Access ANTES de publicar

No Zero Trust, crie uma aplicação Access do tipo Self-hosted para o domínio completo escolhido. A aplicação deve abranger todos os caminhos, incluindo /api/* e os assets.

Crie uma política Allow restrita aos emails ou grupo autorizado para a defesa académica. Configure o método de login disponibilizado pela conta. Não crie uma política Bypass ou Allow para todos. Registe o AUD e o domínio da equipa na configuração.

O Worker valida o token Cf-Access-Jwt-Assertion criptograficamente (RS256, issuer, audience e expiração). Sem configuração recusa com 503; sem JWT recusa com 401. A navegação normal pelo domínio protegido recebe o login do Access antes do Worker.

O MVP mantém um espaço financeiro partilhado por todos os visitantes autorizados. Access não cria contas ou isolamento de dados na aplicação.

Referência: [validação de JWT Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

## 4. Aplicar migrações remotas

Revise cada migração antes da execução. A migração inicial cria tabelas, índices e 11 categorias; não contém transacções fictícias. Para bases existentes, faça backup e confirme que o esquema corresponde à sequência de migrações.

Ainda na pasta worker:

```powershell
npx.cmd wrangler d1 migrations list cloudexpense --remote --config wrangler.production.jsonc
npx.cmd wrangler d1 migrations apply cloudexpense --remote --config wrangler.production.jsonc
```

Estes comandos modificam a base remota quando executados pelo operador. Não executar migrações destrutivas sem confirmação explícita. A tabela d1_migrations controla quais ficheiros já foram aplicados; não há seed a cada arranque.

## 5. Compilar e publicar

```powershell
cd ..
npm.cmd run build
cd worker
npx.cmd wrangler deploy --dry-run --config wrangler.production.jsonc
npx.cmd wrangler deploy --config wrangler.production.jsonc
```

Só o último comando publica. O build de React fica em frontend/dist. ASSETS serve esses ficheiros com fallback single-page-application. run_worker_first=true permite verificar Access antes de qualquer resposta e garante que /api/* não devolve index.html.

Referência: [Workers Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).

## 6. Verificar a publicação

Abra o domínio exacto devolvido/configurado no deploy e autentique-se via Access. Confirme:

- Acesso anónimo é interceptado pelo Access.
- /api/health devolve UP após login.
- /api/unknown devolve JSON 404, nunca HTML.
- Navegar directamente para /transactions ou /categories abre a SPA.
- Criar, editar, eliminar e recarregar reflecte dados persistidos.
- Pedidos sem autorização não podem escrever.
- workers.dev e URLs de preview permanecem desactivados.

Para ver respostas, utilize Network no browser autenticado. Testes automatizados remotos devem usar uma política de service token específica, se a conta a configurar; não exponha tokens em scripts versionados.

## 7. Consultar logs e dados

```powershell
npx.cmd wrangler tail --config wrangler.production.jsonc --format json
npx.cmd wrangler d1 execute cloudexpense --remote --config wrangler.production.jsonc --command "SELECT COUNT(*) AS total FROM transactions"
```

Workers Observability está activado no Wrangler. Consulte métricas na conta Cloudflare para observar invocações, erros e consumo. Logs da aplicação não incluem descrições ou montantes financeiros.

## Operação local e recuperação

Para desenvolvimento use sempre wrangler.local.jsonc, ligado apenas a loopback e com APP_ENV=development. Não publique esta configuração. A base fica em worker/.wrangler/state e sobrevive ao reinício. Não apague essa pasta para resolver um erro sem preservar os dados pretendidos.

A publicação não copia os dados locais para D1 remoto. Faça uma migração de dados deliberada, se necessária. Para actualizar o esquema, acrescente migrações numeradas; não altere migrações já aplicadas remotamente.

Um erro ACCESS_NOT_CONFIGURED após deploy significa que faltam ou estão inválidos os valores Access; não o resolva desligando a segurança. Verifique domínio, AUD, política e cabeçalhos no fluxo autenticado.