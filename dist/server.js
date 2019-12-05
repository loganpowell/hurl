// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"parse-href.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse_href = void 0;

var _querystring = _interopRequireDefault(require("querystring"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import fetch from "node-fetch"
// const log = console.log
// let hrefs = [
//   "https://api.census.gov/data.html",
//   "https://api.census.gov/data/2017/acs/acs1?query=some%20text",
//   "https://census.gov/developers/apis#getting-started",
//   "https://census.gov/developers/apis/?slash=true",
//   "https://www.census.gov/developers/apis/?slash=true#focus",
//   "https://www.census.gov/developers/apis/#focus?slash=true",
//   "https://www.census.gov/developers/apis#focus?slash=false",
//   "http://www.example.com/path/to/resource?query=text&search=find+me#focus-heading",
//   "http://api.localhost:1234/todos/2",
//   "/todos/2"
// ]
const parse_href = href => {
  let sub_domain = [];
  let domain = [];
  let path = [];
  let query = {};
  let hash = "";

  if (/http/g.test(href)) {
    const parts = href.split(/(?=\?)|(?=#)/g);
    const path_str = parts[0];
    const query_str = parts.filter(part => part.slice(0, 1) === "?")[0] || "";
    query = _querystring.default.parse(query_str.slice(1));
    const hash_str = parts.filter(part => part.slice(0, 1) === "#")[0] || "";
    hash = hash_str.slice(1);
    const full_path = path_str.split("/").filter(x => x !== "");
    domain = full_path[1].split(".").slice(-2);
    sub_domain = full_path[1].split(".").slice(0, -2);
    path = full_path.slice(2);
  } else {
    path = href.split("/").filter(x => x !== "");
  }

  return {
    sub_domain,
    domain,
    path,
    query,
    hash
  };
}; // console.time("start")
// let all = hrefs.map(x => parse_href(x)) //?
// let test = all.slice(-1)[0]
// console.timeEnd("start")
// qs.encode(test.query).replace("%20", "+") //?
// fetch("http://api.example.localhost:1234/users/2", {
//   headers: { "Content-Type": "application/json" }
// }).then(r => r.text()) //?


exports.parse_href = parse_href;
},{}],"dispatcher.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatch_w_config = void 0;

var _parseHref = require("./parse-href");

var _associative = require("@thi.ng/associative");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const log = console.log;

const getSomeJSON = async (query, path, b) => {
  const base = "https://jsonplaceholder.typicode.com/";
  const data = b ? await (0, _nodeFetch.default)(`${base}${path}/${b}`).then(r => r.json()) : await (0, _nodeFetch.default)(`${base}${path}/`).then(r => r.json());
  return data;
};

const dispatch_w_config = async h => {
  const ph = _parseHref.parse_href;
  const route_obj = ph(h);
  log(route_obj);
  const {
    sub_domain,
    domain,
    path: [a, b, c, d],
    query,
    hash
  } = route_obj; // prettier-ignore

  const data = (await new _associative.EquivMap([[_objectSpread({}, ph(h), {
    path: ["todos"]
  }), getSomeJSON(query, "todos", null)], [_objectSpread({}, ph(h), {
    path: ["todos", b]
  }), getSomeJSON(query, "todos", b)], [_objectSpread({}, ph(h), {
    path: ["users"]
  }), getSomeJSON(query, "users", null)], [_objectSpread({}, ph(h), {
    path: ["users", b]
  }), getSomeJSON(query, "users", b)]]).get(route_obj)) || null; // this is used by importing dispatch_w_config into the server config.

  if (domain.length < 1) return data; // this would be an hdom + spec -> page

  const el = document.createElement("code");
  el.innerText = JSON.stringify(data, null, 2);
  if (el !== "404") document.body.appendChild(el);
};

exports.dispatch_w_config = dispatch_w_config;
},{"./parse-href":"parse-href.js"}],"server.js":[function(require,module,exports) {
"use strict";

var _http = _interopRequireDefault(require("http"));

var _dispatcher = require("./dispatcher");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  PORT = 3000,
  UP_STAGE
} = process.env;

const server = _http.default.createServer();

const log = console.log;
server.listen(PORT, e => {
  if (e) return log("Error:", e);
  log(`server is listening on ${PORT}...`);
});
server.on("request", async (req, res) => {
  if (req.url === "/favicon.ico") log("no favicon yet, 😞");
  log("PORT:", PORT); // log("request:", req) // -> url: '/',

  let data = await (0, _dispatcher.dispatch_w_config)(req.url);
  log(data);
  res.end(JSON.stringify(data));
});
},{"./dispatcher":"dispatcher.js"}]},{},["server.js"], null)
//# sourceMappingURL=/server.js.map