# Roadmap canônico de Changes do TERMO

Referência: `TERMO_CHANGE_PROGRAM.md`.

## Numeração

Antes de criar uma Change, inspecione este roadmap, `.specs/changes/` e o
histórico em `changes/`. Use três dígitos e nunca mantenha duas Changes
concorrentes com o mesmo número.

## Programa atual

| Change | Nome canônico | Rota planejada | Fallback | Estado |
|---|---|---|---|---|
| 025 | `025-po-magico-governance-baseline` | `gpt-5.6-terra / medium` | `gpt-5.6-sol / medium` | publicada |
| 026 | `026-busca-publica-conteudo-revisado` | `gpt-5.6-terra / medium` | `gpt-5.6-sol / medium` | publicada |
| 027 | `027-registry-editorial-explicito` | `gpt-5.6-sol / medium` | `gpt-5.6-sol / high` | publicada |
| 028 | `028-manifesto-fontes-exercicios-ia` | `gpt-5.6-sol / high` | `gpt-5.6-sol / xhigh` | publicada |
| 029 | `029-atividade-individual-simuladores` | `gpt-5.6-sol / medium` | `gpt-5.6-sol / high` | publicada e validada |
| 030 | `030-auditoria-paridade-termo-quantum` | `gpt-5.6-sol / high` | `gpt-5.6-sol / xhigh` | planejada |
| 031 | `031-video-apresentacao-landing` | `gpt-5.6-terra / medium` | `gpt-5.6-sol / medium` | publicada e validada em produção |
| 032 | `032-po-magico-video-workflow-reference` | `gpt-5.6-terra / medium` | `gpt-5.6-sol / medium` | publicada e validada |
| 033 | `033-confiabilidade-desafio-do-dia` | `gpt-5.6-sol / high` | `gpt-5.6-terra / high` | publicada e validada em produção |
| 034 | `034-consistencia-avaliacoes-app` | `gpt-5.6-sol / xhigh` | `gpt-5.5 / xhigh` | publicada e validada em produção |
| 035 | `035-inventario-publico-migracao` | `gpt-5.6-sol / high` | `gpt-5.6-terra / high` | publicada e validada; privatização suspensa |
| 041 | `041-auditoria-integridade-pre-publicacao` | `gpt-5.6-sol / high` | `gpt-5.6-terra / high` | em validação para CPD |

Os documentos datados em `changes/` constituem o histórico anterior e não são
renumerados. A busca pública já implementada localmente será reconciliada como
Change 026, sem duplicar sua implementação.

## Roteamento de modelos

Cada Change deve declarar a rota planejada conforme o Pó Mágico e registrar a
rota real somente com evidência. Campos desconhecidos recebem `não exposto` ou
`não medido`; nunca devem ser inferidos.

As rotas acima são o ponto de partida e não comprovam execução. Escalonamentos
seguem falhas observáveis de validação. O ambiente consultado em 2026-09-11
expôs Luna, Terra e Sol; Astra não foi anunciado pelo host desta tarefa.

## Decisão sobre a visibilidade do repositório

Em 14/09/2026, após a auditoria T35, foi decidido manter `MSR-BR/termo`
público. O programa de privatização e as propostas T37–T40 foram suspensos e
não devem ser executados sem uma nova decisão humana explícita. Uma futura T36
poderá tratar somente da fronteira pública do Vercel e da proteção do índice
administrativo, sem alterar a visibilidade do GitHub. Essa proteção reduz a
exposição pelas URLs do produto, mas não torna confidenciais arquivos que
continuem rastreados no repositório público.

Use `_template/` para novas Changes.

A numeração salta de 035 para 041 porque a T36 permanece reservada ao hardening
independente do Vercel, enquanto T37–T40 continuam suspensas pela decisão
registrada na T35.
