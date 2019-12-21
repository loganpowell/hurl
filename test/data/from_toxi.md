you could use metaStream as part of this, e.g.

```js

events = stream();
events
  .transform(fsm(...))
  .subscribe(metaStream((x) => isPromise(x) : fromPromise(x) : fromIterableSync([x]))
  .subscribe(trace())

```

TOXI: actually... slight correction needed: if your FSM produces promises, you'll need to return them as [[promise1, promise2...]] and then use fromPromises()  (plural, https://github.com/thi-ng/umbrella/blob/99e4968c51f00491df04286565b65fd9de092e0d/packages/rstream/src/from/promises.ts) in the metaStream...
also need to update that isPromise() check...

ME: so, wrap all non-promise vals as promises and keep promises as-is and then line them up...?
 
toxiToday at 10:52 AM
in principle yes, but again, this will have back pressure isues....
 
loganpowellToday at 10:53 AM
you mean there'll be blocking on the main thread waiting for the promises to resolve...
 
toxiToday at 10:53 AM
if your FSM always produces promises, then it's probably better to use a resolve() subscription than metaStream

have a look at the docs: https://github.com/thi-ng/umbrella/blob/99e4968c51f00491df04286565b65fd9de092e0d/packages/rstream/src/metastream.ts
GitHub
thi-ng/umbrella
⛱ Mono-repository of 111+ TypeScript/ES6 projects for functional, data driven development - thi-ng/umbrella

 
toxiToday at 10:56 AM
so, this would be better (possibly):

```js

events = stream();
events
  .transform(fsm(...))
  .subscribe(resolve())
  .subscribe(trace())

```

🔥 THIS ⬆ 