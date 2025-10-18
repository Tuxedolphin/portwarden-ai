# Portwarden AI

Portwarden AI is a hackathon-ready SvelteKit prototype that showcases an intelligent duty-officer co-pilot for maritime operations. It fuses layered data correlation, a curated knowledge base, and on-demand GPT-5 playbooks into one cockpit view.

## Features

- Unified incident timeline for email, SMS, and workflow alerts seeded from `/provided` sample data
- Layered evidence panels: ingestion facts, correlated log/SQL proof, and knowledge-base matches
- Guided remediation cards with executable SQL and API actions
- GPT-5 LLM integration for playbook generation and escalation briefs (retrieval-augmented)
- Responsive dark UI built with the supplied Svelte template

## Quickstart

```sh
npm install

# export your Azure OpenAI key before starting the dev server
export AZURE_OPENAI_KEY="your-azure-openai-key"

npm run dev -- --open
```

Environment variables:

- `AZURE_OPENAI_KEY` (required) – API key for the Azure OpenAI resource hosting GPT-5
- `AZURE_OPENAI_ENDPOINT` (optional) – override the base URL, defaults to the hackathon shared endpoint
- `AZURE_OPENAI_DEPLOYMENT` (optional) – override the deployment name, defaults to `gpt-5-mini`
- `AZURE_OPENAI_API_VERSION` (optional) – override the API version, defaults to `2025-01-01-preview`

You can additionally set `AZURE_OPENAI_MODEL` if the deployment name does not match the advertised model ID.

## Project layout highlights

- `src/routes/+page.svelte` – Portwarden AI cockpit UI
- `src/lib/data/incidents.js` – curated RAG dataset built from `/provided` materials
- `src/routes/api/gpt5/+server.js` – server-side GPT-5 integration with prompt orchestration

## GPT-5 API notes

- The server route calls `https://{endpoint}/deployments/{deployment}/chat/completions?api-version=2025-01-01-preview`
- Requests send a system prompt plus the incident context so the model emits operationally focused briefs with `[KB-xxxx]` citations
- Errors are surfaced to the UI via a toast banner so testers can validate API plumbing quickly

## Scripts

- `npm run dev` – start SvelteKit locally
- `npm run build` – produce a production build
- `npm run preview` – preview the production bundle

## Provided data

The `/provided/Application Logs/Database/db.sql` file seeds vessels, containers, EDI messages, and advice history used for correlation demos. The UI references these snapshots to keep the prototype grounded in realistic maritime telemetry.

---

This codebase remains adapter-agnostic; add the deployment adapter of your choice when you are ready to host the prototype.
