import { useState } from "react";
import { GitPullRequest, Loader2, Bug, Shield, Zap, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BugItem = { title: string; detail: string; file?: string };
type Risk = { title: string; detail: string; severity: "low" | "medium" | "high" | "critical" };
type Review = {
  summary: string;
  critical_bugs: BugItem[];
  security_risks: Risk[];
  efficiency_score: number;
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [pr, setPr] = useState<{ owner: string; repo: string; number: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setReview(null);
    try {
      const { data, error } = await supabase.functions.invoke("review-pr", {
        body: { prUrl: url.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReview((data as any).review);
      setPr((data as any).pr);
      toast.success("Review complete");
    } catch (err: any) {
      toast.error(err?.message || "Failed to analyze PR");
    } finally {
      setLoading(false);
    }
  };

  const copyForSlack = async () => {
    if (!review || !pr) return;
    const lines = [
      `*PR-Rabbit-Lite Review* — <${`https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`}|${pr.owner}/${pr.repo}#${pr.number}>`,
      ``,
      `📝 *Summary:* ${review.summary}`,
      `⚡ *Efficiency:* ${review.efficiency_score}/100`,
      ``,
      `🐞 *Critical Bugs (${review.critical_bugs.length})*`,
      ...(review.critical_bugs.length
        ? review.critical_bugs.map((b) => `• *${b.title}* — ${b.detail}`)
        : ["• None detected"]),
      ``,
      `🛡 *Security Risks (${review.security_risks.length})*`,
      ...(review.security_risks.length
        ? review.security_risks.map((r) => `• [${r.severity.toUpperCase()}] *${r.title}* — ${r.detail}`)
        : ["• None detected"]),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Copied for Slack");
    setTimeout(() => setCopied(false), 1800);
  };

  const scoreColor =
    review && review.efficiency_score >= 80
      ? "text-primary"
      : review && review.efficiency_score >= 50
      ? "text-warning"
      : "text-destructive";

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans antialiased"
      style={{ backgroundImage: "var(--gradient-hero)", fontFamily: "Inter, sans-serif" }}
    >
      <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center border border-border">
              <GitPullRequest className="h-3.5 w-3.5 text-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-sm">PR-Rabbit-Lite</span>
            <Badge variant="secondary" className="ml-1 text-[10px] font-mono text-muted-foreground border-border">
              v0.1
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Senior Staff Engineer, on demand
          </span>
        </div>
      </header>

      <main className="container py-16 max-w-3xl">
        <section className="text-center mb-10">
          <Badge variant="outline" className="mb-5 gap-1.5 border-border text-muted-foreground font-normal">
            <Sparkles className="h-3 w-3" /> Agentic PR Reviews
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            Ship faster. Catch bugs sooner.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Paste any public GitHub PR URL. Get a Senior Staff Engineer's review in seconds — bugs,
            security risks, and an efficiency score.
          </p>
        </section>

        <form onSubmit={analyze} className="flex gap-2 mb-8">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            className="h-11 font-mono text-sm bg-card border-border placeholder:text-muted-foreground/60"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-11 px-5 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing
              </>
            ) : (
              "Review PR"
            )}
          </Button>
        </form>

        {loading && !review && (
          <Card className="p-8 bg-card/60 border-border animate-pulse">
            <div className="space-y-3">
              <div className="h-3 w-1/3 bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </Card>
        )}

        {review && pr && (
          <Card
            className="bg-card border-border overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground font-mono mb-1">
                  {pr.owner}/{pr.repo} · #{pr.number}
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Review Dashboard</h2>
              </div>
              <Button variant="outline" size="sm" onClick={copyForSlack} className="gap-2">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy for Slack"}
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</div>
                <p className="text-sm leading-relaxed">{review.summary}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <StatCard
                  icon={<Bug className="h-4 w-4" />}
                  label="Critical Bugs"
                  value={review.critical_bugs.length}
                  tone={review.critical_bugs.length ? "destructive" : "success"}
                />
                <StatCard
                  icon={<Shield className="h-4 w-4" />}
                  label="Security Risks"
                  value={review.security_risks.length}
                  tone={review.security_risks.length ? "warning" : "success"}
                />
                <StatCard
                  icon={<Zap className="h-4 w-4" />}
                  label="Efficiency"
                  value={`${review.efficiency_score}`}
                  suffix="/100"
                  tone={
                    review.efficiency_score >= 80
                      ? "success"
                      : review.efficiency_score >= 50
                      ? "warning"
                      : "destructive"
                  }
                />
              </div>

              <Section
                icon={<Bug className="h-4 w-4 text-muted-foreground" />}
                title="Critical Bugs"
                empty={!review.critical_bugs.length}
                emptyText="No critical logical flaws detected."
              >
                {review.critical_bugs.map((b, i) => (
                  <Item key={i} title={b.title} detail={b.detail} meta={b.file} />
                ))}
              </Section>

              <Section
                icon={<Shield className="h-4 w-4 text-muted-foreground" />}
                title="Security Risks"
                empty={!review.security_risks.length}
                emptyText="No exposed keys or vulnerable patterns found."
              >
                {review.security_risks.map((r, i) => (
                  <Item
                    key={i}
                    title={r.title}
                    detail={r.detail}
                    meta={r.severity.toUpperCase()}
                    metaTone={
                      r.severity === "critical" || r.severity === "high"
                        ? "destructive"
                        : r.severity === "medium"
                        ? "warning"
                        : "muted"
                    }
                  />
                ))}
              </Section>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  tone: "success" | "warning" | "destructive";
}) => {
  const colorMap = {
    success: "text-accent border-accent/30 bg-accent/10",
    warning: "text-warning border-warning/30 bg-warning/10",
    destructive: "text-destructive border-destructive/30 bg-destructive/10",
  } as const;
  return (
    <div className={`rounded-lg border p-4 ${colorMap[tone]}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80 mb-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {value}
        {suffix && <span className="text-sm opacity-60">{suffix}</span>}
      </div>
    </div>
  );
};

const Section = ({
  icon,
  title,
  empty,
  emptyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
    {empty ? (
      <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border px-3 py-3">
        ✓ {emptyText}
      </div>
    ) : (
      <div className="space-y-2">{children}</div>
    )}
  </div>
);

const Item = ({
  title,
  detail,
  meta,
  metaTone = "muted",
}: {
  title: string;
  detail: string;
  meta?: string;
  metaTone?: "muted" | "warning" | "destructive";
}) => {
  const toneCls = {
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  }[metaTone];
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="text-sm font-medium">{title}</div>
        {meta && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${toneCls}`}>{meta}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
    </div>
  );
};

export default Index;
