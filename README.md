# React Event Bus

A lightweight React library for dispatching and listening to native events, written in TypeScript. It intelligently replaces the verbose use of `document.addEventListener` with APIs optimized for the React ecosystem, maintaining complete isolation and strict TypeScript typing.

## Advantages
- **100% Typed**: Mapped events are strictly typed to prevent typos and enhance Auto-Complete.
- **Hook-Friendly**: Keeps your component `callbacks` references up-to-date, preventing event re-subscriptions that overload React effects (avoids unnecessary `useEffect` triggers).
- **No DOM Pollution**: Uses private instances of the native `EventTarget` API instead of the global window or document, preventing event overlapping from different origins.

---

## 💻 How to Use

### 1. Defining your types and events
Start by defining a single type that dictates the mapping of your event name directly to its payload.

```typescript
// types.ts
export type AppEvents = {
  // An event with a detailed payload:
  'user:login': { username: string; id: number };

  // A simple "trigger" event without data:
  'ui:toggleSidebar': void;
};
```

---

### Approach A: Global Instance (Singleton)

Recommended for general use cases of loose events where multiple parts of the system, not bound to the same Provider, need to interact.

```tsx
// src/events.ts
import { createEventBus } from '@luizmaestri/react-event-bus';
import { AppEvents } from './types';

// The export provides the tools bound to an isolated global scope!
export const { useEvent, publish } = createEventBus<AppEvents>();
```

**Listening in a React Component:**
```tsx
import React, { useState } from 'react';
import { useEvent } from './events';

export const WelcomeHeader = () => {
  const [user, setUser] = useState<string | null>(null);

  useEvent('user:login', (data) => {
    // Your editor (IDE) will automatically know that `data` 
    // has the properties `username` and `id`!
    setUser(`Welcome, ${data.username}!`);
  });

  return <header>{user || 'Guest'}</header>;
};
```

**Publishing an event:**
```tsx
import { publish } from './events';

export const LoginForm = () => {
  const handleSuccess = () => {
    publish('user:login', { username: 'Luiz', id: 42 });
  };

  return <button onClick={handleSuccess}>Login</button>;
};
```

---

### Approach B: Scoped via Context API

Ideal for isolated widgets, micro-frontends, or parts that shouldn't leak events globally to other areas of the application if there are simultaneous instances on the same screen.

```tsx
import { createEventBusContext } from '@luizmaestri/react-event-bus';
import { AppEvents } from './types';

export const { 
    EventBusProvider, 
    useEvent, 
    usePublish 
} = createEventBusContext<AppEvents>();

// 1. Wrap your sub-app with the Provider. Everyone inside it 
// will see the same event channel.
export const Dashboard = () => {
    return (
        <EventBusProvider>
            <Header />
            <Actions />
        </EventBusProvider>
    )
}

// 2. Access via hooks restricted to Context
const Header = () => {
    useEvent('ui:toggleSidebar', () => {
        console.log('Sidebar Toggled!!');
    });
    return <div />;
}

const Actions = () => {
   const publish = usePublish();
   return <button onClick={() => publish('ui:toggleSidebar', undefined)}>Toggle</button>;
}
```

---

### 3. Pure Class (Low Level)

For pure Vanilla JS libraries to talk to your event bus by abstracting React completely:

```typescript
import { EventBus } from '@luizmaestri/react-event-bus';

const coreBus = new EventBus<AppEvents>();

// Subscribe
const unsubscribe = coreBus.subscribe('user:login', (data) => {
    console.log(data.username);
});

// Emit
coreBus.publish('user:login', { username: 'Luiz', id: 42 });

// Clean memory
unsubscribe();
```

---

### 🚀 Advanced Usage (Filters and Debounce)

Both `useEvent` and the native `subscribe()` method accept a third options argument to optimize your rendering performance:

```tsx
import { useEvent } from './events';

export const SearchAPI = () => {
    useEvent('search:queryChanged', (data) => {
         console.log(`We only get here after you stop typing for 300ms, and if the word is longer than 3 letters:`, data.term);
    }, {
         // Optional: Only executes if it returns true
         filter: (data) => data.term.length >= 3,
         
         // Optional: Waits (debounce) for events to stop at the origin for the number of milliseconds below
         debounce: 300,

         // Optional: Execution priority level (1 to 10). Default is 5.
         // A listener with priority 1 always runs before one with priority 5.
         priority: 1 
    });

    return <div>...</div>;
};
```
