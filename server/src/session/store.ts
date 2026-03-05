import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../types/intents';

const MAX_HISTORY = 20;

const store = new Map<string, ChatMessage[]>();

export const sessionStore = {
  getOrCreate(sessionId?: string): string {
    const id = sessionId ?? uuidv4();
    if (!store.has(id)) {
      store.set(id, []);
    }
    return id;
  },

  add(sessionId: string, message: ChatMessage): void {
    const history = store.get(sessionId) ?? [];
    history.push(message);
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }
    store.set(sessionId, history);
  },

  getWindow(sessionId: string, n: number = MAX_HISTORY): ChatMessage[] {
    const history = store.get(sessionId) ?? [];
    return history.slice(-n);
  },

  clear(sessionId: string): void {
    store.delete(sessionId);
  },

  size(): number {
    return store.size;
  },
};
