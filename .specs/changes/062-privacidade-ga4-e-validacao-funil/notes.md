# Notas e decisões

O `gtag("config", ...)` anterior enviava a URL corrente sem substituição explícita de `page_location`. No retorno OAuth, ela podia conter um código temporário. A solução usa uma lista positiva de parâmetros de campanha e navegação para o valor enviado ao GA4, sem alterar `window.location` ou a rotina de login. O referenciador interno e o caminho enviado pelo evento `termo_open_app` recebem o mesmo filtro.

Os testes locais comprovam a forma do payload e a emissão dos eventos, não a chegada dos dados à propriedade GA4 em produção. A queda histórica de `termo_open_app` ainda não tem causa comprovada; não justificar alterações em Ads com base apenas nesse teste. A verificação de medição automática do GA4 e de cache do script permanece para depois de publicação autorizada.

O repositório já tinha modificações não relacionadas em três scripts de injeção e um documento de permissões Supabase; foram preservados.

Em 10/10/2026, o proprietário autorizou CPD da T62. Antes da publicação, a resposta pública do script indicava `Cache-Control: public, max-age=0, must-revalidate` e ETag. Não será feita uma reescrita de 152 páginas HTML apenas para alterar a query string de versão; o gate de produção conferirá o conteúdo e o ETag servidos no domínio canônico. Não foi localizado service worker no projeto.

## Status de publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy: não realizado.
- Configuração remota: não alterada.
