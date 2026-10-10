# Notas e decisões

O `gtag("config", ...)` anterior enviava a URL corrente sem substituição explícita de `page_location`. No retorno OAuth, ela podia conter um código temporário. A solução usa uma lista positiva de parâmetros de campanha e navegação para o valor enviado ao GA4, sem alterar `window.location` ou a rotina de login. O referenciador interno e o caminho enviado pelo evento `termo_open_app` recebem o mesmo filtro.

Os testes locais comprovam a forma do payload e a emissão dos eventos, não a chegada dos dados à propriedade GA4 em produção. A queda histórica de `termo_open_app` ainda não tem causa comprovada; não justificar alterações em Ads com base apenas nesse teste. O script publicado e seu novo ETag foram verificados; a chegada de tráfego real foi confirmada na reconsulta abaixo.

Reconsulta em 10/10/2026: a propriedade GA4 TERMO recebeu 22 ocorrências de eventos, incluindo 7 `page_view`, em horas posteriores ao deploy. Nenhuma das URLs desses eventos nem dos referenciadores consultados continha `code`, `state`, `access_token` ou `refresh_token`, mas uma visualização continha `trk` tanto em `pageLocation` quanto em `pageReferrer`, fora da lista positiva da T62. O registro com `code` observado no período foi anterior ao deploy. Na visualização com `trk`, o referenciador e a página têm o mesmo host/caminho, mas representam a mudança `view=chapters` → `view=simulators`. O código do app mantém parâmetros desconhecidos quando chama `history.replaceState`; a documentação do Google informa que a medição aprimorada pode enviar `page_view` em `replaceState` ([fonte](https://support.google.com/analytics/answer/9216061)). O conjunto é forte evidência de um envio automático adicional que não passou pelo filtro da T62, embora a configuração remota não tenha sido lida diretamente. A correção deve ser tratada em alteração própria: avaliar desligar as visualizações por histórico na propriedade e enviar visualizações de rota com URLs filtradas; não desligar essa coleta isoladamente, pois se perderiam medidas de navegação. O proprietário confirmou depois que o login no computador funcionou; na mesma janela de 30 minutos, o GA4 Realtime mostrou 1 `login_success`, sem identificação de pessoa. Não tratar a privacidade dos eventos automáticos como inteiramente validada, nem alterar Ads com base nessa amostra.

O repositório já tinha modificações não relacionadas em três scripts de injeção e um documento de permissões Supabase; foram preservados.

Em 10/10/2026, o proprietário autorizou CPD da T62. Antes da publicação, a resposta pública do script indicava `Cache-Control: public, max-age=0, must-revalidate` e ETag. Não será feita uma reescrita de 152 páginas HTML apenas para alterar a query string de versão; o gate de produção conferirá o conteúdo e o ETag servidos no domínio canônico. Não foi localizado service worker no projeto.

## Status de publicação

- Commit de implementação: `f63a3e2` (`fix(analytics): sanitize GA4 OAuth URLs (T62)`).
- Push: `origin/main` em 10/10/2026.
- Deploy: produção `READY`, deployment `dpl_3vYDw2pK6T5XrP6ZNmjvBxbA5baR`, alias `termo.app.br`.
- Configuração remota: não alterada.
- Limite da primeira consulta: nenhum evento apareceu no Realtime logo após a publicação. Consultas posteriores comprovaram tráfego e 1 `login_success` na janela de 30 minutos após o teste confirmado pelo proprietário. O parâmetro `trk` apareceu em uma visualização de rota; há forte evidência de coleta automática por mudança de histórico, mas a configuração remota não foi confirmada.
