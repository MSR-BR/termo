# Validação

08/10/2026: npm run check aprovado; 142 testes aprovados (138 anteriores + 4 de apresentação). O teste antigo de política dependia de texto inline; adaptado ao módulo que agora renderiza o painel, mantendo a exigência de privacidade e limite causal.

Browser local Chromium com APIs interceptadas: 320/390/1280px, tabelas por teclado, texto 200%, refresh, primeiro erro/retry, erro após sucesso preservando HTML/horário e prevenção de concorrência. Nenhum envio de e-mail, chamada paga ou alteração remota durante testes.

Validações finais: git diff --check e staged diff aprovados; módulo JS e oito scripts inline parseados. Imagem móvel inspecionada, botão com estilo nativo e tabelas confinadas. O teste de política foi ajustado para inspecionar o novo módulo, sem remover o limite causal.

Produção: código `1ff9365`, deployment `dpl_BFy8LJjbCJepVZ1E26XcfCLxLPfM` READY. HTML e módulo retornam HTTP 200 no domínio canônico, JavaScript com MIME correto e bytes iguais ao local (SHA-256 `0eb1e64c8b3be0df5b8ccff7f83e07e08b17c6dad8798b5cd3e43b325c54560a`). API sem sessão retorna 403.

Safari autenticado: painel abriu, todas as seis fontes disponíveis; clique real bloqueou o botão enquanto carregava e avançou o horário de 20:36:31 para 20:37:17 Brasília, 08/10/2026. Botão voltou a ficar habilitado e relatório prático permaneceu visível. Nenhum token, e-mail individual ou resposta pessoal foi exportado. Teste com outra conta é automatizado (403); não foi usado outro usuário real.

Observabilidade: consulta de logs do deployment mostrou somente avisos Node DEP0169 (url.parse) em stderr, já presentes antes; não estabeleceram falha funcional do painel. Não foi feita auditoria de dependências nem de drains; nenhum monitor novo criado.

Pó Mágico v20261008.002: herança integral de v20261008.001 conferida, catálogo JSON e diff válidos, commit `6cc586a` enviado a origin/main. Mudanças preexistentes em ambos os repositórios preservadas e excluídas.

Modelo real/reasoning: não expostos. Fallback: não observado. Tokens/latência: não medidos.
