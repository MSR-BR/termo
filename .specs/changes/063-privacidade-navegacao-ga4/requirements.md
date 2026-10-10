# Requisitos

## Funcionais

- [x] Limpar parâmetros desconhecidos de URLs comuns antes de carregar o Google tag.
- [x] Em troca de tela, manter apenas rota controlada e parâmetros de campanha conhecidos.
- [x] Preservar `utm_*`, `gclid`, `gbraid`, `wbraid` e correlatos conhecidos.
- [x] Não alterar o URL do retorno OAuth antes de o Supabase consumir o código; adiar o Google tag até a limpeza.
- [x] Reenviar ao Google tag eventos produzidos durante a espera do retorno OAuth.
- [x] Evitar `replaceState` quando a rota já está correta.
- [ ] Confirmar em produção, depois de CPD, ausência de parâmetros desconhecidos em `pageLocation` e `pageReferrer` de visualizações de rota.
- [ ] Confirmar no painel GA4 se visualizações por mudança de histórico estão ativas e se há duplicação.

## SEO

- [x] Preservar canônicos, sitemap, robots, conteúdo público e capítulo 5 bloqueado.
- [ ] Consultar a propriedade Search Console do domínio canônico para estado efetivo de indexação; as conexões desta sessão não a expõem.

## Rota planejada

- Classe: privacidade de medição e validação técnica de SEO.
- Modelo: `gpt-6.1-sol`.
- Reasoning: `high`.
- Justificativa: requer proteger o retorno OAuth sem perder atribuição de Ads nem eventos de estudo.
- Fallback permitido: `gpt-6.1-sol / xhigh` se os testes revelarem conflito de login ou duplicidade de eventos.
- Gatilhos de escalonamento: falha em login real, perda de parâmetros de campanha ou `page_view` duplicado.
- Fonte da disponibilidade: catálogo do host; modelo realmente executado não exposto.
