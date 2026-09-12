# Notas e decisões — Change 031

- O MP4 original foi copiado sem transcodificação ou recompressão.
- O vídeo é vertical e será exibido em um bloco de duas colunas no desktop e em
  uma coluna no celular.
- `preload="metadata"` reduz o custo inicial de carregamento; a reprodução exige
  ação explícita do usuário.
- A capa foi gerada pelo Quick Look a partir do próprio arquivo.
- O servidor local passou a declarar `.mp4` como `video/mp4`; a alteração não
  afeta APIs ou o comportamento de produção da Vercel.
- A metadata `VideoObject` usa a URL canônica já adotada pelo projeto e não
  modifica o canonical da landing.
- Nenhum novo evento de GA4 foi adicionado nesta Change.
- Google Ads, LinkedIn e outras campanhas serão considerados somente depois da
  próxima análise estatística.
- Commit funcional: `33ab38e573999e8f199cd9bd81da658ed70672ab`.
- Push: concluído em `origin/main`.
- Publicação: concluída e validada em `https://termo.app.br/`.
- Execução de publicação observada no GitHub Pages: `34724901151`, sucesso.
- O domínio público respondeu pela Vercel e serviu o MP4 e a capa com os tipos
  MIME esperados.
