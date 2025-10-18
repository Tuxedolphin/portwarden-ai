# Portwarden AI

Portwarden AI is a hackathon-ready SvelteKit prototype that showcases an intelligent duty-officer co-pilot for maritime operations. It fuses layered data correlation, a curated knowledge base, and on-demand Gemini playbooks into one cockpit view.

## Features

- Unified incident timeline for email, SMS, and workflow alerts seeded from `/provided` sample data
- Layered evidence panels: ingestion facts, correlated log/SQL proof, and knowledge-base matches
- Guided remediation cards with executable SQL and API actions
- Gemini LLM integration for playbook generation and escalation briefs (retrieval-augmented)
- Responsive dark UI built with the supplied Svelte template

## Quickstart

```sh
npm install

# export your Gemini key before starting the dev server
export GEMINI_API_KEY="your-google-ai-studio-key"

npm run dev -- --open
```

Environment variables:

- `GEMINI_API_KEY` (required) – key from Google AI Studio (Gemini 1.5 models)
- `GEMINI_MODEL` (optional) – override model name, defaults to `gemini-2.5-flash`

## Project layout highlights

- `src/routes/+page.svelte` – Portwarden AI cockpit UI
- `src/lib/data/incidents.js` – curated RAG dataset built from `/provided` materials
- `src/routes/api/gemini/+server.js` – server-side Gemini integration with prompt orchestration

## Gemini API notes

- The server route uses `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Responses are constrained for operational tone and cite `[KB-xxxx]` references from the bundled knowledge snippets
- Errors are surfaced to the UI via a toast banner so testers can validate API plumbing quickly

## Scripts

- `npm run dev` – start SvelteKit locally
- `npm run build` – produce a production build
- `npm run preview` – preview the production bundle

## Provided data

The `/provided/Application Logs/Database/db.sql` file seeds vessels, containers, EDI messages, and advice history used for correlation demos. The UI references these snapshots to keep the prototype grounded in realistic maritime telemetry.

---

This codebase remains adapter-agnostic; add the deployment adapter of your choice when you are ready to host the prototype.
