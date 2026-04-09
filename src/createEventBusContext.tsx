import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { EventBus, EventBusOptions, SubscribeOptions } from './EventBus';

/**
 * Creates a typed React Context, Provider and Hooks for an isolated Event Bus.
 * Ideal when you need multiple independent instances of the bus, or scoped events for part of the React tree.
 */
export function createEventBusContext<T extends Record<string, any>>(defaultOptions?: EventBusOptions) {
  const BusContext = createContext<EventBus<T> | null>(null);

  /**
   * Provider component that wraps part of your app, giving it access to this Event Bus Context.
   */
  function EventBusProvider({ children, instance }: { children: ReactNode; instance?: EventBus<T> }) {
    const busRef = useRef<EventBus<T>>(instance || new EventBus<T>(defaultOptions));
    
    useEffect(() => {
      if (instance) {
        busRef.current = instance;
      }
    }, [instance]);

    return (
      <BusContext.Provider value={busRef.current}>
        {children}
      </BusContext.Provider>
    );
  }

  /**
   * Hook to subscribe to Context-scpe events safely inside React components.
   */
  function useEvent<K extends keyof T>(eventType: K, callback: (data: T[K]) => void, options?: SubscribeOptions<T[K]>) {
    const currentBus = useContext(BusContext);
    if (!currentBus) {
      throw new Error("useEvent must be used within an EventBusProvider");
    }

    const callbackRef = useRef(callback);
    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
      const handler = (data: T[K]) => callbackRef.current(data);
      return currentBus.subscribe(eventType, handler, options);
    }, [currentBus, eventType]);
  }

  /**
   * Hook to publish events to the current Event Bus Context.
   */
  function usePublish() {
    const currentBus = useContext(BusContext);
    if (!currentBus) {
      throw new Error("usePublish must be used within an EventBusProvider");
    }
    
    return <K extends keyof T>(eventType: K, data: T[K]) => {
      currentBus.publish(eventType, data);
    };
  }

  return { EventBusProvider, useEvent, usePublish };
}
