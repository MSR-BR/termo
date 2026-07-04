# TERMO Codex Context

This file is the durable project map for Codex sessions. Read it before making
non-trivial changes, then inspect the relevant source files directly.

## Project

TERMO is an interactive Thermodynamics book for Physics students. It combines
HTML chapters, conceptual summaries, figures, interactive simulators, AI
exercises, protected book PDF download, and user data features.

Production:
- https://termo-theta.vercel.app

Remote repository:
- https://github.com/MSR-BR/termo.git

Public discovery / SEO entry points:
- Official static landing: https://termo-theta.vercel.app/home.html
- Crawlable content map: https://termo-theta.vercel.app/conteudo.html
- Main sitemap: https://termo-theta.vercel.app/sitemap.xml
- GitHub Pages bridge: https://msr-br.github.io/termo/
- GitHub Pages bridge sitemap: https://msr-br.github.io/termo/sitemap.xml

## Repository Shape

- `index.html`: main application shell and view controller.
- `slides/capitulo-01/`: chapter 1 pages. This chapter still has substantial
  inline CSS.
- `slides/capitulo-02/`: visual and structural reference for chapter layout.
- `slides/capitulo-03/`: chapter 3 pages aligned to chapter 2 patterns.
- `slides/capitulo-04/`: chapter 4 pages aligned to chapter 2 patterns.
- `slides/capitulo-06/`: chapter 6 pages aligned to chapter 2 patterns.
- `simulators/`: local simulator pages. Simulators should open in a new tab.
- `assets/`: shared CSS and JS, including chapter layout, auth, analytics,
  sharing, user data, and AI exercise logic.
- `api/`: backend/API routes used by the app.
- `data/`: structured chapter data.
- `scripts/`: maintenance, validation, SEO, and migration scripts.
- `supabase/`: Supabase-related project files.

Chapter 5 is intentionally disabled in the menu.

## Visual And Content Conventions

- Treat chapter 2 as the source of truth for chapter layout, structure, and
  typography.
- Reuse existing chapter 2 templates and component patterns when possible.
- Do not invent a new layout when a local pattern already exists.
- Figure captions should use the existing visual pattern and live in the
  appropriate box.
- Avoid fragmenting one subtopic into many small cards. Group related material
  when the conceptual unit is single.
- Numerical examples usually work best as one statement card and one solution
  card, when the page structure allows it.
- Side-by-side desktop cards should align at the top.
- Keep simulator callouts visible in the corresponding chapter section, with a
  label such as `Simulador Sxx`.

## Simulator Conventions

Simulator catalog cards should include:
- simulator code, such as `S08`;
- title;
- short description;
- `Abrir simulador`;
- `Abrir secao x.xx`.

Simulator pages should keep the shared pattern:
- standardized header;
- usage instructions;
- credits;
- version information;
- opened from the app in a new tab.

Known simulator mapping:
- `S01`: chapter 1, section 1.3, `slides/capitulo-01/page_4.html`
- `S02`: chapter 1, section 1.10, `slides/capitulo-01/page_11.html`
- `S03`: chapter 2, section 2.8, `slides/capitulo-02/page_8.html`
- `S04`: chapter 3, section 3.8, `slides/capitulo-03/page_18.html`
- `S05`: chapter 4, section 4.5, `slides/capitulo-04/page_9.html`
- `S06`: chapter 4, section 4.6, `slides/capitulo-04/page_11.html`
- `S07`: isothermal simulator, verify catalog mapping if needed
- `S08`: chapter 6, section 6.2, `slides/capitulo-06/page_2.html`
- `S09`: chapter 6, section 6.10, `slides/capitulo-06/page_10.html`

## Services And Sensitive Flows

- Deploy is on Vercel.
- Auth, Storage, and part of the data layer use Supabase.
- AI exercises use Gemini through the existing backend/API integration.
- The complete book PDF download is protected by login and shows a disclaimer
  before download.
- Vercel Analytics is enabled. More detailed event tracking may be expanded.

Do not break:
- login and redirect flow;
- PDF disclaimer and protected download flow;
- Supabase integration;
- Gemini exercise API integration;
- simulator opening behavior;
- SEO artifacts and canonical links.

## SEO / Discovery State As Of 2026-07-04

Google Search Console repeatedly failed on sitemap fetch / request indexing even
when public URLs were live. The practical strategy moved away from relying on
manual request indexing and toward public discovery paths.

Completed:
- simplified `robots.txt` and sitemap files;
- added a static academic landing page at `home.html`;
- added a crawlable content map at `conteudo.html`;
- added a GitHub Pages bridge under `docs/index.html`;
- configured GitHub Pages to publish `main` + `/docs`;
- added a short `README.md` with public links.

Important commits:
- `5560d5d` Simplify sitemap for Search Console
- `5f464f2` Add academic landing page for TERMO
- `aea2dbf` Add GitHub Pages bridge for TERMO

The GitHub Pages bridge intentionally declares:
- canonical: `https://termo-theta.vercel.app/home.html`
- public URL: `https://msr-br.github.io/termo/`

Next marketing step requested by the user: plan Google Ads for TERMO after
waiting roughly two weeks to observe Search Console / indexing effects.

## Working Rules For Codex

Before editing:
- run `git status --short --branch`;
- inspect the specific files involved;
- compare chapter changes with chapter 2 patterns;
- preserve existing naming, layout, and UI vocabulary.

After editing:
- run `npm run check`;
- run targeted syntax checks when touching JS, such as `node --check path`;
- review `git diff`;
- for visual work, start `npm run dev` and inspect the affected page when useful.

Commit/deploy only when the user asks for it.
