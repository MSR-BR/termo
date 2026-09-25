# Notas — Change 052

## Decisões preservadas

- Pontos reconhecem ações, não domínio.
- Ausência não gera punição.
- Ranking público permanece desligado.
- Simulado, Desafio do dia e simulador são modos distintos.

## Decisões do rollout

- Grafo aprovado para publicação sem arestas de pré-requisito ativas.
- Migração aplicada antes do runtime no projeto TERMO `guifkjjuxsdgwjlhkmnx`.
- Ledger v1 ativado somente em produção após validação do banco.
- Revisar pré-requisitos editorialmente em Change futura; nenhuma relação foi inferida.

## Implementação local

- grafo gerado a partir de registry, manifesto de fontes e taxonomia;
- quatro modos persistidos separadamente;
- confiança opcional e classificação server-side de evidência;
- domínio com duas recuperações independentes em dias e formas diferentes;
- desafio diário priorizado por fraqueza, vencimento e intercalação;
- repetição de simulado sem novos pontos;
- simuladores auditados como `open_only`;
- próxima ação e missão opcionais com motivo, fonte, duração e alternativa.

## Publicação

- Autorização: `cpd` em 25/09/2026.
- Supabase: migração `20260925162106` aplicada e registrada.
- Banco: função presente; `anon` e `authenticated` sem `EXECUTE`;
  `service_role` com `EXECUTE`; índice diário e cálculo UTC verificados.
- Dados preservados: 36 perfis, 39 eventos, 30 itens e 10 tentativas; dry run
  com zero divergências de XP, itens estudados e domínio.
- Vercel: `TERMO_GAMIFICATION_LEDGER_V1=true` configurada em produção.
- Commit, push e deploy: executados no fechamento deste `cpd`.
