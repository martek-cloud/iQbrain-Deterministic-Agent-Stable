import type { ChatMessage } from '@iqbrain/shared-types';
import { StreamingCursor } from './StreamingCursor';
import { IntentBadge } from './IntentBadge';
import { WorkflowPanel } from './panels/WorkflowPanel';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end px-4 animate-slide-up">
        <div className="max-w-xl bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 animate-slide-up">
      {/* Brain avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <span className="text-amber-400 text-[10px] font-bold font-mono-code">IQ</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 max-w-2xl">
        {/* Intent badge */}
        {message.intent && !message.isStreaming && (
          <div className="mb-1.5">
            <IntentBadge intent={message.intent} />
          </div>
        )}

        {/* NLG text */}
        {(message.content || message.isStreaming) && (
          <div className="bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-200 leading-relaxed shadow-sm border border-zinc-800">
            <span>{message.content}</span>
            <StreamingCursor visible={!!message.isStreaming} />
          </div>
        )}

        {/* Workflow panel */}
        {message.workflowResult && !message.isStreaming && (
          <div className="mt-2">
            <WorkflowPanel result={message.workflowResult} />
          </div>
        )}
      </div>
    </div>
  );
}
