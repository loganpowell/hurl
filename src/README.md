inspired by the elm-architecture

- messages / commands -> (event stream) can contain: 
  - a single update command: 
  { 
    path: ['lens', 'to', 'junk'],
    payload: ...whatevs...,
    ...tbd 
  }
  - a transaction command (`state_stream is written to as an `@thi.ng/Atom.transaction`):
  [
    { 
      path: ['first', 'path'],
      payload: { first: 'payload'}, 
    },
    {
      path: ['second', 'path'],
      payload: { second: 'payload' }
    }
  ]
  - any functionality needed for async is done at call site (for deterministic state mgmt)
    - can be lifted into a util if concern is cross-cutting
    - the command with the functions powering the state/path updates may also be encapsulated as modules and used across multiple components for even greater reuse with the advantage of organizing state (consider importing all such modules into the creation of initial Atom for path 'registration'

- state -> (atom) store for write/read intersection:
  - central "update" dispatcher (from elm)
  - subscribes to `event_stream` and allows immutable updates to state using the `path` and `payload` of the event.dispatching mech can be:
    - an `@thi.ng/EquivMap` if you want to use the raw (array-based) path 
    - take the array and turn it into a dot-string for matching on a regular es6 Map
    - take the actual path and use it with `@thi.ng/paths` for immutable updates to the central store/Atom
  - dispatches events for view update on a separate `state_stream` (read only)
  - state stream is subscribed to from all `view`s (can be derived views of the atom
- view (hdom component/s)
  - 