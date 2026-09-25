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

- Commit, push e deploy: autorizados para a revisão validada. Os identificadores
  e o resultado efetivo serão conferidos no Git e no Vercel após a execução,
  sem inserir um hash autorreferente neste documento.
