import { fsm } from "@thi.ng/transducers-fsm"
import * as tx from "@thi.ng/transducers"
import { isOdd, isArray, isFunction, isObject, isPromise } from "@thi.ng/checks"
import fetch from "node-fetch"
import { EquivMap } from "@thi.ng/associative"
import Type from "union-type"

const somePromise = async (payload, ms) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(payload), ms)
  })
}

const testFSM = fsm({
  // initial state initializer
  // (called before processing 1st input)
  init: () => ({ state: "skip", count: 0 }),

  // terminal state ID
  terminate: "done",

  // individual state handlers
  states: {
    // skip state
    skip: (state, x) => {
      if (x < 20) {
        if (++state.count > 5) {
          state.state = "take"
          state.count = 1
          return [x]
        }
      } else {
        state.state = "done"
      }
    },

    // take state
    take: (state, x) => {
      // <- can I? 📌
      if (x < 20) {
        return [x]
      } else {
        state.state = "done"
      }
    },

    // terminal state, ignore inputs
    done: () => {}
  }
})

let ex1 = [...tx.iterator(testFSM, tx.range(100))] //?
// [ 5, 6, 7, 8, 9, 15, 16, 17, 18, 19 ]

// Use FSM as part of composed transducers...

let ex2 = [...tx.iterator(tx.comp(tx.takeNth(2), testFSM), tx.range(100))] //?
// [ 10, 12, 14, 16, 18 ]

let ex3 = [
  ...tx.iterator(
    tx.comp(
      tx.mapcat(x => x.split(/[,\s]+/g)),
      tx.map(x => parseInt(x)),
      testFSM,
      tx.filter(isOdd)
    ),
    ["9,8,7,6", "14 1 0 17 15 16", "19,23,12,42,4"]
  )
]

let obj = {}
obj["data"] = "JSON"
obj.something_else = "BOOBS"
obj //?
obj["data"] = "overwritten"
obj //?
let xs = [1, 2, 3, 4].filter(x => x % 2 === 0) //?

let test_fn = (args = "one") => args
test_fn() //?
test_fn(undefined) //?

let obj2 = { then: "yep" }
obj2.then //?

let fn1 = () => "testing"
let fn2 = (one, two) => "testing"
let fn3 = ({ one }) => "testing"
fn1.length //?
fn2.length //?
fn3.length //?
