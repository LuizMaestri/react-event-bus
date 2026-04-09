import { useEffect, useRef } from 'react';
import { EventBus, EventBusOptions, SubscribeOptions } from './EventBus';

/**
 * Creates a global Event Bus instance and returns its hooks.
 * This is suitable if you want a singleton event bus across the entire application without needing Context Providers.
 */
export function createEventBus<T extends Record<string, any>>(options?: EventBusOptions) {
  const bus = new EventBus<T>(options);

  /**
   * Hook to subscribe to events safely inside React components.
   * Maintains the latest callback without triggering unnecessary effect re-runs.
   */
  function useEvent<K extends keyof T>(eventType: K, callback: (data: T[K]) => void, options?: SubscribeOptions<T[K]>) {
    const callbackRef = useRef(callback);

    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
      const handler = (data: T[K]) => callbackRef.current(data);
      return bus.subscribe(eventType, handler, options);
    }, [eventType]);
  }

  /**
   * Function to publish an event.
   */
  function publish<K extends keyof T>(eventType: K, data: T[K]) {
    bus.publish(eventType, data);
  }

  return { useEvent, publish };
}
