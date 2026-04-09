export interface EventBusOptions {
  /**
   * Global error handler for exceptions thrown by subscribers.
   * If not provided, errors will be logged via console.error.
   */
  onError?: (error: unknown, eventType: string) => void;
}

export interface SubscribeOptions<Payload> {
  /** Tests payload before running the callback. Returning false ignores the event. */
  filter?: (data: Payload) => boolean;
  /** Debounce the callback execution by X milliseconds */
  debounce?: number;
  /** Execution priority (1 to 10). 1 means highest priority (runs first). Default is 5. */
  priority?: number;
}

type ListenerDescriptor = {
  handler: (payload: any) => void;
  priority: number;
};

/**
 * A strongly-typed Event Bus powered by an internal Map for high performance.
 */
export class EventBus<T extends Record<string, any>> {
  private listeners = new Map<string, ListenerDescriptor[]>();

  constructor(private options?: EventBusOptions) { }

  /**
   * Subscribes to an event.
   * @param eventType The name of the event.
   * @param callback Function to be called when the event is published.
   * @returns A function to unsubscribe.
   */
  subscribe<K extends keyof T>(
    eventType: K,
    callback: (data: T[K]) => void,
    options?: SubscribeOptions<T[K]>
  ): () => void {
    const eventName = eventType as string;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    const handler = (payload: T[K]) => {
      if (options?.filter && !options.filter(payload)) {
        return;
      }

      const execute = () => {
        try {
          callback(payload);
        } catch (error) {
          if (this.options?.onError) {
            this.options.onError(error, eventName);
          } else {
            console.error(`[EventBus] Unhandled error in subscriber for event "${eventName}":`, error);
          }
        }
      };

      if (options?.debounce !== undefined) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(execute, options.debounce);
      } else {
        execute();
      }
    };

    const priority = options?.priority ?? 5;
    const descriptor: ListenerDescriptor = { handler, priority };

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    // Pushes and sorts listeners by priority ascending (1 executes before 10)
    const arrayRef = this.listeners.get(eventName)!;
    arrayRef.push(descriptor);
    arrayRef.sort((a, b) => a.priority - b.priority);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const arr = this.listeners.get(eventName);
      if (arr) {
        const index = arr.indexOf(descriptor);
        if (index !== -1) arr.splice(index, 1);
      }
    };
  }

  /**
   * Publishes an event to all subscribers.
   * @param eventType The name of the event.
   * @param data Payload of the event.
   */
  publish<K extends keyof T>(eventType: K, data: T[K]): void {
    const eventName = eventType as string;
    const arr = this.listeners.get(eventName);
    if (!arr || arr.length === 0) return;

    // Use a copy of the array iterating so we don't skip handlers if one unsubscribes synchronously
    const runners = [...arr];
    for (const descriptor of runners) {
      descriptor.handler(data);
    }
  }
}
