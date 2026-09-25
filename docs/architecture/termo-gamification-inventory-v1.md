# Inventário e mapa de migração da gamificação do TERMO — v1

## Fontes inspecionadas

- `lib/gamification-event-handler.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-shared.mjs`
- `lib/chapter-quiz-handler.mjs`
- `lib/gamification-ai-quiz.mjs`
- `assets/termo-analytics.js`
- `assets/termo-user-data.js`
- `assets/termo-rating.js`
- `assets/ai-exercises.js`
- `index.html`
- drafts de gamificação em `supabase/drafts/`
- migrations de analytics e atividade de simuladores em `supabase/migrations/`
- registry editorial e manifesto de fontes em `data/`

## Superfícies atuais

| Tipo | Identificador | Estado local observado | Classificação v1 |
|---|---|---|---|
| API | `GET /api/gamification-profile` | snapshot `phase-1c-live` | projeção legada |
| API | `POST /api/gamification-event` | seis eventos em allow-list | comando autoritativo legado |
| API | `GET/POST /api/chapter-quiz` | simulado, revisão e retry | assessment verificado |
| Tabela | `gamification_profiles` | definida no pacote SQL draft | projeção mutável |
| Tabela | `gamification_event_log` | definida no pacote SQL draft | ledger legado |
| Tabela | `gamification_item_progress` | definida no pacote SQL draft | projeção por seção |
| Tabela | `chapter_quiz_attempts` | definida no pacote SQL draft | tentativas verificadas |
| RPC | `apply_gamification_event_atomic` | draft e modo por feature flag | consolidação transacional legada |
| RPC | `record_chapter_quiz_attempt_atomic` | draft e modo por feature flag | consolidação transacional legada |
| Tabela | `simulator_activity` | migration oficial no repositório | abertura, sem evidência pedagógica |
| RPC | `record_simulator_open` | migration oficial no repositório | `simulator_opened` |
| Tabela | `app_analytics_events` | migration oficial no repositório | analytics somente |

O documento operacional registra validação remota anterior do pacote de
gamificação, mas o repositório não contém uma migration oficial equivalente aos
drafts. T51 deve comparar o schema remoto real antes de gerar qualquer migration.

## Eventos autoritativos legados

O mapa completo e executável está em
`data/termo-gamification-policy-v1.json`.

- `study_item_complete` -> `section_completed`; vale atividade verificada, não
  domínio; a ação atual “marcar como estudado” precisa de evidência mais forte.
- `chapter_quiz_completed` -> `assessment_completed`.
- `chapter_quiz_review_completed` -> `assessment_reviewed`.
- `chapter_quiz_retry_completed` -> `assessment_retry_completed`.
- `daily_return` -> `mechanic_acted`; comportamento somente, sem recompensa na
  política v1.
- `chapter_mastery_completed` -> `concept_mastery_reached`; o critério atual de
  um único simulado é insuficiente para a política v1.
- `record_simulator_open` -> `simulator_opened`; sem recompensa e sem domínio.

Todos os eventos emitidos para `TermoAnalytics` foram classificados como
`analytics_only`. Alguns possuem equivalente semântico no contrato, mas não são
promovidos a evidência autoritativa porque nascem no navegador.

## Regras e mecanismos atuais

- pontos: 20 por item estudado, 30 no primeiro simulado, 10 em revisão, 10 em
  retry, 8 no retorno diário e 80 no evento de domínio;
- nível: um nível a cada 100 pontos;
- streak: atualizado por qualquer evento autoritativo recebido;
- badges: primeiro item, 3 e 7 dias, primeiro simulado, capítulo dominado e
  excelência;
- missões: campo `active_missions_json`, sem motor operacional;
- simulado: `full_quiz`, `guided_review` e `focused_retry`;
- Desafio do dia: uma pergunta derivada do histórico elegível, com fallback
  canônico; permanece distinto do simulado;
- simulador: contagem de abertura autenticada e analytics agregada;
- ranking: inexistente, como exige a política padrão.

## Lacunas e conflitos para T51/T52

1. `daily_return` concede 8 pontos no runtime, contra zero na política v1.
2. streak pode avançar sem atividade pedagógica significativa.
3. domínio atual pode nascer de um único simulado com 80%.
4. repetição de simulado dominado pode conceder 5 pontos fora do adapter v1.
5. `study_item_complete` registra intenção de estudo, não uma conclusão aferida.
6. o profile não traz evidências fracas, vencidas, insuficientes ou próxima ação
   com fonte, duração e alternativa.
7. eventos não possuem ainda todo o envelope compartilhado.
8. capacidades de simuladores além da abertura não estão modeladas.
9. missões não são operacionais e badges ainda derivam de regras legadas.
10. o caminho REST não atômico continua disponível quando a feature flag RPC
    está desligada.

## Comportamento que deve ser preservado

- identidade visual e textos em português;
- pontos e jornada existentes durante a migração;
- simulados por capítulo e Desafio do dia como modos distintos;
- tentativas e pontos válidos já persistidos;
- abertura anônima de simuladores sem atividade identificável;
- atividade autenticada de simulador sem pontos;
- registry editorial e manifesto como autoridades de elegibilidade;
- capítulo 5 bloqueado;
- login, PDF protegido, exercícios IA, SEO e analytics atuais.
