# Requisitos

## Funcionais

- [x] Conferir commits, migrations, deploys e evidências de T50–T54.
- [x] Corrigir estados desatualizados no roadmap e nas Changes afetadas.
- [x] Validar em produção a jornada autenticada da T52.
- [x] Verificar loading, falha de rede, clique duplo e resposta idempotente sem
  premiar repetição.
- [x] Verificar teclado, foco e semântica no fluxo autenticado e registrar a
  limitação do teste automatizado de texto ampliado.
- [x] Registrar limitações de ferramentas assistivas reais sem inventar
  evidência.

## Segurança, privacidade e conteúdo

- [x] Preservar autenticação, autorização server-side e RLS aplicáveis.
- [x] Não expor token, e-mail, identificador de usuário ou resposta privada.
- [x] Não modificar pontos, ledger ou perfil fora de uma interação normal e
  explicitamente observada no teste.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.

## Rota planejada

- Classe da tarefa: validação de release e reconciliação documental.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: o fechamento cruza UI autenticada, idempotência, estado remoto
  e governança de múltiplas Changes.
- Fallback permitido: `gpt-5.6-sol / xhigh` diante de divergência de dados ou
  falha não explicada de autenticação/persistência.
- Gatilhos de escalonamento: discrepância entre ledger e projeção, alteração
  inesperada de pontos, exposição de dados ou falha de autorização.
- Fonte da disponibilidade: roadmap canônico e Pó Mágico registrado no TERMO;
  execução real somente será afirmada se o runtime a expuser.
