# TERMO Codex Context

This file is the durable project map for Codex sessions. Read it before making
non-trivial changes, then inspect the relevant source files directly.

## Project

TERMO is an interactive Thermodynamics book for Physics students. It combines
HTML chapters, conceptual summaries, figures, interactive simulators, AI
exercises, chapter quizzes, study points, daily challenge, protected book PDF
download, and user data features.

Production:
- https://termo-theta.vercel.app

Remote repository:
- https://github.com/MSR-BR/termo.git

Public discovery / SEO entry points:
- Official static landing: https://termo-theta.vercel.app/home.html
- Points and chapter quizzes: https://termo-theta.vercel.app/index.html?view=journey
- Daily challenge: https://termo-theta.vercel.app/index.html?view=daily-challenge
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
- The technical AI exercise reference index lives at
  `docs/exercicios-ia-indice-referencias.html`. It is shown in the app Extras
  menu only for the admin email `marioreis@id.uff.br`. Regenerate it whenever
  the app HTML content or the book PDF changes.
- AI exercise error reports reuse `exercise_validation_reports`. Student reports
  include a simple problem type; the professor can approve reports as memory,
  reject them, or set `review_status = disabled` to keep the history while
  removing that correction from future AI context. Only approved confirmed
  errors with `avoid_propagation = true` are loaded into generation memory.
- AI chapter quizzes use the same book corpus and topic index strategy as section
  exercises. The quiz prompt receives chapter-level PDF excerpts, app topics, and
  thematic metadata; generated quiz math is checked before the quiz token is
  accepted. Use `npm run smoke:ai-quiz-context` after changing quiz generation,
  book corpus, topic index, or chapter data.
- Gamification is intentionally lightweight for the first public version:
  `Pontos e simulados` lives under `Extras`, the header shows the user's points,
  chapter quizzes unlock in order, and `Desafio do dia` is a separate `Extras`
  item based only on already-studied topics or chapters with quiz attempts.
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

## SEO / Discovery State As Of 2026-07-18

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
- updated landing, content map, GitHub Pages bridge, and runtime SEO copy to
  mention points, chapter quizzes, daily challenge, and simulators;
- kept personal progress routes such as `view=journey` and
  `view=daily-challenge` as `noindex` runtime pages.

Important commits:
- `5560d5d` Simplify sitemap for Search Console
- `5f464f2` Add academic landing page for TERMO
- `aea2dbf` Add GitHub Pages bridge for TERMO

The GitHub Pages bridge intentionally declares:
- canonical: `https://termo-theta.vercel.app/home.html`
- public URL: `https://msr-br.github.io/termo/`

Marketing/ads note: public ads should continue using `home.html` as the main
landing page. Personal routes are useful product destinations after login, but
should not be treated as SEO landing pages.

## Working Rules For Codex

Before editing:
- run `git status --short --branch`;
- inspect the specific files involved;
- compare chapter changes with chapter 2 patterns;
- preserve existing naming, layout, and UI vocabulary.

After editing:
- run `npm run check`;
- run targeted syntax checks when touching JS, such as `node --check path`;
- when changing the book PDF, chapter HTML, or AI exercise references, run
  `npm run extract:book-sections`, `npm run build:book-topic-index`,
  `npm run docs:ai-exercise-index`, `npm run validate:book-corpus`, and
  `npm run validate:book-topic-index`;
- when changing the AI exercise context package, run `npm run smoke:ai-context`
  to inspect the prompt context for representative sections;
- when changing AI chapter quizzes, run `npm run smoke:ai-quiz-context`;
- when changing generated exercise math handling, run
  `npm run smoke:math-contract`;
- review `git diff`;
- for visual work, start `npm run dev` and inspect the affected page when useful.

Commit/deploy only when the user asks for it.
