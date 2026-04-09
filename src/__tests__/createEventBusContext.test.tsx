import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { createEventBusContext } from '../createEventBusContext';

type TestEvents = {
  'test:msg': string;
};

const { EventBusProvider, useEvent, usePublish } = createEventBusContext<TestEvents>();

const Child = ({ callback }: { callback: (msg: string) => void }) => {
  const publish = usePublish();
  useEvent('test:msg', (data) => {
    callback(data);
  });

  return (
    <button data-testid="emit-btn" onClick={() => publish('test:msg', 'hello context')}>
      Emit
    </button>
  );
};

describe('createEventBusContext', () => {
  afterEach(cleanup);

  it('should emit and receive inside provider', () => {
    const mockCallback = vi.fn();
    render(
      <EventBusProvider>
        <Child callback={mockCallback} />
      </EventBusProvider>
    );
    
    act(() => {
      screen.getByTestId('emit-btn').click();
    });

    expect(mockCallback).toHaveBeenCalledWith('hello context');
  });

  it('should throw error if used outside provider', () => {
    // Hide console error to keep test output clean
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<Child callback={() => {}} />);
    }).toThrow(/must be used within an EventBusProvider/);

    spy.mockRestore();
  });
});
