# Testes e verificações

Verificações executadas em 11 de Outubro de 2026, Windows, Node.js 22.14.0, npm 10.9.2. Resultados referem-se ao ambiente local, não a um deploy Cloudflare remoto.

## Resultados finais

| Comando/verificação | Resultado |
|---|---|
| npm.cmd install --no-fund | Dependências instaladas; auditoria npm: 0 vulnerabilidades |
| npm.cmd run db:migrate | Migração 0001 aplicada no D1 local |
| npm.cmd test | 23 testes frontend + 32 Worker/D1 aprovados |
| npm.cmd run test:e2e | 2 percursos aprovados: desktop e mobile |
| npm.cmd run typecheck | Frontend e Worker sem erros |
| npm.cmd run build | Build Vite produzido em frontend/dist |
| npm.cmd run deploy:check | Build e Wrangler --dry-run aprovados, sem publicação |
| Worker + Static Assets em 8788 | Health 200, categorias 200, resumo 200, API inexistente 404 |
| Browser no build compilado | /, /transactions e /categories: 200, sem erros JavaScript |

O build final contém os tipos corrigidos da pipeline Zod. Essa última correcção foi exclusivamente de anotação TypeScript; não alterou a validação já exercitada nos testes.

## Cobertura relevante

Backend: health com acesso D1, seed, CRUD de categorias, duplicação, receitas, despesas, valores inválidos, datas impossíveis, identificadores inválidos, categorias incompatíveis/inexistentes, filtros combinados, pesquisa literal, paginação, edição, eliminação, totais, meses sem dados, recentes, integridade directa no SQL, JSON inválido, 404 e origens proibidas.

Segurança: produção sem configuração bloqueada, token ausente bloqueado, validação real RS256 com chave de teste, audience incorrecta, token expirado e token falsificado. Só a obtenção de chaves públicas é mockada nesse teste; assinatura e validação JWT executam realmente. A política Access remota ainda precisa de ser configurada e verificada na conta.

Frontend: centavos exactos, formato MT, rejeição de valores malformados, regras de formulário, skeleton, dashboard vazio, erros de ligação, criação com categoria compatível, confirmação de eliminação, erros HTTP, HTML inesperado e conteúdo financeiro malformado.

Browser: criação de receita de 25.000 MT e despesa de 5.000 MT, diferença de saldo de 20.000 MT, gráficos, recarregamento, pesquisa, edição para 6.000 MT, cancelamento/confirmar eliminação e criar/editar/eliminar categoria. Executado em Edge headless, desktop 1440px e viewport mobile Pixel 7. Verificação de ausência de overflow horizontal da página e de erros JavaScript. Tabelas longas usam scroll interno.

## Executar

Na raiz:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd test
npm.cmd run test:e2e
npm.cmd run deploy:check
```

Playwright inicia npm run dev quando necessário. A configuração usa Microsoft Edge instalado. Noutro sistema, instale Edge ou altere channel em playwright.config.ts para o browser disponível; se escolher Chromium gerido pelo Playwright, instale-o com npx playwright install chromium e retire channel.

A base dos testes Worker é isolada da base de desenvolvimento. O E2E usa a base local de desenvolvimento: cria registos com prefixo Teste E2E e apaga apenas os IDs que criou, incluindo em caso de falha. Não aponta para produção. Evite executar E2E sobre uma sessão que esteja a ser editada manualmente ao mesmo tempo.

As capturas desktop/mobile ficam em test-results/dashboard-desktop.png e dashboard-mobile.png; essa pasta é ignorada no Git. Os valores mostrados nas capturas são dados temporários dos testes, não um seed financeiro.

## Preview do pacote de produção, localmente

```powershell
npm.cmd run preview
```

Abra http://127.0.0.1:8788. O comando compila e inicia Wrangler com Static Assets, usando uma substituição APP_ENV=development apenas no processo local. Não altera a configuração production no ficheiro e não publica.

Foram abertas as três rotas directas no browser e consultados os endpoints health, categories, summary e unknown. Foi confirmado que o banco local terminou com 11 categorias iniciais e zero movimentos de teste.

## Problemas encontrados e corrigidos

- O resolvedor npm 10 falhou ao conciliar versões Vitest: versões alinhadas e lockfile gerado.
- O número de versão inicialmente tentado de workers-types não existia: substituído pela versão publicada 5.20261011.1.
- Vite 8 mudou a configuração de divisão de chunks: adaptada para rolldownOptions.
- A integração Cloudflare actual usa o subpath /types e Cloudflare.Env: tipos de teste corrigidos.
- O D1 rejeitou um GLOB demasiado complexo no CHECK da cor: restrição reescrita com substr/ltrim.
- Mensagens de erro faziam parte do nome acessível do campo: labels explícitos e aria-describedby adicionados.
- Uma pipeline Zod precisava de tipo de entrada explícito: corrigida e TypeScript/build repetidos.

As falhas iniciais não foram contadas como testes aprovados. Não foi efectuado teste de carga, auditoria completa de acessibilidade ou verificação de Access/D1 remotos. A inspeção visual e os testes locais não substituem essas verificações.