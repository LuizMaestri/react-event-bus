import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React, { useState } from 'react';
import { createEventBus } from '../createEventBus';

type TestEvents = {
  'test:ping': { message: string };
};

const { useEvent, publish } = createEventBus<TestEvents>();

const TestComponent = ({ callback }: { callback: (msg: string) => void }) => {
  useEvent('test:ping', (data) => {
    callback(data.message);
  });
  return <div data-testid="test-div">Mounted</div>;
};

describe('createEventBus', () => {
  afterEach(cleanup);

  it('should trigger correctly in components', () => {
    const mockCallback = vi.fn();
    render(<TestComponent callback={mockCallback} />);
    
    expect(screen.getByTestId('test-div')).toBeDefined();

    act(() => {
      publish('test:ping', { message: 'hello' });
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('hello');
  });

  it('should reflect callback updates without re-subscribing', () => {
    const outputs: string[] = [];
    
    const DynamicComponent = () => {
      const [prefix, setPrefix] = useState('A-');

      useEvent('test:ping', (data) => {
        outputs.push(prefix + data.message);
      });

      return (
        <button onClick={() => setPrefix('B-')} data-testid="btn">
          Change Prefix
        </button>
      );
    };

    render(<DynamicComponent />);

    act(() => publish('test:ping', { message: 'hello' }));
    expect(outputs).toEqual(['A-hello']);

    // change state, which updates the callback reference
    act(() => screen.getByTestId('btn').click());

    act(() => publish('test:ping', { message: 'world' }));
    expect(outputs).toEqual(['A-hello', 'B-world']);
  });
});
