# Guião da apresentação — CloudExpense

Autores: Ayrton Nhaguaga, Abelardo Miambo e Edmilson Conge. Turma: Lecc31. Docente: Sergio Sambo.

## Como usar

- Abrir ../CloudExpense_Computacao_Serverless.pptx no PowerPoint e iniciar com F5.
- Formato 16:9, fundo branco e texto preto. Textos e diagramas editáveis; capturas nas cores originais da aplicação.
- Duração sugerida: 18–22 minutos, incluindo uma demonstração breve.
- Notas do apresentador incorporadas no PowerPoint.
- Os resultados apresentados são locais: não afirmar que o sistema já foi publicado.
- Não foram inventados instituição, curso ou dados de desempenho.

## Divisão sugerida da exposição

- Ayrton Nhaguaga: slides 1–8 — contexto, objectivos e fundamentos.
- Abelardo Miambo: slides 9–16 — tecnologias, arquitectura e implementação.
- Edmilson Conge: slides 17–24 — demonstração, resultados e conclusão.
- A divisão é uma sugestão e pode ser alterada.

## Demonstração ao vivo

1. Na raiz: npm.cmd run db:migrate e npm.cmd run dev.
2. Abrir http://127.0.0.1:5173 e seleccionar o ano das transacções.
3. Criar receita de 25000 MT e despesa de 5000 MT com categorias compatíveis.
4. Numa base sem outros movimentos desse ano, verificar saldo de 20000 MT.
5. Recarregar, editar, eliminar e observar as respostas na aba Network.
6. Mostrar os logs do Worker, sem inventar métricas de CPU.
7. Se já houver movimentos, explicar a diferença de saldo de 20000 MT.

## Notas por slide

### 01. Computação Serverless

Apresentar os autores e o tema. O CloudExpense é o estudo de caso desenvolvido para demonstrar funções activadas por HTTP, persistência num serviço gerido e uma interface web moderna. O trabalho está funcional e validado localmente; a publicação remota ainda não foi realizada. Não indicar uma instituição ou curso que não tenham sido fornecidos.



### 02. Percurso da apresentação

Organizar a exposição em quatro momentos. Primeiro definir o problema e os objectivos; depois explicar os fundamentos; em seguida mostrar a arquitectura e a aplicação; terminar com resultados, limitações e conclusão. Duração sugerida: 18 a 22 minutos, incluindo uma demonstração breve.



### 03. Introdução: do registo à informação

Explicar que o projecto liga um problema de organização financeira a uma questão tecnológica. Não se apresenta uma pesquisa estatística sobre hábitos dos utilizadores; trata-se do cenário que orientou o desenvolvimento. O foco académico é compreender como a aplicação processa cada acção sem manter um servidor de aplicação tradicional.

Fonte no slide: Fonte: descrição e objectivos do projecto CloudExpense.

### 04. Problema e pergunta de investigação

Apresentar dois níveis do problema: o funcional, organizar e consultar movimentos, e o de engenharia, implementar a aplicação sem administrar um servidor permanente. A pergunta orienta a demonstração prática; o trabalho não pretende provar que serverless é sempre mais barato ou mais rápido.



### 05. Justificativa e relevância

O projecto tem relevância prática, pedagógica e técnica. A gestão financeira oferece operações fáceis de observar, enquanto o percurso HTTP até ao banco permite explicar eventos, função e serviço gerido. Segurança e testes fazem parte da demonstração.



### 06. Objectivo geral e objectivos específicos

Ler o objectivo geral e resumir os específicos em três grupos: implementar a API e persistência; construir a interface e relatórios; validar, observar e preparar a publicação. Todos se relacionam com os critérios de demonstração do trabalho.



### 07. Metodologia de desenvolvimento

Caracterizar o trabalho como desenvolvimento aplicado de um protótipo funcional, com verificação incremental. Os requisitos orientaram a construção; os testes verificaram regras e fluxos. Não houve estudo com participantes nem comparação experimental de desempenho entre plataformas.



### 08. O que é Computação Serverless?

Serverless significa que a infraestrutura de execução é gerida pelo fornecedor. Os servidores físicos continuam a existir. FaaS é a execução de funções em resposta a eventos; neste projecto, o evento é um pedido HTTP. O estado financeiro fica no D1, não na memória temporária do Worker. Não assumir que cada pedido cria uma máquina ou um processo novo.

Fonte no slide: Referências: [1] funcionamento de Workers; [2] visão geral do D1.

### 09. Hospedagem tradicional e serverless

Comparar responsabilidades, evitando generalizações. Na hospedagem tradicional aqui considerada existe um processo de aplicação numa máquina provisionada. O modelo gerido retira tarefas de operação de infraestrutura, mas não elimina o trabalho com código, segurança, dados e custos. Ambos podem ser válidos conforme os requisitos.

Fonte no slide: Referência: [1]. Comparação conceptual; sem benchmark de custos ou desempenho.

### 10. Tecnologias e responsabilidades

Explicar a stack pelo papel de cada conjunto, sem transformar a apresentação numa lista de bibliotecas. React trata da experiência; Hono organiza a API; D1 persiste. Wrangler executa e publica; testes validam. Node.js é usado para ferramentas de desenvolvimento, não como servidor permanente de produção.



### 11. Arquitectura da aplicação

Seguir as setas da esquerda para a direita. React comunica por HTTP REST com Hono, que chama services e repositories. O repository usa o binding DB. A resposta regressa em JSON. Em produção, Access protege o acesso e Static Assets serve React. A configuração remota está preparada, mas ainda não publicada.

Fonte no slide: Fonte: docs/ARCHITECTURE.md. Protecção Access e publicação remota ainda pendentes.

### 12. O percurso de uma transacção

Usar este slide para responder à pergunta 'onde está a função?'. O evento entra no handler do Worker, Hono selecciona a rota e a lógica é executada. A escrita é aguardada antes da confirmação. A interface invalida as consultas para obter os totais do backend. Um ambiente de execução pode ser reutilizado; os dados não dependem da sua memória.



### 13. Modelo de dados e integridade

Mostrar a relação de uma categoria para muitas transacções. O esquema tem timestamps, índices e restrições adicionais; o diagrama mostra os campos essenciais. Explicar a conversão monetária sem arredondamento e a proibição de eliminar categorias utilizadas. O saldo é calculado, não duplicado numa coluna.

Fonte no slide: Fonte: worker/migrations/0001_initial.sql e shared/schemas.ts.

### 14. Dashboard: informação financeira visível

Mostrar a captura real obtida num teste local. Os valores são registos temporários de teste, removidos depois da validação. Destacar cartões, evolução por mês e despesas por categoria. Todos recebem valores da API. O dashboard mostra o ano seleccionado; o saldo também se refere a esse período.

Fonte no slide: Imagem: captura real do CloudExpense em teste local; dados de demonstração, não dados pessoais.

### 15. Funcionalidades e experiência de utilização

A aplicação permite criar, ler, editar e eliminar movimentos, e gerir categorias com restrições. Os filtros combinam-se com paginação. Mostrar a captura mobile e explicar que as tabelas largas têm scroll interno. Não afirmar uma auditoria completa de acessibilidade: foram implementados foco, labels, teclado e feedback, e validados fluxos no browser.

Fonte no slide: Imagem: captura mobile do teste E2E. Fonte funcional: README.md e docs/TESTING.md.

### 16. Segurança em várias camadas

Distinguir protecção implementada de configuração externa. Zod valida em ambos os lados, mas o backend é a autoridade. SQL parametrizado e constraints protegem dados. O middleware de produção valida assinatura e claims JWT. Ainda é preciso criar a política Access real na conta. O MVP é um espaço partilhado, sem contas individuais.

Fonte no slide: Referência: [3] validação de JWT Access. Evidência local: testes do Worker.

### 17. Demonstração: do movimento ao saldo

Executar, se houver tempo, os passos no browser. Primeiro criar receita de 25000 MT na categoria Salário; depois despesa de 5000 MT em Alimentação, com datas no mesmo ano seleccionado. Confirmar os cartões e recarregar. Os testes E2E também fizeram edição, eliminação e gestão de categorias.

Fonte no slide: Fonte: testes locais de integração e E2E. Montantes temporários de demonstração.

### 18. Testes e resultados obtidos

Os números são do relatório de testes registado em 11 de Outubro de 2026. São 55 testes unitários/de integração e 2 percursos end-to-end, totalizando 57 casos executados. Distinguir testes de componente com mocks HTTP dos testes Worker/D1 no runtime local. Estes resultados não comprovam desempenho ou disponibilidade na cloud.

Fonte no slide: Fonte: docs/TESTING.md — execução local em 11/10/2026.

### 19. Como observar a execução serverless

Mostrar a aba Network durante a demonstração e relacionar o pedido com o log. O requestId permite correlacionar eventos. Não mostrar uma latência inventada no slide: o painel mede-a ao vivo. A duração HTTP inclui rede e processamento e não corresponde ao tempo de CPU facturado. Métricas remotas só estarão disponíveis depois de publicar.



### 20. Vantagens, custos e limitações

Relacionar vantagens com escolhas observadas, sem prometer poupança medida. O modelo de cobrança depende do plano; não inserir preços fixos. Neste projecto todos os pedidos passam pelo Worker para validação de Access, incluindo assets. D1 tem limites próprios; escalabilidade do compute não elimina gargalos nos dados.

Fonte no slide: Referências: [4] preços Workers; [5] preços D1. Não foi realizada análise comparativa de custos.

### 21. Estado actual e caminho para publicação

Ser preciso sobre o estado do trabalho: funciona no computador com Wrangler e D1 local. O dry-run apenas valida o empacotamento. Para publicar, falta autenticar na conta, criar a base remota, preencher o ID, configurar domínio e Access, aplicar migrações e publicar com autorização. Dados locais não são transferidos automaticamente.

Fonte no slide: Fonte: docs/DEPLOYMENT.md. Nenhuma publicação remota foi realizada.

### 22. Conclusão e trabalhos futuros

Retomar o objectivo geral. A implementação demonstra execução orientada a pedidos, regras no Worker e persistência independente no D1 local. Os testes sustentam o funcionamento nos fluxos verificados. A demonstração remota exige a configuração e publicação ainda pendentes. Melhorias futuras não devem ser apresentadas como funcionalidades já existentes.



### 23. Referências e fontes das evidências

As referências técnicas são documentação oficial Cloudflare, consultada em 11 de Outubro de 2026. Os números de testes e capturas vêm do projecto local. Os links completos estão nas notas e no guião. Os diagramas foram elaborados para esta apresentação.

Fonte no slide: Consulta: 11/10/2026. Capturas e diagramas: elaboração própria a partir do projecto.

### 24. Questões e discussão

Agradecer e convidar perguntas. Preparar respostas sobre a diferença entre FaaS e serverless, localização da persistência, validação monetária, ausência de contas, limites do teste local e configuração de Access. Se solicitado, abrir a aplicação ou a documentação do repositório.



## Referências completas

- [1] Cloudflare — How Workers works: https://developers.cloudflare.com/workers/reference/how-workers-works/
- [2] Cloudflare — D1 overview: https://developers.cloudflare.com/d1/
- [3] Cloudflare One — Validate JWTs: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- [4] Cloudflare — Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- [5] Cloudflare — D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- [6] CloudExpense — documentação e testes: docs/ARCHITECTURE.md · SERVERLESS.md · TESTING.md

## Regenerar

Requer Python, python-pptx (1.0.2 utilizado) e Pillow.

Comando: python docs/apresentacao/gerar_apresentacao.py

O script lê imagens/ e grava o PPTX em docs/. Exportar PDF no PowerPoint para preservar a paginação.
