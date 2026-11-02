# 073 — Orientação de login para validar estudo

Data: 2026-11-01. Continuação da Change transversal 003 de divulgação (cadastro TERMO).

## Problema
Na página de estudo pública, clicar em entrar para salvar progresso sem sessão abria o modal genérico, que não esclarecia que validar estudo exige um segundo clique após o retorno do login. A revisão do código confirma que a validação não é executada automaticamente. A observação foi feita sem autenticar uma conta e não demonstra a causa do baixo uso.

## Alteração local
O modal mostra uma mensagem específica para a intenção de validar estudo, orientando a entrar e clicar novamente em Validar estudo ao retornar. Ao abrir pelo acesso comum, o contexto genérico é restaurado. Não altera autenticação, pontuação ou registro de eventos.

## Validação e pendências
Testado no navegador local: convite de validação e retorno ao texto genérico; configuração OAuth não estava disponível no servidor estático, portanto o fluxo autenticado completo não foi testado. Passaram test:analytics, test:auth-config, test:gamification e test:gamification-contract. Ainda não publicado. Antes de publicar, verificar o fluxo OAuth autenticado, preparar revisão isolada preservando mudanças preexistentes, atualizar a versão em cache dos assets e executar o procedimento de publicação do projeto. Investigar o fallback de registro local e medição real de novos cadastros com atribuição, sem confundir login com cadastro.
