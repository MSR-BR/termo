# Notas e decisões — Change 027

- Rota planejada: `gpt-5.6-sol / medium`.
- Fallback permitido: `gpt-5.6-sol / high`.
- Modelo e reasoning efetivamente usados: não expostos pelo ambiente.
- Fallback observado: não exposto.
- Tokens, custo e latência: não medidos.
- A política humana é `data/termo-editorial-policy.json`.
- O arquivo `data/termo-editorial-registry.json` é gerado e não deve receber
  edição editorial manual.
- Os capítulos 01, 02, 03, 04 e 06 estão publicados; o capítulo 05 permanece
  bloqueado.
- As 61 seções publicadas continuam elegíveis para busca e SEO.
- A elegibilidade de exercício IA usa exclusivamente `aiExercise: true` nos
  dados estruturados, subordinada à publicação do capítulo. O marcador presente
  no HTML não é autorização editorial.
- Foram encontradas 12 páginas com marcador visual de exercício, mas sem
  elegibilidade estruturada. O controle passa a ocultá-las e o servidor passa a
  rejeitá-las; 43 seções permanecem elegíveis.
- Decisão editorial futura possível: revisar individualmente as 18 seções
  públicas hoje inelegíveis antes de alterar seus dados canônicos.
- CPD autorizado e concluído em 2026-09-11. A implementação foi publicada pelo
  commit `1e1aaf0` no deployment Vercel
  `dpl_2k4ZBCgPAe6RK8zKNts3tynxdRsR`.
