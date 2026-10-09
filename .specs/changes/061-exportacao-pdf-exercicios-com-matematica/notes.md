# Notas e decisões

O PDF anexado de 4.2 foi produzido pelo jsPDF como texto simples: título duplicado e equações LaTeX literais. O TERMO já usa MathJax SVG na visualização; a exportação reutiliza esse padrão em uma página A4 de impressão. O navegador gera o PDF, sem compilador TeX nem processamento em servidor.

O proprietário autorizou “cpd” na solicitação de 09/10/2026. Os três scripts de injeção já modificados e o documento `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` não pertencem a esta Change e não devem ser incluídos no commit.

## Status de publicação

- Commit: `8d8f0ad` (`fix(pdf): render exercise equations and add author header`).
- Push: `origin/main` concluído em 09/10/2026.
- Deploy: Vercel produção `READY`, deployment `dpl_H5NuAbup3dPSGt8zZ8oduGruhkvH`.
- Domínio canônico: novo script HTTP 200; `index.html` público carrega o exportador.
- Erros de runtime Vercel: nenhum no intervalo de 15 minutos consultado.
- Limite: a exportação autenticada de uma conta real não foi executada em produção; o mesmo fluxo foi testado no Chrome local com janela e equações reais.
