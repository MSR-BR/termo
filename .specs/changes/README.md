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
| 031 | `031-video-apresentacao-landing` | `gpt-5.6-terra / medium` | `gpt-5.6-sol / medium` | validada localmente; publicação pendente |

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

Use `_template/` para novas Changes.
