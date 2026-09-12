# Objetivo — Change 029

Adicionar ao TERMO um histórico privado e persistente das aberturas de
simuladores feitas por usuários autenticados, sem substituir a telemetria
agregada, bloquear visitantes ou conceder pontos automaticamente.

## Classificação do projeto

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Limites

- Fora do escopo: avaliar desempenho no simulador, registrar controles internos,
  conceder pontos, alterar o conteúdo científico ou criar histórico anônimo.
- Dependências: Supabase Auth, Data API e aplicação da migration da T29.
- Decisões humanas necessárias: autorização posterior para aplicar a migration,
  fazer commit, push e deploy.
