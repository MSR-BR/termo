# Notas e decisões

## Premissas

- T50–T54 já foram versionadas e publicadas, conforme histórico Git e registros
  de deploy existentes.
- Esta Change fecha evidências; não adiciona uma nova mecânica.
- Uma inspeção da árvore de acessibilidade não substitui teste com VoiceOver.
- O responsável autorizou em 25/09/2026 a correção mínima do defeito revelado
  pelo smoke: falha de sincronização não pode se apresentar como perfil zerado.

## Decisões humanas

- O responsável autorizou `cpd` da T55 em 25/09/2026.
- Zoom real e VoiceOver permanecem como validação assistiva posterior, conforme
  a limitação registrada em `validation.md`.

## Status de publicação

- Commit `e10bb6c` (`fix: show recoverable journey sync error`) enviado a
  `origin/main` em 25/09/2026.
- Deploy de produção `dpl_k8rYxjamJ7K2QnoBoiYaABpEkPas` ficou `Ready`, com
  alias `https://termo.app.br`. A landing respondeu HTTP 200, o domínio legado
  redirecionou com HTTP 308 e a API da jornada recusou acesso anônimo (401).
- O smoke no HTML publicado confirmou o aviso de falha de sincronização e o
  botão de nova tentativa. Zoom real e VoiceOver seguem pendentes como teste
  assistivo, sem evidência de regressão nos 125 testes então executados.
