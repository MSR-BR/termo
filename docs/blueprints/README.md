# Blueprints

Blueprints are short task briefs for TERMO work that is larger than a small
fix. They are meant to give Codex enough durable context to implement without
repeating a long prompt every time.

Use a blueprint for work such as:
- adding or heavily restructuring a chapter;
- adding a simulator;
- changing the PDF/login/user-data flow;
- expanding analytics;
- changing shared layout or shared assets;
- planning a release-sized batch of edits.

Do not use a blueprint for tiny copy edits or one-line fixes.

Recommended flow:

1. Copy `TEMPLATE.md` into this directory with a descriptive name.
2. Fill only the sections that matter.
3. Ask Codex to implement from that blueprint.
4. Keep the completed blueprint as a lightweight record, or update it if the
   scope changes.

