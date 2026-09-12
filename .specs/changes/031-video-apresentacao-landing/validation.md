# Validação — Change 031

## Gates planejados

- [x] `npm run seo`
- [x] `npm run check`
- [x] `npm run test:seo`
- [x] validação do hash do MP4
- [x] validação de sintaxe do gerador
- [x] `git diff --check`
- [x] revisão do diff e de segredos
- [x] validação visual desktop/mobile e por teclado
- [x] smoke HTTP local do vídeo e da capa
- [ ] validação de produção após deploy autorizado

## Evidência de execução

- Data: 2026-09-12.
- Arquivo recebido: MP4, 13.068.338 bytes, duração aproximada de 65,57 s,
  quadro vertical de 576 × 976 e uma faixa de áudio.
- SHA-256 de origem e cópia:
  `673173e7fa256ac95f0f310d2286d864b50e7a3b50c800f97bfdbcbf5312e294`.
- `npm run seo`: aprovado; landing regenerada a partir da fonte canônica.
- `npm run check`: aprovado; 6 capítulos, 61 seções públicas e 43 seções IA
  elegíveis permaneceram coerentes.
- `npm run test:seo`: 7/7 testes aprovados, incluindo presença física do MP4 e
  da capa, ausência de autoplay e metadata `VideoObject`.
- Sintaxe: `scripts/build-seo-artifacts.mjs` e `dev-server.mjs` aprovados por
  `node --check`.
- Smoke local: landing, MP4 e capa responderam HTTP 200; MP4 servido como
  `video/mp4` e capa como `image/png`.
- Navegador desktop: vídeo 360 × 610 px, proporção preservada, duração real
  65,566667 s, controles ativos, autoplay desligado e nenhum erro no console.
- Navegador móvel 390 × 844 px: vídeo 320 × 542,22 px, layout em uma coluna e
  `scrollWidth = clientWidth = 390`, sem transbordamento horizontal.
- Teclado: ordem de Tab alcançou os dois links e o player; reprodução e pausa
  também foram confirmadas no player.
- Revisão visual: capa legível, conteúdo sem corte e coerente com as cores da
  landing.
- `git diff --check`: aprovado.
- Produção: não executada; depende de CPD autorizado.

## Modelo realmente observado

- Modelo: `não exposto`
- Reasoning: `não exposto`
- Fallback utilizado: `não observado`
- Tokens: `não medidos`
- Latência: `não medida`
- Fonte da evidência: metadados do ambiente, quando disponíveis.

Não substituir valores desconhecidos por estimativas.
