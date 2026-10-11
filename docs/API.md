# API REST

Base: /api, no mesmo domínio do frontend. Acesso remoto exige Cloudflare Access. Ambiente local: http://127.0.0.1:8787/api. Pedidos de escrita usam Content-Type: application/json. Não há contas nem separação de dados por utilizador.

## Formatos

Sucesso:

```json
{"success":true,"data":{"id":12,"name":"Investimentos","type":"INCOME","color":"#6366F1","createdAt":"2026-10-11T10:00:00.000Z","updatedAt":"2026-10-11T10:00:00.000Z"}}
```

Erro:

```json
{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Os dados fornecidos são inválidos.","details":[{"path":"amountCents","message":"Invalid input"}]}}
```

details contém as violações Zod; a mensagem de cada detalhe depende da validação. A mensagem principal é legível para o utilizador. DELETE bem-sucedido devolve 204 sem corpo. Health é a excepção de sucesso sem envelope, conforme o contrato pedido.

## Endpoints

| Método | Caminho | Sucesso | Resultado |
|---|---|---|---|
| GET | /health | 200 | Estado do Worker e consulta D1 |
| GET | /transactions | 200 | items e pagination |
| GET | /transactions/:id | 200 | Transacção completa |
| POST | /transactions | 201 | Transacção criada |
| PUT | /transactions/:id | 200 | Transacção actualizada |
| DELETE | /transactions/:id | 204 | Sem corpo |
| GET | /categories | 200 | Array de categorias |
| GET | /categories/:id | 200 | Categoria |
| POST | /categories | 201 | Categoria criada |
| PUT | /categories/:id | 200 | Categoria actualizada |
| DELETE | /categories/:id | 204 | Sem corpo |
| GET | /dashboard/summary | 200 | Totais financeiros |
| GET | /dashboard/monthly | 200 | Doze meses do ano |
| GET | /dashboard/categories | 200 | Despesas agrupadas por categoria |
| GET | /dashboard/recent-transactions | 200 | Até cinco transacções |

Os exemplos seguintes são ilustrativos do contrato, não dados injectados no dashboard.

## Health

GET /api/health verifica SELECT 1 no D1 e responde:

```json
{"status":"UP","application":"CloudExpense","architecture":"Serverless","provider":"Cloudflare Workers"}
```

Uma falha interna devolve 500 no formato de erro. Não expõe IDs de base, credenciais ou stack traces.

## Transacções

POST /api/transactions e PUT /api/transactions/:id recebem todos os campos:

```json
{"type":"INCOME","description":"Salário mensal","amountCents":2500000,"categoryId":1,"transactionDate":"2026-10-05"}
```

Receita de 25.000 MT = 2.500.000 centavos. Para uma despesa de 5.000 MT use type EXPENSE, amountCents 500000 e uma categoria de despesa existente (por exemplo, Alimentação no seed inicial).

Resposta de GET individual, POST e PUT:

```json
{"success":true,"data":{"id":1,"type":"INCOME","description":"Salário mensal","amountCents":2500000,"categoryId":1,"categoryName":"Salário","categoryColor":"#10B981","transactionDate":"2026-10-05","createdAt":"2026-10-05T12:00:00.000Z","updatedAt":"2026-10-05T12:00:00.000Z"}}
```

Validações:

- type: INCOME ou EXPENSE.
- description: trim, entre 3 e 200 caracteres.
- amountCents: número JSON inteiro, positivo, até 100000000000; strings e decimais são rejeitados.
- categoryId: inteiro positivo, categoria existente e do mesmo tipo.
- transactionDate: YYYY-MM-DD real, de 1900-01-01 a 9999-12-31.
- Campos desconhecidos no corpo são rejeitados.
- id inválido: 400; id válido inexistente: 404.
- Categoria inexistente/incompatível numa transacção: 400; conflito concorrente de integridade: 409.

PUT substitui os campos editáveis completos; não é PATCH. DELETE persiste a eliminação no D1. Relatórios seguintes usam os dados actualizados.

### Listagem e filtros

GET /api/transactions?type=EXPENSE&categoryId=4&startDate=2026-10-01&endDate=2026-10-31&search=Compras&page=1&pageSize=10

| Parâmetro | Regra |
|---|---|
| page | Inteiro de 1 a 1000000, predefinido 1 |
| pageSize | Inteiro de 1 a 100, predefinido 10 |
| type | INCOME ou EXPENSE, opcional |
| categoryId | Inteiro positivo, opcional |
| startDate / endDate | Datas inclusivas, opcionais; início <= fim |
| search | Pesquisa por descrição, até 200 caracteres |

Critérios são combinados com AND. Ordenação: transactionDate DESC e id DESC. A pesquisa trata %, _ e barra invertida como texto literal. SQLite LIKE é insensível a maiúsculas ASCII, sem garantia de normalização de acentos Unicode.

```json
{"success":true,"data":{"items":[],"pagination":{"page":1,"pageSize":10,"total":0,"totalPages":0}}}
```

Quando existirem registos, items contém objectos completos de transacção. Uma página além da última devolve items vazio e preserva os metadados. Não há saldo calculado no browser a partir de uma página incompleta.

## Categorias

POST /api/categories e PUT /api/categories/:id:

```json
{"name":"Investimentos","type":"INCOME","color":"#6366F1"}
```

name: trim, 2–60 caracteres. type: INCOME/EXPENSE. color: hexadecimal #RRGGBB. Nome e tipo repetidos exactamente conflituam (409). A restrição de unicidade SQLite diferencia maiúsculas e acentos.

GET /api/categories devolve success e data como array de categorias, com id, name, type, color, createdAt e updatedAt. GET individual devolve um objecto.

DELETE /api/categories/:id só é permitido sem transacções associadas. Caso contrário:

```json
{"success":false,"error":{"code":"CATEGORY_IN_USE","message":"Esta categoria tem transacções associadas e não pode ser eliminada.","details":[]}}
```

Status 409. Alterar o tipo de uma categoria utilizada também devolve 409. Alterar o nome/cor mantém as transacções e reflecte-se na apresentação.

## Dashboard

### GET /api/dashboard/summary

Aceita os mesmos filtros de tipo, categoria, datas e pesquisa da listagem. page/pageSize são aceites mas não restringem agregações. Sem datas considera todo o histórico.

```json
{"success":true,"data":{"incomeCents":2500000,"expenseCents":500000,"balanceCents":2000000,"count":2}}
```

Saldo é receitas menos despesas. Sem movimentos devolve zeros. O frontend passa datas do ano seleccionado.

### GET /api/dashboard/monthly?year=2026

year é inteiro entre 1900 e 9998; por omissão, ano actual do Worker. Devolve sempre 12 objectos, ordenados. Os meses sem registos têm zeros. Exemplo de um elemento de data:

```json
{"month":"2026-10","incomeCents":2500000,"expenseCents":500000}
```

Este endpoint aceita apenas year; não aceita os filtros da listagem. A comparação com outros relatórios deve usar o mesmo ano.

### GET /api/dashboard/categories

Aceita categoria, datas e pesquisa da listagem; o tipo é sempre EXPENSE, independentemente de um filtro type enviado. page/pageSize não limitam o agregado. Sem despesas devolve array vazio.

```json
{"success":true,"data":[{"categoryId":4,"name":"Alimentação","color":"#6366F1","amountCents":500000}]}
```

Ordenado pelo total descendente. Cores e nomes vêm do D1.

### GET /api/dashboard/recent-transactions

Aceita os mesmos filtros da listagem. Força page=1 e pageSize=5. Devolve array com até cinco transacções completas, por data descendente e id descendente. No dashboard, a consulta é limitada ao ano seleccionado.

## Códigos e segurança

200 consulta/actualização; 201 criação; 204 eliminação; 400 validação/JSON inválido/corpo demasiado grande; 401 Access ausente ou inválido; 403 origem de escrita não permitida; 404 recurso/endpoint inexistente; 409 integridade; 500 erro interno; 503 Access ainda não configurado.

Os pedidos têm limite de corpo de 16 KiB. Respostas incluem X-Request-Id e Cache-Control: no-store. Logs não incluem o corpo do pedido nem query strings. Uma rota /api inexistente nunca cai no fallback HTML.

Exemplo local em PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
$body = @{ type='INCOME'; description='Salário mensal'; amountCents=2500000; categoryId=1; transactionDate='2026-10-05' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/transactions -Method Post -ContentType 'application/json' -Body $body
Invoke-RestMethod http://127.0.0.1:8787/api/dashboard/summary
```