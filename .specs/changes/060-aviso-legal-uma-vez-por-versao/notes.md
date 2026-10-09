# Notas e decisões

O modal era aberto automaticamente em cada carregamento de página quando `/api/legal-preferences` não retornava aceite das versões atuais. Uma resposta não disponível também era tratada como pendência. A tela podia simultaneamente mostrar “Entre com Google” e uma conta ativa.

Decisão: manter um aviso por conta e versão dos documentos no armazenamento local, sem registrar aceite local. A abertura manual permanece disponível. Nenhuma alteração no endpoint de preferências ou no consentimento em si.

O usuário autorizou correção e CPD em 08/10/2026. Edições preexistentes em scripts de injeção e nota de Supabase não pertencem a esta Change.
