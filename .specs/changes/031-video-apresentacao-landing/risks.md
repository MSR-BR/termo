# Riscos — Change 031

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Vídeo aumentar o carregamento inicial | baixa/média | sem autoplay e `preload="metadata"` | inspeção de rede e interação |
| Conteúdo vertical ser cortado | baixa/média | proporção explícita e largura limitada | revisão desktop/mobile |
| Edição direta de `home.html` ser perdida | média/alta | alterar o gerador SEO canônico | regeneração idempotente |
| Player não ser acessível por teclado | baixa/média | controles nativos e foco visível | teste de teclado |
| Campanha ser criada sem evidência | baixa/média | decisão adiada em documentação | análise futura de GA4/Ads |

## Riscos que impedem conclusão

- A validação publicada depende de autorização posterior para CPD.
