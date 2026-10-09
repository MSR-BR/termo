# Riscos

- Sem `localStorage`, o aviso automático é omitido; o perfil continua disponível por clique.
- O primeiro acesso após a correção ainda pode mostrar o aviso uma vez se os documentos não estiverem aceitos. Depois, novas janelas não repetem o aviso para a mesma conta e versões.
- Uma atualização real dos Termos ou da Política pode produzir um novo aviso único.
- Cache de script antigo é mitigado pela revalidação normal do asset em Vercel; verificar resposta publicada.
