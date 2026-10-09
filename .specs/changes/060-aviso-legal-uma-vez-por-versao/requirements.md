# Requisitos

## Funcionais

- [x] Exibir o aviso automático no máximo uma vez por conta e par de versões dos documentos neste navegador.
- [x] Não abrir automaticamente se a consulta de preferências falhar ou a sessão mudar durante a consulta.
- [x] Manter a abertura manual pela área pessoal e o aceite explícito no servidor.
- [x] Mostrar texto coerente com uma conta já conectada.

## Segurança, privacidade e conteúdo

- [x] Não armazenar aceite nem token em `localStorage`.
- [x] Não alterar conteúdo editorial, acesso público, OAuth ou permissões.

## Rota planejada

- Classe: correção pontual de interface/autenticação.
- Modelo: `gpt-6.1-sol`; reasoning: `high`.
- Fallback: `gpt-6.1-sol / xhigh` apenas se a validação revelar comportamento ambíguo.
- Disponibilidade: modelo indicado no ambiente desta tarefa; execução real não exposta.
