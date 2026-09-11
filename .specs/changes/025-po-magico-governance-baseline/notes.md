# Notas e decisões — Change 025

## Decisões

- A numeração 025–030 corresponde aos identificadores T25–T30 aprovados.
- O documento da busca já criado em `changes/` não será duplicado nem reescrito;
  a Change 026 fará sua formalização e reconciliação.
- O Pó Mágico permanece no repositório próprio e é referenciado por hash.
- Rota planejada e rota observada são campos independentes.

## Riscos controlados

- Divergência entre roadmap novo e histórico: mitigada pela regra de consulta aos
  dois diretórios antes de numerar.
- Alegação falsa de modelo: mitigada pelo uso explícito de `não exposto`.
- Aplicação excessiva de gates: mitigada pela seleção apenas dos gates aplicáveis.

## Decisões humanas pendentes

- Nenhuma para a governança local.

## Publicação

- Commit e push: realizados no ciclo autorizado de CPD iniciado em 2026-09-11.
- Deploy: publicado junto com a Change 026; a T25 não altera o runtime.
