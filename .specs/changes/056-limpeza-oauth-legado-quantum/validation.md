# Validação

## Evidências antes da limpeza

- Painéis lidos diretamente no navegador integrado via acessibilidade macOS; não pela sessão do conector Supabase (que pertence a outra organização).
- Supabase TERMO guifkjjuxsdgwjlhkmnx, organização MSR-BR. Google My First Project, número 81434140400, cliente termo-web.
- Produção termo.app.br: login Google com conta administrativa, retorno à área pessoal, persistência após recarregar e saída confirmados. Não aceitos novos termos nem modificadas preferências.
- qm-beta.vercel.app/api/public-config anuncia crasnnvdvujzxudmbakv e cliente exclusivo 1091169926547-94qapsmdmtg38hbognu8dapl1j8lpimd.apps.googleusercontent.com.
- qm-theta.vercel.app exibe Qasim Marble & Granite; não é mais o QUANTUM. Não foram enviadas credenciais a esse domínio.
- Vercel: 51 deployments listados, todos production; nenhum Preview disponível. Não criar deployment sem cpd.

## Execução

Modelo exato e esforço efetivamente usados: não expostos.

## Resultado pós-limpeza

- Google: formulário salvo e cliente reaberto; três origens TERMO/locais e somente callback Supabase TERMO, conforme oauth-after.json.
- Supabase: confirmação nomeava exatamente os dois URLs qm; remoção confirmada e painel recarregado; seis redirects TERMO/locais persistidos. Site URL permaneceu inalterado.
- Produção: novo login iniciado em termo.app.br; seletor Google indicou guifkjjuxsdgwjlhkmnx.supabase.co; conta administrativa retornou à Área pessoal e permaneceu após reload. Logout confirmado pelo retorno do botão Fazer Login com o Google sem identidade conectada.
- Nenhum termo aceito, preferência alterada, avaliação enviada ou exercício iniciado. Teste de autenticação não constitui auditoria dos totais de progresso.
- npm run check: aprovado (seis validadores).
- npm run test:auth-config: 5/5 aprovados.
- Simulação do código real buildCanonicalRedirectUrl: 5/5 origens aprovadas (canonical, legado TERMO, host representativo Preview, localhost e 127.0.0.1). Retornos mantêm somente TERMO/local e removem parâmetro OAuth de teste. Não é teste E2E de Preview.
- Preview real: pendente por inexistência de deployment Preview entre os 51 retornados. Nenhum novo deployment criado. Código confirma que esse fluxo retorna via host legado TERMO, preservado integralmente.
- Reversão disponível em oauth-before.json; não necessária nos testes executados.
- Comparação automatizada dos snapshots: somente três entradas Google e duas Supabase removidas; identificadores, callback TERMO e Site URL preservados. git diff --check aprovado; alterações preexistentes do usuário permanecem separadas.

Escopo funcional concluído em produção. Validação Preview real permanece explicitamente pendente; não há dependência adicional do QUANTUM para esta limpeza.
