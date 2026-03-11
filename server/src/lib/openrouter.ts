import type { ParsedIntent, WorkflowResult, ChatMessage } from '../types/intents';
import { getOpenRouterKey } from '../config/store';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Paid models first (fast + cheap), then free as fallback
export const FREE_MODELS_IDS = [
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemma-3-27b-it',
  'mistralai/mistral-small-3.1-24b-instruct',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

// ============================================================
// INTENT_SYSTEM_PROMPT — strict JSON-only, all 6 active types
// ============================================================
export const INTENT_SYSTEM_PROMPT = `You are an intent classification engine for IQBrain, a manufacturing AI assistant.

Your ONLY job is to output a single valid JSON object. No explanation, no markdown, no preamble.

Valid intents and their parameters:

1. change_impact_analysis
   params: sourcePart (required), targetPart? (optional), analysisType? ("full_impact" | "financial_only" | "where_used_only")
   triggers: "impact of replacing X with Y", "what changes if I swap X", "impact analysis for X"

2. where_used_analysis
   params: partNumber (required), includeProductionOrders? (boolean), maxDepth? (integer)
   triggers: "where is X used", "find all assemblies using X", "where-used for part X"

3. closure_status_query
   params: changeId? (e.g. "ECR-2221"), showAll? (boolean), filterByBottleneck? ("PLM" | "ERP" | "MES")
   triggers: "closure status for ECR-X", "show open changes", "what is not closed"

4. cycle_time_single
   params: changeId (required)
   triggers: "cycle time for ECR-X", "how long did ECR-X take", "ECR-X duration"

5. bom_comparison_ebom_mbom
   params: assemblyId (required), ebomRevision? (string), mbomRevision? (string)
   triggers: "compare EBOM and MBOM for X", "MBOM reconciliation", "does MBOM match EBOM"

6. unknown
   params: rawQuery (string)
   use when: query does not match any intent above, or is a general question

Output format (strict JSON):
{
  "intent": "<one of the 6 intents above>",
  "confidence": <0.0–1.0>,
  "parameters": { <intent-specific params> },
  "rawQuery": "<original user query>"
}

Rules:
- Never output anything except valid JSON
- confidence < 0.5 means you are unsure — use "unknown" instead
- If intent is "unknown", confidence should reflect how unclear the query is
- Part numbers are case-insensitive — normalize to uppercase (R245, not r245)
- changeId should match the user's exact string (ECR-2221, ECO-1145, etc.)`;

// ============================================================
// NLG_SYSTEM_PROMPT — factual, manufacturing-focused
// ============================================================
export const NLG_SYSTEM_PROMPT = `You are IQBrain, a manufacturing AI assistant. You generate concise, factual responses based on workflow data.

Rules:
1. NEVER invent part numbers, order IDs, financial figures, or dates not present in the data
2. Use manufacturing terminology: ECR/ECO, EBOM/MBOM, WIP, BOM, lifecycle, change closure
3. Lead with the most important finding — critical bottleneck, largest exposure, longest stage
4. Be specific: cite actual values from the data (order IDs, dollar amounts, part numbers, percentages)
5. Keep responses under 4 sentences unless the data warrants more detail
6. If the workflow returned an error, acknowledge it clearly and suggest what to try instead

Tone: direct, analytical, no filler phrases. You speak to engineers and change managers.`;

// ============================================================
// parseIntent
// ============================================================
export async function parseIntent(
  message: string,
  history: ChatMessage[],
  model: string
): Promise<ParsedIntent> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    console.warn('[openrouter] OPENROUTER_API_KEY not set — returning unknown intent');
    return { intent: 'unknown', confidence: 0, parameters: { rawQuery: message }, rawQuery: message };
  }

  const messages = [
    { role: 'system' as const, content: INTENT_SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const result = await fetchWithFallback(
    { model, messages, temperature: 0.1, max_tokens: 512 },
    model
  );

  const text = result.choices?.[0]?.message?.content ?? '';
  return safeParseIntent(text, message);
}

function safeParseIntent(raw: string, originalQuery: string): ParsedIntent {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<ParsedIntent>;
    if (typeof parsed.intent !== 'string' || typeof parsed.confidence !== 'number') {
      throw new Error('invalid shape');
    }
    return {
      intent: parsed.intent as ParsedIntent['intent'],
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      parameters: parsed.parameters ?? { rawQuery: originalQuery },
      rawQuery: originalQuery,
    };
  } catch {
    console.warn('[openrouter] Failed to parse intent JSON:', JSON.stringify(raw.slice(0, 400)));
    return { intent: 'unknown', confidence: 0.1, parameters: { rawQuery: originalQuery }, rawQuery: originalQuery };
  }
}

// ============================================================
// generateNLGStream
// ============================================================
export async function generateNLGStream(
  workflowResult: WorkflowResult | null,
  intent: ParsedIntent,
  model: string
): Promise<Response> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    // Return a mock stream with a static response when no API key
    const encoder = new TextEncoder();
    const body = `data: ${JSON.stringify({ choices: [{ delta: { content: 'No OpenRouter API key configured. Set OPENROUTER_API_KEY in .env.' } }] })}\n\ndata: [DONE]\n\n`;
    return new Response(encoder.encode(body), { headers: { 'Content-Type': 'text/event-stream' } });
  }

  const dataContext = workflowResult
    ? `Workflow type: ${workflowResult.workflowType}\nStatus: ${workflowResult.status}\nData: ${JSON.stringify(workflowResult.data, null, 2)}`
    : `Intent: ${intent.intent}\nParameters: ${JSON.stringify(intent.parameters)}`;

  const messages = [
    { role: 'system' as const, content: NLG_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `User asked: "${intent.rawQuery}"\n\nWorkflow result:\n${dataContext}\n\nProvide a concise, factual analysis response.`,
    },
  ];

  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://iqbrain.ai',
      'X-Title': 'IQBrain',
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, stream: true }),
  });
}

// ============================================================
// fetchWithFallback — retries with next model on 429/503
// ============================================================
async function fetchWithFallback(
  body: Record<string, unknown>,
  primaryModel: string
): Promise<{ choices: Array<{ message: { content: string } }> }> {
  const models = [primaryModel, ...FREE_MODELS_IDS.filter((m) => m !== primaryModel)];

  for (const model of models) {
    let response: globalThis.Response;
    try {
      response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://iqbrain.ai',
          'X-Title': 'IQBrain',
        },
        body: JSON.stringify({ ...body, model }),
      });
    } catch (err) {
      console.warn(`[openrouter] Model ${model} network error (${(err as Error).message}), trying next…`);
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (response.status === 429 || response.status === 503 || response.status === 404) {
      console.warn(`[openrouter] Model ${model} returned ${response.status}, trying next…`);
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '(unreadable)');
      console.warn(`[openrouter] Model ${model} returned ${response.status}: ${errText.slice(0, 200)}, trying next…`);
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    const json = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = json.choices?.[0]?.message?.content ?? '';
    if (!content.trim()) {
      console.warn(`[openrouter] Model ${model} returned empty content, trying next…`);
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    console.log(`[openrouter] Model ${model} succeeded`);
    return json;
  }

  throw new Error('[openrouter] All models exhausted');
}
