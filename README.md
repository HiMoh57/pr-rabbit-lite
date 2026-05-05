# 🐰 PR-Rabbit-Lite

> A simplified, open-source agentic PR reviewer. Paste a public GitHub Pull Request URL — get a Senior Staff Engineer–style review (bugs, security risks, efficiency score) in seconds.

Inspired by [CodeRabbit](https://coderabbit.ai), built as a minimal reference implementation on **Lovable Cloud** + **Lovable AI Gateway**.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Tailwind-0ea5e9)
![Backend](https://img.shields.io/badge/backend-Lovable%20Cloud%20(Supabase)-3ecf8e)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🔗 **One-field UX** — paste any public GitHub PR URL.
- 🤖 **Agentic review** — Gemini 2.5 Pro (via Lovable AI Gateway) acts as a Senior Staff Engineer.
- 📦 **Structured output** — strict JSON via tool calling: `summary`, `critical_bugs`, `security_risks`, `efficiency_score`.
- 🎨 **Minimal dark UI** — Inter font, slate/zinc palette, semantic Tailwind tokens.
- 📋 **Copy-for-Slack** — pre-formatted markdown output for team channels.
- 🛡️ **Rate-limited edge function** — 5 req/min per IP to prevent abuse on public deployments.

---

## 🏗️ Architecture

```
┌──────────────┐      ┌─────────────────────────┐      ┌──────────────────┐
│  React UI    │──▶──▶│ Supabase Edge Function  │──▶──▶│ Lovable AI       │
│  (Vite/TS)   │      │   review-pr (Deno)      │      │ Gateway (Gemini) │
└──────────────┘      └─────────┬───────────────┘      └──────────────────┘
                                │
                                ▼
                       github.com/.../pull/N.diff
```

- **Frontend:** React 18 + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase Edge Function (Deno) — fetches the raw `.diff`, calls the LLM with a forced tool call for structured output
- **AI:** `google/gemini-2.5-pro` via [Lovable AI Gateway](https://docs.lovable.dev) (no separate API key needed in Lovable Cloud)

---

## 🚀 Quick Start

### Option A — Run on Lovable (recommended)

1. Open the project in [Lovable](https://lovable.dev).
2. Lovable Cloud is already enabled — backend, edge function, and `LOVABLE_API_KEY` are auto-provisioned.
3. Click **Publish** and you're live.

### Option B — Run locally

```bash
# 1. Clone
git clone https://github.com/<your-username>/pr-rabbit-lite.git
cd pr-rabbit-lite

# 2. Install deps
npm install   # or: bun install

# 3. Configure env
cp .env.example .env
# Fill in your own Supabase project values (see below)

# 4. Run
npm run dev
```

You'll need to:
- Create a Supabase project (or use Lovable Cloud).
- Deploy `supabase/functions/review-pr` to that project (`supabase functions deploy review-pr`).
- Set the `LOVABLE_API_KEY` **edge function secret** (get one from [Lovable](https://lovable.dev) workspace settings).

---

## 🔐 Security Notes (read before going public)

This project was reviewed for open-source release. Highlights:

| Check | Status |
|---|---|
| No hardcoded secrets in code | ✅ |
| `.env` in `.gitignore` | ✅ |
| `LOVABLE_API_KEY` only in edge function secrets | ✅ |
| Input validation on PR URL (regex match) | ✅ |
| SSRF safe — URL is reconstructed from parsed parts, not user-supplied | ✅ |
| Diff size capped at 120k chars | ✅ |
| Rate limited (5 req/min per IP) | ✅ |
| No database / RLS surface (stateless) | ✅ |

The publishable Supabase anon key in `.env` is **safe to expose** — it's designed for client-side use and is gated by RLS (which we don't need here since there are no tables).

If you fork this and add tables: enable RLS on every table, store roles in a separate `user_roles` table, and never trust client-provided role claims.

---

## 📁 Project Structure

```
.
├── src/
│   ├── pages/Index.tsx          # Single-page UI: input + review dashboard
│   ├── components/ui/*          # shadcn/ui primitives
│   ├── integrations/supabase/   # Auto-generated client (do not edit)
│   └── index.css                # Design tokens (HSL semantic vars)
├── supabase/
│   ├── functions/review-pr/     # Deno edge function — fetches diff + calls LLM
│   └── config.toml
├── .env.example
├── LICENSE                       # MIT
└── README.md
```

---

## 🎨 Design System

All colors are HSL semantic tokens defined in `src/index.css` and mapped in `tailwind.config.ts`. **Never** use raw Tailwind colors (`bg-slate-900`, `text-white`) in components — always use semantic tokens (`bg-background`, `text-foreground`, `text-accent`).

Palette: minimal dark, neutral zinc background, single emerald accent, Inter font.

---

## 🤝 Contributing

PRs welcome! Please:

1. Fork & branch from `main`.
2. Keep changes focused — small, reviewable commits.
3. Run `npm run lint` before pushing.
4. For UI changes, stay in semantic design tokens (no hardcoded colors).
5. For edge function changes, test locally with `supabase functions serve`.

### Ideas for contributions

- [ ] Support GitLab / Bitbucket PR URLs
- [ ] Persist reviews (Supabase table + share link)
- [ ] Multi-model comparison (Gemini vs GPT-5 vs Claude)
- [ ] GitHub App integration for auto-comments
- [ ] Streaming responses
- [ ] i18n

---

## 📜 License

[MIT](./LICENSE) — do whatever you want, just keep the copyright notice.

---

## 🙏 Credits

- Built with [Lovable](https://lovable.dev)
- Inspired by [CodeRabbit](https://coderabbit.ai)
- UI primitives from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
