# 🐰 PR-Rabbit-Lite

> A simplified, open-source agentic PR reviewer. Paste a public GitHub Pull Request URL — get a Senior Staff Engineer–style review (bugs, security risks, efficiency score) in seconds.

https://github.com/user-attachments/assets/7019d981-a4e7-46e6-8c87-0137eac9a549
[**Try the Live Demo →**](https://pr-rabbit-lite.vercel.app)

A minimal reference implementation built on Supabase Edge Functions and a hosted LLM gateway.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Tailwind-0ea5e9)
![Backend](https://img.shields.io/badge/backend-Supabase-3ecf8e)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🔗 **One-field UX** — paste any public GitHub PR URL.
- 🤖 **Agentic review** — Gemini 2.5 Pro acts as a Senior Staff Engineer.
- 📦 **Structured output** — strict JSON via tool calling: `summary`, `critical_bugs`, `security_risks`, `efficiency_score`.
- 🎨 **Minimal dark UI** — Inter font, slate/zinc palette, semantic Tailwind tokens.
- 📋 **Copy-for-Slack** — pre-formatted markdown output for team channels.
- 🛡️ **Rate-limited edge function** — 5 req/min per IP to prevent abuse on public deployments.

---

## 🏗️ Architecture

```
┌──────────────┐      ┌─────────────────────────┐      ┌──────────────────┐
│  React UI    │──▶──▶│ Supabase Edge Function  │──▶──▶│   AI Gateway     │
│  (Vite/TS)   │      │   review-pr (Deno)      │      │     (Gemini)     │
└──────────────┘      └─────────┬───────────────┘      └──────────────────┘
                                │
                                ▼
                       github.com/.../pull/N.diff
```

- **Frontend:** React 18 + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase Edge Function (Deno) — fetches the raw `.diff`, calls the LLM with a forced tool call for structured output
- **AI:** `Powered by Gemini 2.5 Pro` via an OpenAI-compatible gateway (configurable)

---

## 🎯 Why PR-Rabbit-Lite?
Manual code reviews are the #1 bottleneck in shipping software. `PR-Rabbit-Lite` gives you an instant "first pass" on any public PR, catching:
- 🪳 **Logic Bugs** that unit tests miss.
- 🛡️ **Security Risks** before they hit production.
- 📉 **Efficiency Gains** to keep your codebase lean.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/<your-username>/pr-rabbit-lite.git
cd pr-rabbit-lite

# 2. Install deps
npm install   # or: bun install

# 3. Configure env
cp .env.example .env
# Fill in your own Supabase project values

# 4. Run
npm run dev
```

You'll need to:
- Create a [Supabase](https://supabase.com) project.
- Deploy `supabase/functions/review-pr` to that project (`supabase functions deploy review-pr`).
- Set the AI gateway API key as an **edge function secret** (`LOVABLE_API_KEY` env var name — you can rename in `index.ts` if you wire a different provider).

---

## 🔐 Security Notes (read before going public)

This project was reviewed for open-source release. Highlights:

| Check | Status |
|---|---|
| No hardcoded secrets in code | ✅ |
| `.env` in `.gitignore` | ✅ |
| AI API key only in edge function secrets | ✅ |
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

**Enjoying PR-Rabbit-Lite? Give it a ⭐ to help others find it!**

---

## 📜 License

[MIT](./LICENSE) — do whatever you want, just keep the copyright notice.

---

## 🙏 Credits

- UI primitives from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by [CodeRabbit](https://coderabbit.ai)
