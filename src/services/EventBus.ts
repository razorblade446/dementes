type EventKey = string | symbol;
export type EventHandler<T = any> = (event: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventKey, Set<EventHandler>>;

  private constructor() {
    this.listeners = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }

  subscribe(eventType: string, listener: EventHandler): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(listener);
  }

  unsubscribe(eventType: string, listener: EventHandler): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.delete(listener);
    }
  }

  publish(eventType: string, event: unknown): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.forEach((listener) => listener(event));
    }
  }
}