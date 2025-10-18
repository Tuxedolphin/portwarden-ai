# Portwarden AI

Portwarden AI is a hackathon-ready SvelteKit prototype that showcases an intelligent duty-officer co-pilot for maritime operations. It fuses layered data correlation, a curated knowledge base, and on-demand ChatGPT 5 Mini playbooks into one cockpit view.

## Features

- Unified incident timeline for email, SMS, and workflow alerts seeded from `/provided` sample data
- Layered evidence panels: ingestion facts, correlated log/SQL proof, and knowledge-base matches
- Guided remediation cards with executable SQL and API actions
- ChatGPT 5 Mini integration for playbook generation and escalation briefs (retrieval-augmented)
- Responsive dark UI built with the supplied Svelte template

## Quickstart

```sh
npm install

# export your ChatGPT 5 Mini key before starting the dev server
export GPT_API_KEY="your-azure-openai-key"

npm run dev -- --open
```

Environment variables:

- `GPT_API_KEY` (required) – Azure OpenAI key for the ChatGPT 5 Mini deployment
- `GPT_API_ENDPOINT` (optional) – override the Azure OpenAI endpoint; defaults to the hackathon endpoint
- `GPT_DEPLOYMENT` (optional) – override the deployment name; defaults to `gpt-5-mini`
- `GPT_API_VERSION` (optional) – override the API version; defaults to `2025-01-01-preview`

## Project layout highlights

- `src/routes/+page.svelte` – Portwarden AI cockpit UI
- `src/lib/data/incidents.js` – curated RAG dataset built from `/provided` materials
- `src/routes/api/chatgpt/+server.js` – server-side ChatGPT 5 Mini integration with prompt orchestration

## ChatGPT 5 Mini API notes

- The server route targets the Azure OpenAI Chat Completions API at `https://{endpoint}/deployments/{deployment}/chat/completions`
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
