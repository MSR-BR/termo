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

## Propriedade e sitemap canônicos — 25/09/2026

- Com autorização do usuário, foi criada na conta titular do projeto a
  propriedade de prefixo de URL
  `https://termo.app.br/`. O Search Console confirmou a titularidade
  automaticamente pelo método **arquivo HTML**. Esse arquivo não deve ser
  removido, para preservar a verificação.
- Com autorização separada, `https://termo.app.br/sitemap.xml` foi enviado à
  nova propriedade. A interface confirmou o envio, mas o relatório exibiu
  `Couldn't fetch`, tipo `Unknown` e 0 páginas descobertas. Isso **não**
  comprova que o sitemap foi processado com sucesso; a validação externa
  permanece aberta.
- Verificações independentes: o URL público respondeu HTTP 200 e
  `Content-Type: application/xml`; o XML local passou em `xmllint` e contém
  104 URLs. No teste ao vivo de inspeção do Search Console, o Google informou
  `Crawl allowed: Yes` e `Page fetch: Successful` para o próprio sitemap.
  Portanto, a causa do `Couldn't fetch` ainda não está demonstrada. Não houve
  reenvio, alteração de DNS, código ou configuração de Vercel nesta etapa.
- Reconsultar o relatório após novas tentativas de leitura do Google. Se o
  erro persistir, seguir o diagnóstico de fetch no Search Console antes de
  reenviar o sitemap; não fechar T46 nem inferir indexação de URLs a partir
  da confirmação inicial de envio.
- Nova consulta na mesma data: o sitemap ainda figura como `Couldn't fetch`,
  tipo `Unknown` e 0 URLs descobertas. O relatório de ações manuais da
  propriedade informa `No issues detected`.
- A inspeção indexada de `https://termo.app.br/` e `home.html` ainda retrata
  rastreamentos de 12 e 13/09, com canonical antigo
  `termo-theta.vercel.app` (a raiz aparecia como página com redirecionamento).
  Isso é histórico, não o estado atual: testes ao vivo de 25/09 para essas
  duas URLs mostraram fetch bem-sucedido, indexação permitida e canonical
  autorreferente em `termo.app.br`. A raiz também respondeu HTTP 200 no
  acesso público.
- `conteudo.html` e `search.html` constam como URLs desconhecidas no índice
  atual, sem sitemap de referência; seus testes ao vivo mostraram fetch
  bem-sucedido, indexação permitida e canonical autorreferente. O teste ao
  vivo demonstra elegibilidade técnica, **não** indexação concluída.
- Após confirmação específica do usuário, foi solicitada em 25/09/2026 a
  indexação de `https://termo.app.br/`, `home.html`, `conteudo.html` e
  `search.html`, todas na propriedade canônica. Para cada URL, o Search
  Console confirmou `Indexing requested` e a inclusão na fila prioritária
  de rastreamento. Isso não comprova rastreamento novo nem indexação efetiva.
  Não solicitar novamente as mesmas URLs apenas para tentar aumentar a
  prioridade. A falha de leitura do sitemap deve ser reavaliada após as
  tentativas automáticas do Google, sem reenvio imediato duplicado.

## Leitura do sitemap confirmada — 25/09/2026

- Nova consulta à propriedade `https://termo.app.br/` no Search Console:
  `/sitemap.xml` passou a mostrar tipo `Sitemap`, status `Success`, última
  leitura em 25/09/2026 e **104 páginas descobertas**. O erro inicial
  `Couldn't fetch` se resolveu sem reenvio ou mudança de código/configuração.
- Descoberta não significa indexação. Manter o acompanhamento das páginas
  prioritárias e dos relatórios de desempenho nos prazos planejados.

## Validação local

- `npm run check`: aprovado; 61 seções públicas, capítulo 05 bloqueado.
- `node --test tests/*.test.mjs`: 128/128 aprovados.
- `git diff --check`: aprovado.
- Monitoramento proposto: 23/10, 20/11 e 18/12/2026 (28/56/84 dias após
  25/09), comparando sempre períodos equivalentes e registrando limitações.

## Status de publicação

- CPD dos ajustes técnicos: autorizado pelo usuário em 25/09/2026. Identidade
  da revisão e deployment devem ser consultadas no Git/Vercel; a etapa externa
  do Search Console permanece separada até o sitemap ser lido com sucesso.
