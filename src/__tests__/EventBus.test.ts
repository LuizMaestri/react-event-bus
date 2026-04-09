import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus';

type TestEvents = {
  'user:login': { name: string; age: number };
  'user:logout': void;
};

describe('EventBus core class', () => {
  it('should publish and subscribe to events correctly', () => {
    const bus = new EventBus<TestEvents>();
    const mockCallback = vi.fn();

    const unsubscribe = bus.subscribe('user:login', mockCallback);
    bus.publish('user:login', { name: 'Alice', age: 30 });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith({ name: 'Alice', age: 30 });

    unsubscribe();
    bus.publish('user:login', { name: 'Bob', age: 25 });
    
    // Should still be 1 because we unsubscribed
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should handle void playloads safely', () => {
    const bus = new EventBus<TestEvents>();
    const mockCallback = vi.fn();

    bus.subscribe('user:logout', mockCallback);
    bus.publish('user:logout', undefined as void);

    // Note: JSDOM serializes `detail: undefined` to `detail: null` inside CustomEvent.
    expect(mockCallback.mock.lastCall?.[0]).toBeFalsy();
  });

  it('should catch errors and call onError if provided', () => {
    const onErrorMock = vi.fn();
    const bus = new EventBus<TestEvents>({ onError: onErrorMock });
    
    bus.subscribe('user:login', () => {
      throw new Error('Test Error');
    });

    const mockCallback2 = vi.fn();
    bus.subscribe('user:login', mockCallback2);

    expect(() => {
      bus.publish('user:login', { name: 'Dan', age: 40 });
    }).not.toThrow();

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][1]).toBe('user:login');
    expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    
    // Validate that EventTarget continued calling other listeners.
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should filter events correctly', () => {
    const bus = new EventBus<TestEvents>();
    const mockCallback = vi.fn();

    bus.subscribe('user:login', mockCallback, {
      filter: (data) => data.age >= 18
    });

    bus.publish('user:login', { name: 'Kid', age: 12 });
    expect(mockCallback).not.toHaveBeenCalled();

    bus.publish('user:login', { name: 'Adult', age: 25 });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should debounce events correctly', () => {
    vi.useFakeTimers();
    const bus = new EventBus<TestEvents>();
    const mockCallback = vi.fn();

    bus.subscribe('user:login', mockCallback, { debounce: 200 });

    bus.publish('user:login', { name: 'A', age: 20 });
    bus.publish('user:login', { name: 'B', age: 20 });
    bus.publish('user:login', { name: 'C', age: 20 });
    
    // Should not have executed yet
    expect(mockCallback).not.toHaveBeenCalled();

    // Advance by 100ms
    vi.advanceTimersByTime(100);
    expect(mockCallback).not.toHaveBeenCalled();

    // Advance by remaining 100ms
    vi.advanceTimersByTime(100);
    
    // Only the last published event payload should be given to callback
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith({ name: 'C', age: 20 });

    vi.useRealTimers();
  });

  it('should respect execution priority sorting', () => {
    const bus = new EventBus<TestEvents>();
    const executionOrder: string[] = [];

    // Register lower priority first 
    bus.subscribe('user:logout', () => executionOrder.push('low'), { priority: 10 });
    
    // Register default
    bus.subscribe('user:logout', () => executionOrder.push('default'));
    
    // Register highest priority last
    bus.subscribe('user:logout', () => executionOrder.push('high'), { priority: 1 });

    bus.publish('user:logout', undefined as void);

    // Ensure they execute: high (1), default (5), low (10)
    expect(executionOrder).toEqual(['high', 'default', 'low']);
  });
});
