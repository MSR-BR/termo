# Notas e decisões — Change 041

## Decisões

- Nenhuma alteração funcional será feita sem uma quebra reproduzível.
- A auditoria encontrou o produto íntegro no estado local atual.
- O slide `outputs/TERMO-slide-divulgacao-conferencia.pptx` é material de
  divulgação, não é referenciado pela navegação do app e não modifica SEO,
  autenticação ou comportamento.
- A T36 e as T37–T40 suspensas permanecem inalteradas.

## Limitação

O executável `agent-browser` não estava disponível neste ambiente. A validação
visual exigida foi realizada pelo navegador integrado do Codex, combinada com
varredura HTTP completa e os testes automatizados do repositório.

## Decisões humanas pendentes

- Nenhuma para esta Change; o usuário autorizou explicitamente o CPD.

## Status de publicação

- Commit auditado: `511d442`.
- Push: `main` publicada em `origin/main`.
- Deploy: `dpl_HkZiJYJkWHnEv8Zs5yWVGFdncikF`, estado `Ready`.
- Domínios validados: `https://termo.app.br` e
  `https://termo-theta.vercel.app`.
- Verificação pós-deploy: 114/114 rotas válidas, superfícies principais
  renderizadas e nenhum erro de runtime ou resposta `5xx` encontrado.
