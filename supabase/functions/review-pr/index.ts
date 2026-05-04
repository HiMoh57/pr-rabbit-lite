import { corsHeaders } from "@supabase/supabase-js/cors";

const SYSTEM_PROMPT = `You are a Senior Staff Engineer performing a code review on a GitHub Pull Request diff.
Be precise, concise, and actionable. Only flag genuine issues. If none exist for a category, return an empty array.`;

function parsePrUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: m[3] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prUrl } = await req.json();
    if (!prUrl || typeof prUrl !== "string") {
      return new Response(JSON.stringify({ error: "prUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parsePrUrl(prUrl);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid GitHub PR URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diffUrl = `https://github.com/${parsed.owner}/${parsed.repo}/pull/${parsed.number}.diff`;
    const diffResp = await fetch(diffUrl, {
      headers: { Accept: "application/vnd.github.v3.diff", "User-Agent": "PR-Rabbit-Lite" },
      redirect: "follow",
    });
    if (!diffResp.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch PR diff (${diffResp.status}). Is the PR public?` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    let diff = await diffResp.text();
    // Cap to ~120k chars to stay under model limits
    const MAX = 120_000;
    if (diff.length > MAX) diff = diff.slice(0, MAX) + "\n\n[diff truncated]";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze the following PR diff and return your review via the submit_review tool.\n\nPR: ${prUrl}\n\nDIFF:\n\`\`\`diff\n${diff}\n\`\`\``,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_review",
              description: "Submit the structured PR review.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-sentence high-level overview." },
                  critical_bugs: {
                    type: "array",
                    description: "Top 2 logical flaws (max 2). Empty if none.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        detail: { type: "string" },
                        file: { type: "string" },
                      },
                      required: ["title", "detail"],
                      additionalProperties: false,
                    },
                  },
                  security_risks: {
                    type: "array",
                    description: "Exposed keys or vulnerable patterns. Empty if none.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        detail: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      },
                      required: ["title", "detail", "severity"],
                      additionalProperties: false,
                    },
                  },
                  efficiency_score: { type: "number", description: "Rating 1-100." },
                },
                required: ["summary", "critical_bugs", "security_risks", "efficiency_score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_review" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error("No tool call", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "No structured review returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const review = JSON.parse(args);

    return new Response(
      JSON.stringify({ review, pr: { ...parsed, url: prUrl } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("review-pr error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
