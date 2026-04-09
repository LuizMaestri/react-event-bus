# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-08
### Added
- **Initial Release of `@luizmaestri/react-event-bus`! 🎉**
- **Global Event Bus:** Introduced `createEventBus()` hook provider for creating isolated, global strictly-typed event environments.
- **Scoped Event Bus:** Introduced `createEventBusContext()` exposing `<EventBusProvider />` to restrict and scope events securely within the React Context boundary.
- **Vanilla Core API:** Exposed pure `EventBus` class for flexible, low-level usage outside of React components.
- **React Hooks Integration:** Created `useEvent()` hook that automatically stabilizes callback references, completely eliminating unnecessary React `useEffect` re-rendering cycles.
- **Advanced Event Modifiers:**
  - `filter`: Predicate functions to conditionally intercept and drop events before reaching the callback.
  - `debounce`: Built-in event debouncing (in milliseconds) to limit high-frequency executions.
  - `priority`: Numeric execution priority tiers (1-10) for managing which listeners execute first.
- **TypeScript First:** 100% strict typing mapping event names directly to their expected payload signatures.
- **Zero DOM Pollution:** Built on top of private generic `EventTarget` instances instead of the global `window` or `document`, preventing event cross-talk.
