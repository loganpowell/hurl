# Cascade

## Stated Cascade Unidirectional Rendering

Order of execution:
1. Any async data gathering/transformation happens pre-state update
2. All rendering/presentation-oriented feature is a function of state (direct or derived) 

Diagram: 

0: Setup -> register cursors on global state for various components
⬇ 
1: Prep -> any data gathering / xformation
⬇ 
2: State Update -> manipulation of global state Atom
⬇ 
3: State Stream -> downstream state updates to registered components
⬇ 
4: Render (RAF) sidechain -> new view is rendered based on updated state

---
## Lexing (Compile Time)

ARCH: (ctx) => (ctx.state_stream.deref(), ctx.trigger_stream.next({🤔}), )
               |- === === read === === -| |- === === write === === -|

### Example components (powered downstream from state updates):
- URL
  - state_stream
  - state_stream.subscribeTopic(["router"]
    - render
- DATA
  <head>
  - state_stream
    - render
  <body>
  - state_stream
    - render

### Example triggers (powered upstream to state)
- `addeventlistener`s
  - `popstate`
    - cursor_popstate = cursor(["router], DB)
    - trigger_stream.subscribe("route", x => cursor_popstate.reset(y => y = x))
  - `DOMContentLoaded`
    - cursor_styles = cursor(["styles"], DB)
    - trigger_stream.subscribe("styles", x => cursor_styles.reset(y => y = x))
- UI interactions (dispatch)
  - trigger_stream.next({}) -> inject event from `ctx` 

#### 0: Setup
Register UI components on global state Atom as cursors, which both provide a `deref`able view of global state and its registered components 


### Triggers are transducers that are composed on the fly (runtime)

Triggers that are composed into an array are invoked on a substream (using R.invoker?) one step at a time. This allows the user to cancel the entire stream via (e.g., during loading of the steps) `triggers.cancel()` to terminate the entire subprocess before it completes.

An array of triggers spins up a `transducers-fsm` state machine, that controls the passing of values between triggers and emits values to the `triggers.next` stream with these conditions:

- if event contains `resolve` key: resolve promise then 
- if `payload` type === "function": use fsm state ({ state: "pass", payload: [result of function]

Canceling can either be explicitly injected with `triggers.cancel()` or can 

🌊 All pending state updates are batched and send in a single `transaction` at the end of the sequence

#### Signature:

```js
// Higher Order Trigger (used in-situ)
let prefetch_link = (ctx, ev) => {
  ev.preventDefault()

  if (window.location.href === ev.target.href) return // one way of handling noops
  
  // single event object just directly pushes to the triggers stream in the stream xf
  // first set state.loading = true
  ctx.run.next({
    sub: "state",
    path: ["body", "loading"]
    payload: true
  })

  // an array triggers the fsm to pass data between events and batch state updates 
  // run/batch up a sequence of events
  ctx.run.next([
    {
      sub: "init", // sets initial state of FSM
      args: local_state => local_state["href"] = ev.target.href
    },
    {
      sub: "filter", // another way to handle noops -> only emit if passes predicate 
      args: ({ href }) => window.location.href !== href
    },
    {
      // if the xf returns a promise, it is resolved before passing
      sub: "promise", 
      args: ({ href }) => fetch("something" + parse_hurl(href)["path"]),
      // splitting behavior
      // dispatch to next (invoker .next triggers)
      then: local_state => local_state["data"] = r.json(),
      // dispatched to alternative stream (invoker .next errors) and triggers.cancel()
      catch: () => ({ sub: "cancel" args: e })
      }
    },
    {
      sub: "refer",
      args: ({ data }) => route(data, ev.target.href)
    }
  ]) 
}

// Lower Order Trigger (on triggers.next("route") )
let route = (data, href) => [
  {
    sub: "init",
    args: local_state => local_state["init"] = href
  },
  {
    sub: "FLIP", 
    // options (1): https://github.com/davidkpiano/flipping#new-flippingoptions
    // options (2): https://github.com/aholachek/react-flip-toolkit/tree/7382f9380200f5a85296621db852ea2513cc5eec/packages/flip-toolkit
    args: "start" || { opts } // just use the default (empty) new Flipping() 
  },
  {
    sub: "state",
    path: ["head"],
    // 📌 have to create a function that generates/overwrites these defaults...
    args: {
      title: `Hyperlocals ${search && "Search Results for: " + search}`,
      "og:description": "social media for people who hate social media",
      "og:type": "website",
      "og:url": href,
      "og:image": pic,
      "og:image:width": 1200,
      "og:image:height": 1200
    }
  },
  {
    id: "state",
    path: ["body", "content"],
    args: data,
  },
  {
    id: "state",
    path: ["body", "loading"],
    args: false
  },
  {
    id: "state",
    path: ["route"]
    args: { state: parse_URL(href), href }
  },
  {
    id: "pushstate",
    args: { state: parse_URL(href), href }
  },
  {
    id: "FLIP",
    args: "end"
  }
]
```

## PubSub Dispatcher

The dispatching function is an `thi.ng/rstream` `pubsub` instance, which is dispatched to with an asyncronous reduction:

```js


```

## DOM listeners

DOM listeners are registered to the triggers stream as well and can be used to inject events into the stream.

Examples:
- if navigation is executed during `["body", "loading"] === true`, user cancels any pending events in the stream with `triggers.cancel()`,

if any higher order triggers are aliases for lower-order triggers, the lower-order triggers are unwrapped and applied in place of their higher-order alias before emitting event through first higher-order trigger
---

## Parsing (Runtime)

### 1: Prep
Any function that seeks to change the UI
