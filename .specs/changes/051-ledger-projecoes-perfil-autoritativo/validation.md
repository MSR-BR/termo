# Validação — Change 051

## Gates planejados

- [x] testes unitários, handler, banco e contrato
- [x] idempotência, retry, clique duplo e falha parcial
- [x] RLS e grants para anônimo, próprio, outro e serviço em stack local
- [x] advisors do Supabase local
- [x] `npm run check`
- [x] `npm run test:gamification`
- [x] `npm run test:gamification-contract`
- [x] `node --test tests/*.test.mjs`
- [x] `git diff --check`

## Evidência

- Estado: schema T51 publicado e validado no remoto; runtime ativado pela T52.
- Baseline Git: `51210c2bac49f36b45090b4c03763757d17a51ea`.
- CLI Supabase consultado: `2.117.0`.
- pgTAP em stack local isolada: 46 testes do pacote e 2 verificações adicionais
  de upgrade legado aprovados.
- Advisors locais: nenhum problema encontrado.
- Testes de migration: 9 aprovados.
- Testes de gamificação: 15 aprovados.
- Testes de contrato: 5 aprovados.
- Suíte completa: 91 testes aprovados, 0 falhas.
- `npm run check`: aprovado; 6 capítulos, 61 seções públicas e 43 elegíveis para IA.
- Auditoria rápida de segurança: aprovada.
- Limitação: a stack local completa do repositório encontra colisão preexistente
  entre duas migrations `20260531`; a T51 foi validada em projeto temporário
  com versões únicas, sem reescrever o histórico.
- Remoto confirmado: `MSR-BR's Org / termo / guifkjjuxsdgwjlhkmnx`, branch
  `main`, Postgres 17.6.
- Snapshot remoto anterior: 36 perfis, 39 eventos, 30 progressos e 10
  tentativas; 825 pontos em perfis, 780 no ledger e baseline histórico de 45
  pontos preservado pela migration.
- Data API: ativa, gamificação fora das tabelas públicas e auto-expose desligado
  antes da migration.
- Fixture do esquema legado confirmou a inclusão de `source_event_id` na tabela
  de progresso e a preservação do baseline de 45 pontos sem eventos.
- Advisors remotos após o rollout: segurança 0 erros/2 advertências; desempenho
  0 erros/2 advertências; achados remanescentes são preexistentes e externos à
  T51.
- Migration `20260924124810` registrada; grants e RLS verificados; dry run dos
  36 perfis com zero divergências. `p_apply=true` não foi necessário.
- O histórico preexistente de migrations continua divergente e mantém
  `supabase db push` bloqueado; o rollout manual controlado não reescreveu esse
  histórico.
- Evidência operacional: `docs/operations/termo-t51-ledger-rollout.md`.
- Modelo real: `não exposto`.
