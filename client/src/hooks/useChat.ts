import { useState, useCallback, useRef } from 'react';
import type {
  ChatMessage,
  SSEEvent,
  ParsedIntent,
  WorkflowResult,
} from '@iqbrain/shared-types';
import { mockSSE } from '../mocks/mockSSE';

export type StatusPhase = 'connecting' | 'parsing' | 'routing' | 'workflow' | 'generating' | 'done' | null;

export interface UseChatOptions {
  useMock?: boolean;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  currentStatus: { phase: StatusPhase; label: string } | null;
  sendMessage: (content: string, model?: string) => Promise<void>;
  clearMessages: () => void;
}

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

export function useChat({ useMock = true }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<{ phase: StatusPhase; label: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const appendToken = useCallback((assistantId: string, token: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, content: m.content + token, isStreaming: true } : m
      )
    );
  }, []);

  const finaliseMessage = useCallback(
    (assistantId: string, intent?: ParsedIntent, workflowResult?: WorkflowResult) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, intent: intent ?? m.intent, workflowResult: workflowResult ?? m.workflowResult }
            : m
        )
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, model?: string) => {
      if (!content.trim() || isLoading) return;

      // Abort any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const userMsg: ChatMessage = { id: newId(), role: 'user', content: content.trim(), timestamp: Date.now() };
      const assistantId = newId();
      const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: false, timestamp: Date.now() };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setCurrentStatus({ phase: 'connecting', label: 'Connecting…' });

      let capturedIntent: ParsedIntent | undefined;
      let capturedWorkflow: WorkflowResult | undefined;

      try {
        if (useMock) {
          for await (const event of mockSSE(content)) {
            processEvent(event);
          }
        } else {
          await streamFromAPI(content, model, abortRef.current.signal);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'An error occurred. Please try again.', isStreaming: false }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        setCurrentStatus(null);
        finaliseMessage(assistantId, capturedIntent, capturedWorkflow);
      }

      function processEvent(event: SSEEvent) {
        switch (event.type) {
          case 'session':
            setSessionId(event.sessionId);
            break;
          case 'status':
            setCurrentStatus({ phase: event.phase as StatusPhase, label: event.label });
            break;
          case 'intent':
            capturedIntent = event.intent;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, intent: event.intent } : m))
            );
            break;
          case 'workflow':
            capturedWorkflow = event.result;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, workflowResult: event.result } : m))
            );
            break;
          case 'token':
            appendToken(assistantId, event.token);
            break;
          case 'done':
            break;
          case 'error':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `Error: ${event.message}`, isStreaming: false }
                  : m
              )
            );
            break;
        }
      }

      async function streamFromAPI(query: string, selectedModel: string | undefined, signal: AbortSignal) {
        const currentSessionId = sessionId;
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query, sessionId: currentSessionId, model: selectedModel }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') return;
              try {
                const event = JSON.parse(raw) as SSEEvent;
                processEvent(event);
              } catch {
                // malformed line — skip
              }
            }
          }
        }
      }
    },
    [isLoading, sessionId, useMock, appendToken, finaliseMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setCurrentStatus(null);
  }, []);

  return { messages, sessionId, isLoading, currentStatus, sendMessage, clearMessages };
}
