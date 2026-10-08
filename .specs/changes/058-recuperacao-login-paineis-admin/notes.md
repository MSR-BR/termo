# Notas e decisões

T49 e T56 preservadas. Não atualizar allow-list remota nem cliente termo-web nesta correção. Conector Supabase disponível não apresenta TERMO; nenhum acesso aos projetos de terceiros. Painel Safari confirmou `SQL Editor | termo | MSR-BR's Org | Supabase`, ref `guifkjjuxsdgwjlhkmnx`.

Login real concluído no Safari com a conta administrativa. Consulta de audiência retornou HTTP 502 no histórico de frequência. SELECT de metadados comprovou ausência de `public.email_recipient_deliveries` (to_regclass NULL). A migração canônica `20260824_create_email_recipient_deliveries.sql` foi aplicada isoladamente em transação, não via db push, preservando a divergência histórica conhecida. API retornou HTTP 200 depois da correção.

Contagens reais (somente agregadas): 6 opt-ins; 1 com documentos vigentes; 0 pausas. Os outros 5 não serão incluídos por suposição nem terão preferências alteradas.

## Publicação

Código e testes: commit `a6cbac5`. Push/deploy ainda pendentes. Autorizados nesta solicitação.

## Reversão

Reverter o commit de interface se necessário. Preservar a tabela de histórico e seus registros; não apagar entregas para reverter uma interface. O estado anterior do banco era tabela inexistente; sua ausência bloqueava envios. Qualquer rollback de schema exige nova revisão, não deve ser automático.
