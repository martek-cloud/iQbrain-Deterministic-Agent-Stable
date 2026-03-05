import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { parseIntent, generateNLGStream, FREE_MODELS_IDS } from '../lib/openrouter';
import { sessionStore } from '../session/store';
import { getTemporalClient, TEMPORAL_TASK_QUEUE } from '../temporal/client';
import { routeIntent } from '../temporal/intentRouter';
import type { SSEEvent, WorkflowResult } from '../types/intents';

export const chatRouter = Router();

function sseWrite(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function pipeNLGStream(
  nlgResponse: globalThis.Response,
  expressRes: Response,
  onToken?: (token: string) => void
): Promise<string> {
  if (!nlgResponse.body) return '';
  const reader = nlgResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return fullText;
      try {
        const chunk = JSON.parse(raw) as { choices: Array<{ delta: { content?: string } }> };
        const token = chunk.choices?.[0]?.delta?.content ?? '';
        if (token) {
          fullText += token;
          onToken?.(token);
          sseWrite(expressRes, { type: 'token', token });
        }
      } catch {
        // skip malformed
      }
    }
  }
  return fullText;
}

chatRouter.post('/', async (req: Request, res: Response) => {
  const { message, sessionId: incomingSessionId, model } = req.body as {
    message?: string;
    sessionId?: string;
    model?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const selectedModel = (typeof model === 'string' && model) ? model : FREE_MODELS_IDS[0];

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sessionId = sessionStore.getOrCreate(incomingSessionId);

  try {
    // 1. Session event
    sseWrite(res, { type: 'session', sessionId });

    // 2. Add user message to history
    sessionStore.add(sessionId, { id: uuidv4(), role: 'user', content: message.trim(), timestamp: Date.now() });

    // 3. Parse intent
    sseWrite(res, { type: 'status', phase: 'parsing', label: 'Parsing intent…' });
    const history = sessionStore.getWindow(sessionId, 10);
    const intent = await parseIntent(message.trim(), history, selectedModel);
    sseWrite(res, { type: 'intent', intent });

    // 4. If unknown/low confidence — clarification stream
    if (intent.intent === 'unknown' || intent.confidence < 0.5) {
      sseWrite(res, { type: 'status', phase: 'generating', label: 'Generating response…' });
      const nlgResp = await generateNLGStream(null, intent, selectedModel);
      const assistantText = await pipeNLGStream(nlgResp as globalThis.Response, res);
      sessionStore.add(sessionId, { id: uuidv4(), role: 'assistant', content: assistantText, timestamp: Date.now() });
      sseWrite(res, { type: 'done' });
      res.end();
      return;
    }

    // 5. Route via intent router
    const routeResult = routeIntent(intent);

    if (!routeResult.shouldRoute) {
      // Graceful decline — stream clarification, no Temporal call
      sseWrite(res, { type: 'status', phase: 'generating', label: 'Generating response…' });
      const declineIntent = { ...intent, intent: 'unknown' as const };
      const declineNlg = await generateNLGStream(null, declineIntent, selectedModel);
      const declineText = routeResult.declineReason
        ? routeResult.declineReason + ' '
        : '';
      // Stream the decline reason directly, then pipe any LLM follow-up
      if (declineText) {
        sseWrite(res, { type: 'token', token: declineText });
      }
      const assistantExtra = await pipeNLGStream(declineNlg as globalThis.Response, res);
      sessionStore.add(sessionId, {
        id: uuidv4(),
        role: 'assistant',
        content: declineText + assistantExtra,
        timestamp: Date.now(),
      });
      sseWrite(res, { type: 'done' });
      res.end();
      return;
    }

    sseWrite(res, {
      type: 'status',
      phase: 'workflow',
      label: `Running ${intent.intent.replace(/_/g, ' ')}…`,
      workflowName: routeResult.workflowFn,
    });

    // Execute Temporal workflow
    const workflowStartMs = Date.now();
    let workflowResult: WorkflowResult;
    try {
      const client = await getTemporalClient();
      workflowResult = await client.workflow.execute(routeResult.workflowFn!, {
        taskQueue: TEMPORAL_TASK_QUEUE,
        workflowId: `iqbrain-${intent.intent}-${uuidv4()}`,
        args: [intent.parameters],
      }) as WorkflowResult;
    } catch (temporalErr) {
      console.error('[chat] Temporal error:', temporalErr);
      workflowResult = {
        workflowType: intent.intent as WorkflowResult['workflowType'],
        status: 'error',
        steps: [],
        data: null as unknown as never,
        executionId: uuidv4(),
        durationMs: Date.now() - workflowStartMs,
        errorMessage: (temporalErr as Error).message ?? 'Workflow execution failed',
      };
    }
    sseWrite(res, { type: 'workflow', result: workflowResult });

    // 6. NLG stream
    sseWrite(res, { type: 'status', phase: 'generating', label: 'Generating response…' });
    const nlgResp = await generateNLGStream(workflowResult, intent, selectedModel);
    const assistantText = await pipeNLGStream(nlgResp as globalThis.Response, res);

    sessionStore.add(sessionId, { id: uuidv4(), role: 'assistant', content: assistantText, timestamp: Date.now() });

    sseWrite(res, { type: 'done' });
  } catch (err) {
    console.error('[chat] Error:', err);
    sseWrite(res, { type: 'error', message: (err as Error).message ?? 'Internal error' });
  } finally {
    res.end();
  }
});
