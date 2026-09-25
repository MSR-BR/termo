# Notas e decisões — Change 046

- A T42 encontrou 18 URLs indexadas e 90 não indexadas; 86 eram descobertas,
  mas ainda não indexadas. Essa contagem precisa ser reavaliada após T43.
- O Search Console não tinha dados suficientes para Core Web Vitals em nenhuma
  categoria de dispositivo.

## Auditoria em 25/09/2026

- T43: `termo.app.br` está associado ao projeto Vercel `termo`; o host legado
  redireciona permanentemente para ele. `https://termo.app.br/sitemap.xml`
  responde HTTP 200. A verificação do novo domínio no Search Console ainda era
  pendente na abertura da T46.
- A conta Search Console `mario.reis.junior@gmail.com` exibia apenas a propriedade
  `https://termo-theta.vercel.app/`, não a propriedade `termo.app.br`. O relatório
  legado (atualizado em 20/09) mostrava 18 URLs indexadas e 92 não indexadas:
  86 descobertas e não indexadas, 5 rastreadas e não indexadas, 1 alternativa
  com canonical apropriado. **Esses números não representam o novo domínio.**
- Classificação das 86 URLs descobertas no relatório legado: 5 hubs públicos
  (`conteudo`, `exercicios-de-termodinamica`, `leis-da-termodinamica`, `search`,
  `simuladores-de-termodinamica`), 5 rotas de simuladores (incluindo o índice
  dinâmico) e 76 páginas de slides (capítulos 01: 15; 02: 7; 03: 23; 04: 21;
  06: 10). Nenhuma era do capítulo 05. A ação para as URLs úteis é consolidar
  no host canônico, não pedir indexação do host antigo. O índice dinâmico de
  simuladores foi classificado como `noindex`; as outras páginas continuam
  públicas e devem ser acompanhadas no novo domínio.
- O sitemap enviado à propriedade legada foi lido em 24/09 com 104 erros
  `URL not allowed`: suas URLs já apontavam para o domínio novo e, portanto,
  estão fora do escopo da propriedade antiga. É necessário enviar o sitemap
  à propriedade verificada do domínio novo.
- O sitemap local foi reduzido de 105 para 104 URLs, removendo
  `simulators/index.html`, que sem parâmetro não contém um simulador. Os nove
  simuladores autônomos receberam canonical, descrição e dados estruturados
  próprios, baseados no catálogo existente. A busca pública ganhou links
  discretos para o mapa de conteúdo e os simuladores.
- O teste de SEO percorre todas as 104 URLs: arquivo físico, host, canonical,
  indexabilidade e exclusão de capítulo 05, `source`, API e descadastro.
  `robots.txt` preserva a exclusão de `/unsubscribe.html` inclusive na
  regeneração dos artefatos.
- Não se conclui melhoria de posições, impressões ou indexação antes de o
  Search Console acumular dados para a propriedade canônica.
- Rota planejada: `gpt-5.6-sol / high`; rota realmente usada: não exposta
  pelo ambiente desta tarefa.

## Validação local

- `npm run check`: aprovado; 61 seções públicas, capítulo 05 bloqueado.
- `node --test tests/*.test.mjs`: 128/128 aprovados.
- `git diff --check`: aprovado.
- Monitoramento proposto: 23/10, 20/11 e 18/12/2026 (28/56/84 dias após
  25/09), comparando sempre períodos equivalentes e registrando limitações.

## Status de publicação

- CPD dos ajustes técnicos: autorizado pelo usuário em 25/09/2026. Identidade
  da revisão e deployment devem ser consultadas no Git/Vercel; a etapa externa
  do Search Console permanece separada até a propriedade ser verificada.
