# Requisitos

## Funcionais

- [x] Exibir título do livro uma vez, seguido por “Prof. Mario Reis” e `https://termo.app.br/`.
- [x] Preservar título, seção, ID, dificuldade, link da página, aviso de IA, enunciado e solução.
- [x] Compor equações LaTeX antes de habilitar a impressão; impedir impressão automática quando a composição falhar.
- [x] Gerar página A4 com quebras adequadas e informar o passo “Salvar como PDF”.

## Segurança e privacidade

- [x] Escapar metadados e restringir os links exportados ao domínio canônico.
- [x] Não alterar autenticação, banco, prompts, credenciais ou conteúdo bloqueado.

## Rota planejada

- Classe: implementação e auditoria visual de PDF educacional.
- Modelo: `gpt-6.1-sol` / `high`.
- Justificativa: integração de matemática, impressão, segurança de HTML e validação visual.
- Fallback permitido: `gpt-6.1-sol` / `xhigh` se testes ou layout revelarem conflito difícil.
- Disponibilidade: catálogo do host Codex desta tarefa; modelo realmente executado não exposto.
