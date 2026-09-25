# Validação — Change 053

## Gates planejados

- [x] `npm run check`
- [x] `npm run test:seo`
- [x] `npm run test:learning-help`
- [x] testes de links e conteúdo
- [x] HTML/CSS/JS válidos
- [x] desktop, 320 px, teclado, foco e estrutura de acessibilidade
- [x] `git diff --check`

## Evidência

- Estado: publicada por `cpd` em 25/09/2026.
- Modelo real: `não exposto` pelo runtime.
- Fallback: não acionado.
- `npm run check`: passou.
- `npm run test:learning-help`: 5/5 testes passaram.
- `npm run test:seo`: 8/8 testes passaram.
- suíte completa `node --test --test-reporter=dot tests/*.test.mjs`: 104/104 testes passaram.
- navegador local: página carregada sem login, sem erros de console ou overlay;
  viewport de 320 px com `scrollWidth = innerWidth = 320`; foco visível de 3 px;
  skip link exposto e FAQ aberta pelo teclado; árvore de acessibilidade preservou
  landmarks, títulos, links e disclosures.
- Zoom visual e leitor de tela assistivo real permanecem recomendados no smoke
  pós-publicação; a estrutura semântica foi validada pelo navegador.
