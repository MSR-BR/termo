# Riscos — Change 052

| Risco | Probabilidade/impacto | Controle | Evidência |
|---|---|---|---|
| Recomendar conteúdo errado | baixa/alta | registry, fontes, grafo sem pré-requisitos inferidos e fail-closed | `npm run check`, grafo com 43 seções e capítulo 05 ausente |
| Confundir engajamento com domínio | baixa/alta | tipos de evidência e duas recuperações independentes | `tests/gamification-adaptive-v1.test.mjs` |
| Farming de pontos | baixa/alta | repetição sem XP, idempotência e desafio único por dia | índice parcial + RPC server-side |
| IA indisponível | baixa/média | fallback determinístico baseado em fonte aprovada | smokes de IA e quiz |
| Sobrecarga cognitiva | média/média | confiança opcional, explicação curta e alternativa | revisão local desktop/320 px |
| Migração e runtime fora de ordem | média/alta | aplicar SQL antes do deploy e fazer smoke controlado | runbook de arquitetura |

## Bloqueios

- Rollout autorizado por `cpd` e banco validado em 25/09/2026.
- Relações de pré-requisito permanecem bloqueadas até revisão editorial humana.
