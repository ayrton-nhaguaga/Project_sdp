# Computação serverless aplicada ao CloudExpense

## Conceito

Serverless é um modelo em que o fornecedor gere a infraestrutura de execução. Há servidores físicos, redes, armazenamento e sistemas operativos; o programador não precisa de provisionar ou manter uma máquina dedicada para cada aplicação.

FaaS (Function as a Service) descreve a execução de funções activadas por eventos. No CloudExpense, uma requisição HTTP é o evento. A exportação do Worker recebe o pedido; Hono selecciona a rota; o código valida a entrada, executa regras de negócio e consulta D1. O modelo serverless inclui também serviços geridos de persistência.

## Workers e execução sob demanda

Workers executa JavaScript/TypeScript compilado numa infraestrutura gerida pela Cloudflare. A aplicação usa as APIs padrão Request, Response e Fetch. Não abre uma porta de um servidor Express nem mantém um processo Node.js de backend.

A Cloudflare pode reutilizar um ambiente de execução para vários pedidos. Não se deve assumir um processo novo por pedido nem persistência garantida em variáveis globais. O pequeno cache de chaves públicas JWT é uma optimização dispensável; os dados financeiros vivem no D1.

Um POST /api/transactions activa a validação e escrita. Um GET /api/dashboard/summary activa uma consulta de agregação. Quando o browser recarrega, os registos permanecem porque a persistência é independente da vida do Worker.

## Papel do D1

D1 fornece uma base de dados SQL gerida com semântica SQLite. O binding DB oferece prepared statements, consultas e batches. Migrações versionadas permitem reproduzir a estrutura em ambientes distintos. Índices por data, categoria e tipo apoiam os filtros.

O ambiente local de Wrangler simula D1 e guarda estado em disco. Demonstra a integração e persistência local, mas não mede a latência real da infraestrutura remota nem prova um deploy. É necessário publicar e observar a conta Cloudflare para demonstrar execução remota.

## Comparação

| Aspecto | Hospedagem tradicional | Este projecto serverless |
|---|---|---|
| Execução | Processo de backend numa máquina provisionada | Handler activado por HTTP no Worker |
| Operação | Sistema operativo, processos, disponibilidade | Plataforma de execução gerida |
| Escala | Configuração de instâncias e balanceamento | Plataforma gere distribuição da execução |
| Persistência | Banco instalado ou serviço externo | D1 gerido por binding |
| Custos | Recursos reservados e operação | Plano e utilização dos serviços |
| Estado | Pode existir na memória de um processo | Memória não é armazenamento fiável |
| Controlo | Acesso amplo ao ambiente | APIs e limites da plataforma |

Escalabilidade não significa capacidade infinita. Workers e D1 possuem limites distintos. A base de dados pode ser o ponto limitante; índices, consultas e volume de escrita importam. O programador continua responsável por medir o comportamento e adaptar a aplicação.

## Custos

Workers contabiliza utilização conforme o plano, incluindo requisições e tempo de CPU. D1 considera linhas lidas, escritas e armazenamento. Os índices reduzem algumas leituras, mas também têm custo de actualização. Os valores e franquias devem ser confirmados nas páginas oficiais antes da apresentação.

Como a aplicação usa run_worker_first=true para verificar Access, pedidos de assets também passam pelo código do Worker. Não se deve apresentar todo esse tráfego como hospedagem estática gratuita. A UI não estima custos nem mostra CPU, memória ou número de invocações fictícios.

Fontes: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

## Observabilidade e demonstração

1. Execute npm run db:migrate e npm run dev.
2. Abra o browser e mostre /api/health na aba Network: o handler verifica uma consulta D1.
3. Crie uma receita de 25.000 MT e uma despesa de 5.000 MT no mesmo ano.
4. Confirme o saldo de 20.000 MT no dashboard desse ano.
5. Observe os pedidos POST/GET e as respostas JSON; a API usa 2500000 e 500000 centavos.
6. Consulte a tabela D1 via Wrangler para confirmar a persistência.
7. Recarregue a página. Edite ou elimine um movimento e observe as novas consultas.
8. Mostre os logs do terminal: event, requestId, method, route, status e durationMs.
9. Após um deploy autorizado, use wrangler tail e Workers Observability na conta Cloudflare.

O painel Serverless Architecture mede o tempo HTTP no cliente com performance.now. Esse tempo inclui rede e processamento; não é tempo de CPU. A duração registada pelo Worker também não é uma medição de CPU facturável. Métricas de invocações e consumo devem ser lidas nas ferramentas oficiais.

## Vantagens

Menos administração de servidores, desenvolvimento local, deploy unificado de assets/API e integração gerida com a base. O modelo permite concentrar esforço na lógica e interface.

## Limitações e responsabilidades

Há dependência do fornecedor, quotas, limites de runtime e custos variáveis. A latência depende da rede e do acesso aos dados. Segurança, controlo de acesso, integridade, testes, privacidade, backups, migrações e eficiência continuam a ser responsabilidades do programador.

Access restringe o acesso à demonstração; não fornece separação de dados entre utilizadores dentro desta aplicação. O MVP é académico e não deve receber dados financeiros privados reais.

Referências adicionais: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers runtime](https://developers.cloudflare.com/workers/runtime-apis/).