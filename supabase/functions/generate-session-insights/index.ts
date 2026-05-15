import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.24.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOMAIN_LABELS: Record<string, string> = {
  memory:    "Short-term Memory",
  pattern:   "Sequential Memory",
  sequence:  "Working Memory",
  word:      "Language",
  spatial:   "Spatial Reasoning",
  attention: "Sustained Attention",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "headway_rehab" } }
    );

    // Fetch session with exercises and client identifier
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*, session_exercises(*), clients(identifier)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip if already generated
    if (session.ai_summary) {
      return new Response(
        JSON.stringify({ success: true, summary: session.ai_summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch recent sessions for trend context
    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("started_at, difficulty, session_exercises(exercise_type, final_score)")
      .eq("client_id", session.client_id)
      .neq("id", sessionId)
      .not("completed_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(5);

    // Build exercise summary
    const exercises = [...(session.session_exercises ?? [])].sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.sequence_order as number) - (b.sequence_order as number)
    );
    const totalScore = exercises.reduce(
      (sum: number, ex: Record<string, unknown>) => sum + (ex.final_score as number), 0
    );

    const exerciseSummary = exercises.map((ex: Record<string, unknown>) => {
      const dur = ex.duration_seconds as number | null;
      const durStr = dur ? `, ${Math.floor(dur / 60)}m ${dur % 60}s` : "";
      return `- ${DOMAIN_LABELS[ex.exercise_type as string] ?? ex.exercise_type}: ${ex.final_score} pts${durStr}`;
    }).join("\n");

    // Build history context
    let historyContext = "This is the client's first completed session.";
    if (recentSessions && recentSessions.length > 0) {
      const lines = recentSessions.map((s: Record<string, unknown>) => {
        const prevExs = (s.session_exercises as Record<string, unknown>[]) ?? [];
        const prevTotal = prevExs.reduce(
          (sum: number, ex: Record<string, unknown>) => sum + (ex.final_score as number), 0
        );
        const date = new Date(s.started_at as string).toLocaleDateString("en-GB");
        return `- ${date}: total ${prevTotal} pts (${s.difficulty})`;
      });
      historyContext = `Previous sessions (most recent first):\n${lines.join("\n")}`;
    }

    const clientName = (session.clients as Record<string, unknown> | null)?.identifier ?? "the client";
    const sessionDate = new Date(session.started_at).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long",
    });

    const prompt = `You are a clinical assistant supporting occupational therapists at Headway UK, a brain injury rehabilitation charity. Analyse this cognitive rehabilitation session.

Client: ${clientName}
Date: ${sessionDate}
Difficulty: ${session.difficulty}
Total score: ${totalScore} pts across ${exercises.length} exercise${exercises.length !== 1 ? "s" : ""}

Exercise breakdown:
${exerciseSummary}

${historyContext}
${session.notes ? `\nTherapist notes: "${session.notes}"` : ""}

Respond with valid JSON only (no markdown, no code block wrappers):
{
  "summary": "2-3 sentences for the therapist. Highlight notable performances and any patterns worth monitoring. Warm, professional tone.",
  "domain_analysis": "1-2 sentences about cognitive domain strengths and areas for development.",
  "recommendation": "One specific, practical suggestion for the next session."
}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed: { summary?: string; domain_analysis?: string; recommendation?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { summary: raw.slice(0, 500) };
    }

    const summary = parsed.summary ?? "";
    const now = new Date().toISOString();

    // Update session ai_summary
    await supabase
      .from("sessions")
      .update({ ai_summary: summary })
      .eq("id", sessionId);

    // Insert ai_insights records
    const insights: Record<string, unknown>[] = [];

    if (summary) {
      insights.push({
        client_id: session.client_id,
        session_id: sessionId,
        type: "session_summary",
        exercise_type: null,
        content: summary,
        generated_at: now,
      });
    }
    if (parsed.domain_analysis) {
      insights.push({
        client_id: session.client_id,
        session_id: sessionId,
        type: "domain_analysis",
        exercise_type: null,
        content: parsed.domain_analysis,
        generated_at: now,
      });
    }
    if (parsed.recommendation) {
      insights.push({
        client_id: session.client_id,
        session_id: sessionId,
        type: "recommendation",
        exercise_type: null,
        content: parsed.recommendation,
        generated_at: now,
      });
    }

    if (insights.length > 0) {
      await supabase.from("ai_insights").insert(insights);
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("generate-session-insights error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
