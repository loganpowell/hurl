import { run$, task$, command$ } from "./dispatchers"

/**
 * Registers event handler for given `id`, incl. optional validation
 * transducer, which when given, is applied prior to the actual handler.
 * The handler's subscription also includes an error handler to display
 * errors in the console.
 *
 * @param command a Command object
 * @param handler a function that is triggered w/the command
 * @param xform optional transducer to alter stream emmissions
 *              before invoking the handler
 *
 * @example
 * // naming convention for functions with prerequisites
 * // or dependencies from upstream commands in a task
 * // upstreamStateDependency_handlerName (separated with
 * // underscore)
 * import { filter } from "@thi.ng/transducer"
 *
 * const href_meta = defHandler(
 *   {
 *     sub$: "meta",
 *     // notice state.href dependency
 *     args: state => fetch(state.href).then(r => r.json()),
 *     ...
 *   },
 *   ({ args }) => parseMetaAndInjectHead(args),
 *   filter(x => !!x.args.data)
 * )
 */
export const defHandler = (command, handler, xform) => {
  const { sub$ } = command
  const sub = {
    next: handler, // Fn
    error: console.warn // Fn
    //done: Fn0
  }
  if (xform) command$.subscribeTopic(sub$, {}, {}).subscribe(sub, xform)
  else command$.subscribeTopic(sub$, sub)
  return command // this is your constant/alias
}

/**
 * PSEUDO:
 * - create some test payloads for dispatcher: single obj & array
 * - create a handler that handles a single obj (O)
 * - create a handler that uses O on every elem of array
 * - async reducer that resolves intermediary values to be assoc'ed to accumulator
 * - use `scan` to pass the accumulator
 *
 * DIAGRAM:
 *
 *    9   8  7  6      5  4  3  2  1
 * >--*--[*, *, *]----[*, *, *, *]-*--->
 *    |  |            |            |
 *    A  B            B            A      <== ctx.run.next()'s
 *    E  rE rE rE     rE rE rE rE  E
 *
 * A: single emmission   : x => form_1(x)
 * B: sequence emmission : form_2 = [x, x, x].scan((a,c) => form_1(x)).subscribe(resolve()).subscribe...
 *
 * HOF (A|B): x => isArray(x) ? form_2(x) : form_1(x)
 *
 * A) Description:
 * - takes any promises and passes them through as-is,
 * - wraps any non-promise in Promise.resolve(x)
 *
 * Canceling 🤔:
 * - enable ctx.run.cancel() via external or internal events (e.g., popstate / { sub$:  "cancel" })
 *
 *
 * */
// Higher Order Trigger (used in-situ)
let prefetch_link = (ctx, ev) => {
  ev.preventDefault()

  if (window.location.href === ev.target.href) return // one way of handling noops

  // single event object just directly pushes to the triggers stream in the stream xf
  // first set state.loading = true
  ctx.run.next({
    sub$: "state",
    path: ["body", "loading"],
    args: true
  })

  // an array triggers the fsm to pass data between events and batch state updates
  // run/batch up a sequence of events
  ctx.run.next([
    {
      sub$: "init", // sets initial state of FSM
      args: { href: ev.target.href }
    },
    {
      sub$: "filter", // another way to handle noops -> only emit if passes predicate
      args: ({ href }) =>
        window.location.href === href
          ? { sub$: "cancel", args: "window.location.href === href" }
          : { href }
    },
    {
      // if the xf returns a promise, it is resolved before passing
      sub$: "fetch",
      args: ({ href }) => fetch("api" + href).then(r => r.json()),
      // splitting behavior
      // dispatch to next (invoker .next triggers)
      reso: (state, res) => ({ ...state, data: res.json() }),
      // dispatched to alternative stream (invoker .next errors) and triggers.cancel()
      // also consider just `throw`ing:
      // https://github.com/thi-ng/umbrella/tree/master/packages/rstream#conceptual-differences-to-rxjs
      erro: (state, err) => ({ sub$: "cancel", args: err })
    },
    state => route(state, ev.target.href)
  ])
}
