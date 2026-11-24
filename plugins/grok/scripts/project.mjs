#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/debug.js"(exports, module) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module.exports = debug;
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/constants.js"(exports, module) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var WHITESPACE_CHARACTERS = [
      "	",
      "\n",
      "\v",
      "\f",
      "\r",
      " ",
      "\xA0",
      "\u1680",
      "\u2000",
      "\u2001",
      "\u2002",
      "\u2003",
      "\u2004",
      "\u2005",
      "\u2006",
      "\u2007",
      "\u2008",
      "\u2009",
      "\u200A",
      "\u2028",
      "\u2029",
      "\u202F",
      "\u205F",
      "\u3000",
      "\uFEFF"
    ];
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      WHITESPACE_CHARACTERS,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/re.js
var require_re = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/re.js"(exports, module) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t2 = exports.t = {};
    var R2 = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R2++;
      debug(name, index, value);
      t2[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t2.NUMERICIDENTIFIER]})\\.(${src[t2.NUMERICIDENTIFIER]})\\.(${src[t2.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src[t2.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t2.NONNUMERICIDENTIFIER]}|${src[t2.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t2.NONNUMERICIDENTIFIER]}|${src[t2.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t2.PRERELEASEIDENTIFIER]}(?:\\.${src[t2.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t2.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t2.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t2.BUILDIDENTIFIER]}(?:\\.${src[t2.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t2.MAINVERSION]}${src[t2.PRERELEASE]}?${src[t2.BUILD]}?`);
    createToken("FULL", `^${src[t2.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t2.MAINVERSIONLOOSE]}${src[t2.PRERELEASELOOSE]}?${src[t2.BUILD]}?`);
    createToken("LOOSE", `^${src[t2.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t2.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t2.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t2.XRANGEIDENTIFIER]})(?:\\.(${src[t2.XRANGEIDENTIFIER]})(?:\\.(${src[t2.XRANGEIDENTIFIER]})(?:${src[t2.PRERELEASE]})?${src[t2.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t2.XRANGEIDENTIFIERLOOSE]})(?:${src[t2.PRERELEASELOOSE]})?${src[t2.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t2.GTLT]}\\s*${src[t2.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t2.GTLT]}\\s*${src[t2.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t2.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t2.COERCEPLAIN] + `(?:${src[t2.PRERELEASE]})?(?:${src[t2.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t2.COERCE], true);
    createToken("COERCERTLFULL", src[t2.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t2.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t2.LONETILDE]}${src[t2.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t2.LONETILDE]}${src[t2.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t2.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t2.LONECARET]}${src[t2.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t2.LONECARET]}${src[t2.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t2.GTLT]}\\s*(${src[t2.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t2.GTLT]}\\s*(${src[t2.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t2.GTLT]}\\s*(${src[t2.LOOSEPLAIN]}|${src[t2.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t2.XRANGEPLAIN]})\\s+-\\s+(${src[t2.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t2.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t2.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/parse-options.js"(exports, module) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module.exports = parseOptions;
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/internal/identifiers.js"(exports, module) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a2, b) => {
      if (typeof a2 === "number" && typeof b === "number") {
        return a2 === b ? 0 : a2 < b ? -1 : 1;
      }
      const anum = numeric.test(a2);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a2 = +a2;
        b = +b;
      }
      return a2 === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a2 < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a2, b) => compareIdentifiers(b, a2);
    module.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/classes/semver.js"(exports, module) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t: t2 } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i2 = 0; i2 < identifiers.length; i2++) {
        if (compareIdentifiers(prerelease[i2], identifiers[i2]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version2, options) {
        options = parseOptions(options);
        if (version2 instanceof _SemVer) {
          if (version2.loose === !!options.loose && version2.includePrerelease === !!options.includePrerelease) {
            return version2;
          } else {
            version2 = version2.version;
          }
        } else if (typeof version2 !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version2}".`);
        }
        if (version2.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version2, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version2.trim().match(options.loose ? re[t2.LOOSE] : re[t2.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version2}`);
        }
        this.raw = version2;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i2 = 0;
        do {
          const a2 = this.prerelease[i2];
          const b = other.prerelease[i2];
          debug("prerelease compare", i2, a2, b);
          if (a2 === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a2 === void 0) {
            return -1;
          } else if (a2 === b) {
            continue;
          } else {
            return compareIdentifiers(a2, b);
          }
        } while (++i2);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i2 = 0;
        do {
          const a2 = this.build[i2];
          const b = other.build[i2];
          debug("build compare", i2, a2, b);
          if (a2 === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a2 === void 0) {
            return -1;
          } else if (a2 === b) {
            continue;
          } else {
            return compareIdentifiers(a2, b);
          }
        } while (++i2);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match2 = `-${identifier}`.match(this.options.loose ? re[t2.PRERELEASELOOSE] : re[t2.PRERELEASE]);
            if (!match2 || match2[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i2 = this.prerelease.length;
              while (--i2 >= 0) {
                if (typeof this.prerelease[i2] === "number") {
                  this.prerelease[i2]++;
                  i2 = -2;
                }
              }
              if (i2 === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module.exports = SemVer;
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/compare.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compare2 = (a2, b, loose) => new SemVer(a2, loose).compare(new SemVer(b, loose));
    module.exports = compare2;
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/parse.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse2 = (version2, options, throwErrors = false) => {
      if (version2 instanceof SemVer) {
        return version2;
      }
      try {
        return new SemVer(version2, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module.exports = parse2;
  }
});

// ../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "../../node_modules/.pnpm/semver@7.8.6/node_modules/semver/functions/valid.js"(exports, module) {
    "use strict";
    var parse2 = require_parse();
    var valid3 = (version2, options) => {
      const v = parse2(version2, options);
      return v ? v.version : null;
    };
    module.exports = valid3;
  }
});

// src/project/command.ts
import { randomUUID as randomUUID4 } from "node:crypto";
import { existsSync as existsSync3, lstatSync as lstatSync7, rmSync as rmSync5, statSync } from "node:fs";
import { join as join14, normalize as normalize3, resolve as resolve2 } from "node:path";

// src/plugin/node-util-compat.ts
var node_util_compat_exports = {};
__export(node_util_compat_exports, {
  default: () => node_util_compat_default,
  styleText: () => styleText2
});
__reExport(node_util_compat_exports, node_util_star);
import * as util from "node:util";
import * as node_util_star from "node:util";
var CODES = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],
  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49]
};
var fallback = (format, text, options = {}) => {
  const stream = options.stream ?? process.stdout;
  const env = process.env;
  const colour = options.validateStream === false || env.FORCE_COLOR !== void 0 && env.FORCE_COLOR !== "0" || stream.isTTY === true && !env.NO_COLOR && !env.NODE_DISABLE_COLORS && env.TERM !== "dumb";
  if (!colour) return text;
  let out = text;
  for (const name of Array.isArray(format) ? format : [format]) {
    const code = CODES[name];
    if (code) out = `\x1B[${code[0]}m${out}\x1B[${code[1]}m`;
  }
  return out;
};
var styleText2 = util.styleText ?? fallback;
var node_util_compat_default = { ...util, styleText: styleText2 };

// ../../packages/contracts/src/invisible-text-v1.ts
var INVISIBLE_FORMATTING_CLASS = "\\u061c\\u200b\\u200e\\u200f\\u202a-\\u202e\\u2060-\\u2064\\u2066-\\u2069\\ufeff";
var SUBDIVISION_FLAG = "\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}";
var HIDDEN_TEXT = new RegExp(
  `(${SUBDIVISION_FLAG})|[${INVISIBLE_FORMATTING_CLASS}\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f-\\u009f\\u206a-\\u206f\\u{E0000}-\\u{E007F}]`,
  "gu"
);

// ../../packages/contracts/src/console-rules-v1.ts
var CONSOLE_PROJECT_NAME_MAX = 64;
var FORBIDDEN_NAME_CHARACTERS = /[\p{Cc}\p{Zl}\p{Zp}\p{Cs}\u061C\u200E\u200F\u202A-\u202E\u2066-\u206F\uFEFF\u{E0000}-\u{E007F}]/u;
var VISIBLE_NAME_CHARACTER = /[^\p{Cf}\p{Z}\p{M}\p{Co}\p{Cn}\u115F\u1160\u3164\uFFA0\u2800]/u;
function isConsoleProjectName(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= CONSOLE_PROJECT_NAME_MAX && value === value.normalize("NFC") && value === value.trim() && !FORBIDDEN_NAME_CHARACTERS.test(value) && VISIBLE_NAME_CHARACTER.test(value);
}
var INVISIBLE_NAME_FORMATTING = new RegExp(
  `[${INVISIBLE_FORMATTING_CLASS}]`,
  "gu"
);
var HAS_INVISIBLE_NAME_FORMATTING = new RegExp(
  `[${INVISIBLE_FORMATTING_CLASS}]`,
  "u"
);

// src/connection/api-base.ts
function isLoopbackHostname(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
}
function isAllowedApiBase(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}
var PROD_API_BASE = "https://api.memroot.dev";
var DEV_API_BASE = "http://localhost:8787";
function resolveApiBase(options, config) {
  const base = options.apiBase ?? process.env.MEMROOT_API_BASE ?? (options.env ? options.env === "dev" ? DEV_API_BASE : PROD_API_BASE : void 0) ?? config.apiBase ?? PROD_API_BASE;
  const normalized = base.replace(/\/+$/, "");
  if (!isAllowedApiBase(normalized))
    throw new Error(
      "INSECURE_API_BASE: The API base must use https, or http only on a loopback address for local development."
    );
  return normalized;
}

// src/state/paths.ts
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, normalize } from "node:path";
var UnsafePathError = class extends Error {
  constructor(code = "UNSAFE_PATH") {
    super(`${code}: refusing an unexpected file type or symbolic link.`);
    this.code = code;
  }
  code;
};
function absoluteEnv(name) {
  const value = process.env[name];
  if (!value) return void 0;
  if (!isAbsolute(value))
    throw new Error(`INVALID_STATE_DIRECTORY: ${name} must be absolute.`);
  return normalize(value);
}
function stateBoundary() {
  const explicit = absoluteEnv("MEMROOT_STATE_DIR");
  if (explicit) return { boundary: explicit, dir: explicit };
  const base = absoluteEnv("XDG_STATE_HOME") ?? join(homedir(), ".local", "state");
  return { boundary: base, dir: join(base, "memroot", "capture") };
}
function stateDir() {
  return stateBoundary().dir;
}
function memrootConfigDir() {
  const override = process.env.MEMROOT_TEST_CONFIG_DIR;
  if (process.env.NODE_ENV === "test" && override && isAbsolute(override))
    return normalize(override);
  return join(homedir(), ".memroot");
}
function consentPath() {
  return join(memrootConfigDir(), "capture.json");
}
function assertRealDirectory(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new UnsafePathError();
}
function ensurePrivateDir(path, boundary, checkRoot = false) {
  const target = normalize(path);
  const root = normalize(boundary);
  if (target !== root && !target.startsWith(`${root}/`))
    throw new UnsafePathError();
  mkdirSync(target, { recursive: true, mode: 448 });
  let current = target;
  for (; ; ) {
    if (current === root) {
      if (checkRoot) assertRealDirectory(current);
      break;
    }
    assertRealDirectory(current);
    current = dirname(current);
  }
  const info = lstatSync(target);
  if ((info.mode & 511) !== 448) chmodSync(target, 448);
}
function stateSubdir(...parts) {
  const { boundary, dir } = stateBoundary();
  const path = join(dir, ...parts);
  ensurePrivateDir(path, boundary, boundary === dir);
  return path;
}
function readPrivateFile(path, maxBytes = 16 * 1024 * 1024) {
  return readPrivateBytes(path, maxBytes).bytes.toString("utf8");
}
function readPrivateBytes(path, maxBytes = 16 * 1024 * 1024) {
  const fd = openSync(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | (constants.O_NONBLOCK ?? 0)
  );
  try {
    const info = fstatSync(fd);
    if (!info.isFile()) throw new UnsafePathError();
    if (info.size > maxBytes) throw new UnsafePathError("FILE_TOO_LARGE");
    return { bytes: readFileSync(fd), mode: info.mode & 511 };
  } finally {
    closeSync(fd);
  }
}
function readPrivateFileIfExists(path, maxBytes) {
  try {
    return readPrivateFile(path, maxBytes);
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    if (error.code === "ELOOP")
      throw new UnsafePathError();
    throw error;
  }
}
function writePrivateFileAtomic(path, content, mode) {
  const temporary = `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    writeFileSync(temporary, content, { flag: "wx", mode: 384 });
    if (mode !== void 0) chmodSync(temporary, mode);
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}
function removeFile(path) {
  rmSync(path, { force: true });
}
function listFiles(path) {
  try {
    assertRealDirectory(path);
    return readdirSync(path).sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
function captureAgreementPath() {
  return join(memrootConfigDir(), "capture-agreement.json");
}

// src/capture/consent.ts
var CAPTURE_AGENTS = ["claude", "codex", "grok"];
var CONSENT_TEXT_VERSION = "capture-consent-v2";
var MAX_ITEMS_PER_CAPTURE_LIMIT = 50;
var MAX_ITEMS_PER_24H_LIMIT = 2500;
var PREVIOUS_MAX_ITEMS_PER_24H_LIMIT = 500;
var KEYS = [
  "schemaVersion",
  "enabled",
  "enabledAt",
  "consentTextVersion",
  "apiBase",
  "agents",
  "crossAgentExtraction",
  "includeHeadlessSessions",
  "maxItemsPerSession",
  "maxItemsPerDay",
  "models"
];
var MODEL = /^[A-Za-z0-9._:/@+-]{1,128}$/;
function isInt(value, min, max) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
function parseConsent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return void 0;
  const record = value;
  const keys = Object.keys(record);
  if (keys.some((key) => !KEYS.includes(key)) || keys.length !== KEYS.length)
    return void 0;
  const agents2 = record.agents;
  const models = record.models;
  if (record.schemaVersion !== 1 || typeof record.enabled !== "boolean" || typeof record.enabledAt !== "string" || Number.isNaN(Date.parse(record.enabledAt)) || record.consentTextVersion !== CONSENT_TEXT_VERSION || typeof record.apiBase !== "string" || !isAllowedApiBase(record.apiBase) || record.apiBase.endsWith("/") || !Array.isArray(agents2) || agents2.length === 0 || agents2.length > CAPTURE_AGENTS.length || new Set(agents2).size !== agents2.length || agents2.some((agent) => !CAPTURE_AGENTS.includes(agent)) || typeof record.crossAgentExtraction !== "boolean" || typeof record.includeHeadlessSessions !== "boolean" || !isInt(record.maxItemsPerSession, 1, 5) || !isInt(record.maxItemsPerDay, 1, 20) || !models || typeof models !== "object" || Array.isArray(models))
    return void 0;
  const modelRecord = models;
  const modelKeys = Object.keys(modelRecord);
  if (modelKeys.length !== CAPTURE_AGENTS.length || modelKeys.some((key) => !CAPTURE_AGENTS.includes(key)) || Object.values(modelRecord).some(
    (model) => model !== null && (typeof model !== "string" || !MODEL.test(model))
  ))
    return void 0;
  return record;
}
function readConsent() {
  let raw;
  try {
    raw = readPrivateFileIfExists(consentPath(), 64 * 1024);
  } catch {
    return { kind: "invalid" };
  }
  if (raw === void 0) return { kind: "absent" };
  try {
    const consent = parseConsent(JSON.parse(raw));
    return consent ? { kind: "ok", consent } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}
function activeConsentFor(agent) {
  const read = readConsent();
  if (read.kind !== "ok") return void 0;
  return read.consent.enabled && read.consent.agents.includes(agent) ? read.consent : void 0;
}
var CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v6";
var PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION = "capture-consent-v5";
function currentAgreement(consent) {
  if (!consent.enabled) return void 0;
  try {
    const raw = readPrivateFileIfExists(captureAgreementPath(), 4 * 1024);
    if (raw === void 0) return void 0;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 6 || value.schemaVersion !== 1 || value.consentTextVersion !== CAPTURE_AGREEMENT_TEXT_VERSION && value.consentTextVersion !== PREVIOUS_CAPTURE_AGREEMENT_TEXT_VERSION || value.consentEnabledAt !== consent.enabledAt || typeof value.capturingSince !== "string" || Number.isNaN(Date.parse(value.capturingSince)) || !isInt(value.maxItemsPerCapture, 1, MAX_ITEMS_PER_CAPTURE_LIMIT) || !isInt(
      value.maxItemsPerDay,
      1,
      value.consentTextVersion === CAPTURE_AGREEMENT_TEXT_VERSION ? MAX_ITEMS_PER_24H_LIMIT : PREVIOUS_MAX_ITEMS_PER_24H_LIMIT
    ))
      return void 0;
    return value;
  } catch {
    return void 0;
  }
}
function activeAgreementFor(agent) {
  const consent = activeConsentFor(agent);
  if (!consent) return void 0;
  const agreement = currentAgreement(consent);
  return agreement ? { consent, agreement } : void 0;
}

// src/capture/hooks/spawn.ts
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname as dirname2, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
function spawnWorker() {
  try {
    const here = dirname2(fileURLToPath(import.meta.url));
    const sibling = join2(here, "capture-worker.mjs");
    const worker = existsSync(sibling) ? sibling : join2(here, "plugins", "claude", "scripts", "capture-worker.mjs");
    if (!existsSync(worker)) return;
    const child = spawn(process.execPath, [worker], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, MEMROOT_CAPTURE_WORKER: "1" }
    });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
}

// src/capture/queue/job.ts
import { join as join7 } from "node:path";

// src/project/context.ts
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname5, join as join6 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/project/folders.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { lstatSync as lstatSync4, readFileSync as readFileSync3, realpathSync } from "node:fs";
import {
  basename,
  dirname as dirname4,
  isAbsolute as isAbsolute2,
  join as join5,
  normalize as normalize2,
  relative,
  resolve,
  sep
} from "node:path";

// src/state/config-store.ts
import { randomBytes as randomBytes2 } from "node:crypto";
import {
  closeSync as closeSync2,
  fchmodSync,
  fsyncSync,
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  openSync as openSync2,
  readFileSync as readFileSync2,
  renameSync as renameSync2,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2,
  writeSync
} from "node:fs";
import { dirname as dirname3, join as join3 } from "node:path";
var LOCK_STALE_MS = 5e3;
var LOCK_TRIES = 40;
var TMP_STALE_MS = 6e4;
function pause(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function withConfigLock(fileName, update3) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname3(directory), false);
  const lock = `${join3(directory, fileName)}.lock`;
  const nonce = randomBytes2(8).toString("hex");
  const owner = join3(lock, "owner");
  let held2 = false;
  for (let i2 = 0; i2 < LOCK_TRIES && !held2; i2++) {
    try {
      mkdirSync2(lock, { mode: 448 });
      writeFileSync2(owner, nonce, { mode: 384 });
      held2 = true;
    } catch (error) {
      if (error.code !== "EEXIST") break;
      try {
        if (Date.now() - lstatSync2(lock).mtimeMs > LOCK_STALE_MS)
          rmSync2(lock, { recursive: true, force: true });
      } catch {
      }
      pause(25);
    }
  }
  try {
    return update3();
  } finally {
    if (held2)
      try {
        if (readFileSync2(owner, "utf8") === nonce)
          rmSync2(lock, { recursive: true, force: true });
      } catch {
      }
  }
}
function persistConfigJson(fileName, value) {
  const directory = memrootConfigDir();
  ensurePrivateDir(directory, dirname3(directory), false);
  const path = join3(directory, fileName);
  try {
    const now = Date.now();
    for (const name of listFiles(directory))
      if (name.startsWith(`${fileName}.`) && name.endsWith(".tmp"))
        try {
          if (now - lstatSync2(join3(directory, name)).mtimeMs > TMP_STALE_MS)
            rmSync2(join3(directory, name), { force: true });
        } catch {
        }
  } catch {
  }
  const temporary = `${path}.${process.pid}.${randomBytes2(4).toString("hex")}.tmp`;
  try {
    const fd = openSync2(temporary, "wx", 384);
    try {
      fchmodSync(fd, 384);
      writeSync(fd, `${JSON.stringify(value, null, 2)}
`);
      fsyncSync(fd);
    } finally {
      closeSync2(fd);
    }
    for (let attempt = 0; ; attempt++)
      try {
        renameSync2(temporary, path);
        break;
      } catch (error) {
        const code = error.code;
        if (attempt >= 5 || code !== "EPERM" && code !== "EBUSY") throw error;
        pause(20);
      }
  } finally {
    rmSync2(temporary, { force: true });
  }
}

// src/project/selection.ts
import { randomUUID } from "node:crypto";
import { lstatSync as lstatSync3, renameSync as renameSync3 } from "node:fs";
import { join as join4 } from "node:path";
var PROJECT_SELECTION_FILE = "project-selection.json";
var MAX_FILE_BYTES = 256 * 1024;
var MAX_RECORDS = 64;
var UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectSelectionPath() {
  return join4(memrootConfigDir(), PROJECT_SELECTION_FILE);
}
function normalizeApiBase(apiBase) {
  try {
    const url = new URL(apiBase);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return apiBase.replace(/\/+$/, "");
  }
}
function selectionKey(apiBase, principalId) {
  return `${normalizeApiBase(apiBase)}|${principalId.toLowerCase()}`;
}
function withLock(update3) {
  return withConfigLock(PROJECT_SELECTION_FILE, update3);
}
function persist(store) {
  persistConfigJson(PROJECT_SELECTION_FILE, {
    schemaVersion: 1,
    selections: store
  });
}
function valid(value) {
  const v = value;
  return !!v && typeof v === "object" && typeof v.apiBase === "string" && isAllowedApiBase(v.apiBase) && !v.apiBase.endsWith("/") && UUID.test(String(v.principalId)) && UUID.test(String(v.tenantId)) && UUID.test(String(v.projectId)) && typeof v.name === "string" && v.name.length > 0 && v.name.length <= 256 && UUID.test(String(v.selectionId)) && typeof v.selectedAt === "string" && !Number.isNaN(Date.parse(v.selectedAt)) && (v.source === "explicit" || v.source === "sole_project");
}
function readStore() {
  try {
    const raw = readPrivateFileIfExists(projectSelectionPath(), MAX_FILE_BYTES);
    if (raw === void 0) return {};
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.selections || typeof value.selections !== "object" || Array.isArray(value.selections))
      return {};
    const out = {};
    for (const [key, entry] of Object.entries(
      value.selections
    ))
      if (valid(entry) && key === selectionKey(entry.apiBase, entry.principalId))
        out[key] = entry;
    return out;
  } catch {
    return {};
  }
}
function readSelection(apiBase, principalId) {
  if (!principalId) return void 0;
  const key = selectionKey(apiBase, principalId);
  const found = readStore()[key];
  if (found) return found;
  migrateLegacyDefaults();
  return readStore()[key];
}
var LEGACY_DEFAULTS = "project-defaults.json";
function migrateLegacyDefaults() {
  const legacy = join4(memrootConfigDir(), LEGACY_DEFAULTS);
  try {
    lstatSync3(legacy);
  } catch {
    return false;
  }
  try {
    return withLock(() => {
      let raw;
      try {
        raw = readPrivateFileIfExists(legacy, MAX_FILE_BYTES);
      } catch {
        raw = void 0;
      }
      if (raw === void 0) return false;
      const store = readStore();
      let adopted = 0;
      try {
        const value = JSON.parse(raw);
        const newest = /* @__PURE__ */ new Map();
        if (value?.schemaVersion === 1 && value.defaults)
          for (const d of Object.values(value.defaults)) {
            if (!d || typeof d.apiBase !== "string" || typeof d.userId !== "string" || d.principalId !== d.userId || typeof d.updatedAt !== "string")
              continue;
            const key = selectionKey(d.apiBase, d.userId);
            const prior = newest.get(key);
            if (!prior || String(prior.updatedAt) < d.updatedAt)
              newest.set(key, d);
          }
        for (const [key, d] of newest)
          if (!store[key])
            try {
              upsert(store, {
                apiBase: String(d.apiBase),
                principalId: String(d.principalId),
                tenantId: String(d.tenantId),
                projectId: String(d.projectId),
                name: String(d.name || d.projectId),
                source: "explicit"
              });
              adopted++;
            } catch {
            }
      } catch {
      }
      if (adopted > 0) persist(store);
      renameSync3(legacy, `${legacy}.migrated`);
      return true;
    });
  } catch {
    return false;
  }
}
function upsert(store, input) {
  const key = selectionKey(input.apiBase, input.principalId);
  const prior = store[key];
  const same = prior?.projectId === input.projectId && prior.tenantId === input.tenantId;
  const record = {
    apiBase: normalizeApiBase(input.apiBase),
    principalId: input.principalId.toLowerCase(),
    tenantId: input.tenantId,
    projectId: input.projectId,
    name: input.name,
    selectionId: input.selectionId ?? (same && prior ? prior.selectionId : randomUUID()),
    selectedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: input.source
  };
  if (!valid(record))
    throw new Error("PROJECT_SELECTION_INVALID: Refusing an invalid record.");
  store[key] = record;
  const keys = Object.keys(store);
  if (keys.length > MAX_RECORDS)
    for (const old of keys.sort(
      (x, y) => (store[x]?.selectedAt ?? "").localeCompare(store[y]?.selectedAt ?? "")
    ).slice(0, keys.length - MAX_RECORDS))
      delete store[old];
  return record;
}
function writeSelection(input) {
  return withLock(() => {
    const store = readStore();
    const record = upsert(store, input);
    persist(store);
    return record;
  });
}
function clearSelection(apiBase, principalId, onlyProjectId) {
  withLock(() => {
    const store = readStore();
    const key = selectionKey(apiBase, principalId);
    const prior = store[key];
    if (!prior) return;
    if (onlyProjectId !== void 0 && prior.projectId !== onlyProjectId)
      return;
    delete store[key];
    persist(store);
  });
}

// src/project/folders.ts
var PROJECT_FOLDERS_FILE = "project-folders.json";
var MAX_BINDINGS = 256;
var MAX_FILE_BYTES2 = 512 * 1024;
var MAX_ACCOUNTS = 64;
var MAX_PATH = 4096;
var MAX_WALK = 128;
var UUID2 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function projectFoldersPath() {
  return join5(memrootConfigDir(), PROJECT_FOLDERS_FILE);
}
var FOLD_CASE = process.platform === "win32";
function folderContains(folder, path, options) {
  const a2 = options.foldCase ? folder.toLowerCase() : folder;
  const b = options.foldCase ? path.toLowerCase() : path;
  if (a2 === b) return true;
  const prefix = a2.endsWith(options.separator) ? a2 : `${a2}${options.separator}`;
  return b.startsWith(prefix);
}
function applicableBinding(bindings, scope, options) {
  const same = (a2, b) => options.foldCase ? a2.toLowerCase() === b.toLowerCase() : a2 === b;
  const chains = [
    { root: scope.top, path: scope.cwd, mapped: false },
    ...scope.main ? [{ ...scope.main, mapped: true }] : []
  ];
  let best;
  for (const chain of chains)
    for (const binding of bindings) {
      const root = chain.root;
      if (root !== void 0 && !folderContains(root, binding.folder, options) || !folderContains(binding.folder, chain.path, options))
        continue;
      const depth = binding.folder.length - (root?.length ?? 0);
      if (best && depth <= best.depth) continue;
      const atRoot = root !== void 0 && same(binding.folder, root);
      const via = chain.mapped ? atRoot ? "main_checkout" : "main_checkout_folder" : same(binding.folder, scope.cwd) ? "folder" : root === void 0 ? "parent_folder" : atRoot ? "repo_root" : "repo_folder";
      best = { binding, via, depth };
    }
  return best && { binding: best.binding, via: best.via };
}
var match = { foldCase: FOLD_CASE, separator: sep };
function canonicalFolder(path) {
  const absolute = normalize2(resolve(path));
  let head = absolute;
  for (let i2 = 0; i2 < MAX_WALK; i2++) {
    try {
      const real = realpathSync.native(head);
      const rest = relative(head, absolute);
      return rest ? join5(real, rest) : real;
    } catch {
      const parent = dirname4(head);
      if (parent === head) break;
      head = parent;
    }
  }
  return absolute;
}
function smallFile(path) {
  try {
    const info = lstatSync4(path);
    if (!info.isFile() || info.size > 4096) return void 0;
    return readFileSync3(path, "utf8");
  } catch {
    return void 0;
  }
}
function folderScope(real) {
  for (let dir = real, i2 = 0; i2 < MAX_WALK; i2++) {
    const dotGit = join5(dir, ".git");
    let info;
    try {
      info = lstatSync4(dotGit);
    } catch {
      info = void 0;
    }
    if (info) {
      const root = info.isFile() ? worktreeMain(dir, dotGit) : void 0;
      if (!root) return { cwd: real, top: dir };
      const rest = relative(dir, real);
      return {
        cwd: real,
        top: dir,
        main: { root, path: rest ? join5(root, rest) : root }
      };
    }
    const parent = dirname4(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { cwd: real };
}
function worktreeMain(dir, dotGit) {
  const pointer = /^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(smallFile(dotGit) ?? "");
  if (!pointer?.[1]) return void 0;
  const gitdir = resolve(dir, pointer[1]);
  if (basename(dirname4(gitdir)) !== "worktrees") return void 0;
  const back = smallFile(join5(gitdir, "gitdir"))?.trim();
  if (!back) return void 0;
  try {
    if (realpathSync.native(resolve(gitdir, back)) !== realpathSync.native(dotGit))
      return void 0;
  } catch {
    return void 0;
  }
  const common = smallFile(join5(gitdir, "commondir"))?.trim();
  if (!common) return void 0;
  let commonDir;
  try {
    commonDir = realpathSync.native(resolve(gitdir, common));
  } catch {
    return void 0;
  }
  if (basename(commonDir) !== ".git") return void 0;
  return dirname4(commonDir);
}
function bindingFolder(path) {
  const scope = folderScope(canonicalFolder(path));
  const folder = scope.main?.path ?? scope.cwd;
  const root = scope.main?.root ?? scope.top;
  return {
    folder,
    mapped: !!scope.main,
    covers: !root ? "folder" : sameFolder(folder, root) ? "repository" : "subtree"
  };
}
function validBinding(value) {
  const v = value;
  return !!v && typeof v === "object" && typeof v.folder === "string" && isAbsolute2(v.folder) && v.folder.length <= MAX_PATH && !v.folder.includes("\0") && UUID2.test(String(v.tenantId)) && UUID2.test(String(v.projectId)) && typeof v.name === "string" && v.name.length > 0 && v.name.length <= 256 && UUID2.test(String(v.bindingId)) && typeof v.boundAt === "string" && !Number.isNaN(Date.parse(v.boundAt)) && (v.stale === void 0 || v.stale === true);
}
function validKey(key) {
  const at = key.lastIndexOf("|");
  return at > 0 && isAllowedApiBase(key.slice(0, at)) && UUID2.test(key.slice(at + 1)) && key === selectionKey(key.slice(0, at), key.slice(at + 1));
}
function readStore2(strictKey) {
  try {
    const raw = readPrivateFileIfExists(projectFoldersPath(), MAX_FILE_BYTES2);
    if (raw === void 0) return {};
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.bindings || typeof value.bindings !== "object" || Array.isArray(value.bindings))
      throw new Error("INVALID_PROJECT_FOLDER_STORE");
    const out = {};
    for (const [key, list] of Object.entries(
      value.bindings
    )) {
      if (key === strictKey && (!Array.isArray(list) || list.length > MAX_BINDINGS || !list.every(validBinding)))
        throw new Error("INVALID_PROJECT_FOLDER_STORE");
      if (validKey(key) && Array.isArray(list))
        out[key] = list.filter(validBinding).slice(0, MAX_BINDINGS);
    }
    return out;
  } catch (error) {
    if (strictKey !== void 0) throw error;
    return {};
  }
}
function update(change) {
  return withConfigLock(PROJECT_FOLDERS_FILE, () => {
    const store = readStore2();
    const result = change(store);
    for (const key of Object.keys(store))
      if (store[key]?.length === 0) delete store[key];
    const keys = Object.keys(store);
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ACCOUNTS)))
      delete store[key];
    persistConfigJson(PROJECT_FOLDERS_FILE, {
      schemaVersion: 1,
      bindings: store
    });
    return result;
  });
}
var sameFolder = (a2, b) => FOLD_CASE ? a2.toLowerCase() === b.toLowerCase() : a2 === b;
function readBindings(apiBase, principalId, { requireValid = false } = {}) {
  if (!principalId) return [];
  const key = selectionKey(apiBase, principalId);
  return readStore2(requireValid ? key : void 0)[key] ?? [];
}
function bindingMatchFor(apiBase, principalId, cwd) {
  const bindings = readBindings(apiBase, principalId);
  if (bindings.length === 0) return void 0;
  return applicableBinding(bindings, folderScope(canonicalFolder(cwd)), match);
}
function bindingFor(apiBase, principalId, cwd) {
  return bindingMatchFor(apiBase, principalId, cwd)?.binding;
}
function bindFolder(input) {
  return update((store) => {
    const key = selectionKey(input.apiBase, input.principalId);
    const list = store[key] ?? [];
    const prior = list.find((b) => sameFolder(b.folder, input.folder));
    const same = prior?.projectId === input.projectId && prior.tenantId === input.tenantId;
    const binding = {
      folder: input.folder,
      tenantId: input.tenantId,
      projectId: input.projectId,
      name: input.name,
      bindingId: same && prior ? prior.bindingId : randomUUID2(),
      boundAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!validBinding(binding))
      throw new Error("PROJECT_FOLDER_INVALID: Refusing an invalid binding.");
    const rest = list.filter((b) => b !== prior);
    if (rest.length >= MAX_BINDINGS)
      throw new Error(
        `PROJECT_FOLDER_LIMIT: At most ${MAX_BINDINGS} folders can be bound; remove one with unbind --folder.`
      );
    store[key] = [...rest, binding];
    return binding;
  });
}
function unbindFolder(apiBase, principalId, folder) {
  return update((store) => {
    const key = selectionKey(apiBase, principalId);
    const list = store[key] ?? [];
    const found = list.find((b) => sameFolder(b.folder, folder));
    if (found) store[key] = list.filter((b) => b !== found);
    return found;
  });
}
function refreshBindings(apiBase, principalId, tenantId, projects) {
  const key = selectionKey(apiBase, principalId);
  const changes = (list) => list.map((b) => {
    const live = projects.find((p) => p.project_id === b.projectId);
    if (!live) return b.stale ? b : { ...b, stale: true };
    const name = live.name ?? b.name;
    if (!b.stale && name === b.name && b.tenantId === tenantId) return b;
    const { stale: _stale, ...rest } = b;
    return { ...rest, name, tenantId };
  });
  const before = readStore2()[key] ?? [];
  if (changes(before).every(
    (b, i2) => b.stale === before[i2]?.stale && b.name === before[i2]?.name && b.tenantId === before[i2]?.tenantId
  ))
    return;
  update((store) => {
    if (store[key]) store[key] = changes(store[key]);
  });
}
function folderMissing(folder) {
  try {
    return !lstatSync4(folder).isDirectory();
  } catch {
    return true;
  }
}

// src/project/context.ts
var UUID3 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function validUuid(value) {
  return typeof value === "string" && UUID3.test(value);
}
function projectCommandPrefix() {
  try {
    const here = dirname5(fileURLToPath2(import.meta.url));
    const script = join6(here, "project.mjs");
    if (existsSync2(script) && !/["\\$`\n]/.test(script))
      return `node "${script}"`;
  } catch {
  }
  return `npx -y memroot@${"0.23.1"} project`;
}
function folderOption(folder) {
  return /["\\$`\r\n]/.test(folder) || folder.length > 1024 ? "--here" : `--folder "${folder}"`;
}
function legacySessionRecordsDir() {
  return join6(stateDir(), "project-sessions");
}

// src/capture/queue/job.ts
var JOB_TTL_MS = 72 * 60 * 60 * 1e3;
var JOB_ID = /^(claude|codex|grok)-[a-f0-9]{32}$/;
function queueDir() {
  return stateSubdir("queue");
}
var conflictPath = (jobId) => join7(queueDir(), `${jobId}.account-conflict`);
function hasAccountConflict(jobId) {
  const marker = readPrivateFileIfExists(conflictPath(jobId), 64);
  if (marker === void 0) return false;
  const at = Date.parse(marker);
  if (Number.isFinite(at) && Date.now() - at > JOB_TTL_MS) {
    removeFile(conflictPath(jobId));
    return false;
  }
  return true;
}
function listJobIds() {
  const names = listFiles(queueDir());
  for (const name of names) {
    const id = name.slice(0, -".account-conflict".length);
    if (name.endsWith(".account-conflict") && JOB_ID.test(id))
      hasAccountConflict(id);
  }
  return names.filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5)).filter((id) => JOB_ID.test(id));
}

// src/connection/auth.ts
import { spawn as spawn2 } from "node:child_process";
import { createHash, randomBytes as randomBytes4 } from "node:crypto";
import { mkdtempSync, rmSync as rmSync4, writeFileSync as writeFileSync4 } from "node:fs";
import { createServer, request as httpRequest2 } from "node:http";
import { request as httpsRequest2 } from "node:https";
import { tmpdir } from "node:os";
import { join as join13 } from "node:path";

// ../../node_modules/.pnpm/@clack+core@1.6.0/node_modules/@clack/core/dist/index.mjs
import { stdout, stdin } from "node:process";
import f__default from "node:readline";

// ../../node_modules/.pnpm/fast-string-truncated-width@3.0.3/node_modules/fast-string-truncated-width/dist/utils.js
var getCodePointsLength = /* @__PURE__ */ (() => {
  const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  return (input) => {
    let surrogatePairsNr = 0;
    SURROGATE_PAIR_RE.lastIndex = 0;
    while (SURROGATE_PAIR_RE.test(input)) {
      surrogatePairsNr += 1;
    }
    return input.length - surrogatePairsNr;
  };
})();
var isFullWidth = (x) => {
  return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
};
var isWideNotCJKTNotEmoji = (x) => {
  return x === 8987 || x === 9001 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
};

// ../../node_modules/.pnpm/fast-string-truncated-width@3.0.3/node_modules/fast-string-truncated-width/dist/index.js
var ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c)/y;
var CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var CJKT_WIDE_RE = /(?:(?![\uFF61-\uFF9F\uFF00-\uFFEF])[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Tangut}]){1,1000}/yu;
var TAB_RE = /\t{1,1000}/y;
var EMOJI_RE = new RegExp("[\\u{1F1E6}-\\u{1F1FF}]{2}|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}|(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation})(?:\\u200D(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F\\u20E3?))*", "yu");
var LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var MODIFIER_RE = new RegExp("\\p{M}+", "gu");
var NO_TRUNCATION = { limit: Infinity, ellipsis: "" };
var getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
  const LIMIT = truncationOptions.limit ?? Infinity;
  const ELLIPSIS = truncationOptions.ellipsis ?? "";
  const ELLIPSIS_WIDTH = truncationOptions?.ellipsisWidth ?? (ELLIPSIS ? getStringTruncatedWidth(ELLIPSIS, NO_TRUNCATION, widthOptions).width : 0);
  const ANSI_WIDTH = 0;
  const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
  const TAB_WIDTH = widthOptions.tabWidth ?? 8;
  const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
  const FULL_WIDTH_WIDTH = 2;
  const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
  const WIDE_WIDTH = widthOptions.wideWidth ?? FULL_WIDTH_WIDTH;
  const PARSE_BLOCKS = [
    [LATIN_RE, REGULAR_WIDTH],
    [ANSI_RE, ANSI_WIDTH],
    [CONTROL_RE, CONTROL_WIDTH],
    [TAB_RE, TAB_WIDTH],
    [EMOJI_RE, EMOJI_WIDTH],
    [CJKT_WIDE_RE, WIDE_WIDTH]
  ];
  let indexPrev = 0;
  let index = 0;
  let length = input.length;
  let lengthExtra = 0;
  let truncationEnabled = false;
  let truncationIndex = length;
  let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH);
  let unmatchedStart = 0;
  let unmatchedEnd = 0;
  let width = 0;
  let widthExtra = 0;
  outer: while (true) {
    if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
      const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
      lengthExtra = 0;
      for (const char of unmatched.replaceAll(MODIFIER_RE, "")) {
        const codePoint = char.codePointAt(0) || 0;
        if (isFullWidth(codePoint)) {
          widthExtra = FULL_WIDTH_WIDTH;
        } else if (isWideNotCJKTNotEmoji(codePoint)) {
          widthExtra = WIDE_WIDTH;
        } else {
          widthExtra = REGULAR_WIDTH;
        }
        if (width + widthExtra > truncationLimit) {
          truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
        }
        if (width + widthExtra > LIMIT) {
          truncationEnabled = true;
          break outer;
        }
        lengthExtra += char.length;
        width += widthExtra;
      }
      unmatchedStart = unmatchedEnd = 0;
    }
    if (index >= length) {
      break outer;
    }
    for (let i2 = 0, l = PARSE_BLOCKS.length; i2 < l; i2++) {
      const [BLOCK_RE, BLOCK_WIDTH] = PARSE_BLOCKS[i2];
      BLOCK_RE.lastIndex = index;
      if (BLOCK_RE.test(input)) {
        lengthExtra = BLOCK_RE === CJKT_WIDE_RE ? getCodePointsLength(input.slice(index, BLOCK_RE.lastIndex)) : BLOCK_RE === EMOJI_RE ? 1 : BLOCK_RE.lastIndex - index;
        widthExtra = lengthExtra * BLOCK_WIDTH;
        if (width + widthExtra > truncationLimit) {
          truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / BLOCK_WIDTH));
        }
        if (width + widthExtra > LIMIT) {
          truncationEnabled = true;
          break outer;
        }
        width += widthExtra;
        unmatchedStart = indexPrev;
        unmatchedEnd = index;
        index = indexPrev = BLOCK_RE.lastIndex;
        continue outer;
      }
    }
    index += 1;
  }
  return {
    width: truncationEnabled ? truncationLimit : width,
    index: truncationEnabled ? truncationIndex : length,
    truncated: truncationEnabled,
    ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH
  };
};
var dist_default = getStringTruncatedWidth;

// ../../node_modules/.pnpm/fast-string-width@3.0.2/node_modules/fast-string-width/dist/index.js
var NO_TRUNCATION2 = {
  limit: Infinity,
  ellipsis: "",
  ellipsisWidth: 0
};
var fastStringWidth = (input, options = {}) => {
  return dist_default(input, NO_TRUNCATION2, options).width;
};
var dist_default2 = fastStringWidth;

// ../../node_modules/.pnpm/fast-wrap-ansi@0.2.2/node_modules/fast-wrap-ansi/lib/main.js
var ESC = "\x1B";
var CSI = "\x9B";
var END_CODE = 39;
var ANSI_ESCAPE_BELL = "\x07";
var ANSI_CSI = "[";
var ANSI_OSC = "]";
var ANSI_SGR_TERMINATOR = "m";
var ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
var GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
var getClosingCode = (openingCode) => {
  if (openingCode >= 30 && openingCode <= 37)
    return 39;
  if (openingCode >= 90 && openingCode <= 97)
    return 39;
  if (openingCode >= 40 && openingCode <= 47)
    return 49;
  if (openingCode >= 100 && openingCode <= 107)
    return 49;
  if (openingCode === 1 || openingCode === 2)
    return 22;
  if (openingCode === 3)
    return 23;
  if (openingCode === 4)
    return 24;
  if (openingCode === 7)
    return 27;
  if (openingCode === 8)
    return 28;
  if (openingCode === 9)
    return 29;
  if (openingCode === 0)
    return 0;
  return void 0;
};
var wrapAnsiCode = (code) => `${ESC}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
var wrapAnsiHyperlink = (url) => `${ESC}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
var wrapWord = (rows, word, columns) => {
  const characters = word[Symbol.iterator]();
  let isInsideEscape = false;
  let isInsideLinkEscape = false;
  let lastRow = rows.at(-1);
  let visible = lastRow === void 0 ? 0 : dist_default2(lastRow);
  let currentCharacter = characters.next();
  let nextCharacter = characters.next();
  let rawCharacterIndex = 0;
  while (!currentCharacter.done) {
    const character = currentCharacter.value;
    const characterLength = dist_default2(character);
    if (visible + characterLength <= columns) {
      rows[rows.length - 1] += character;
    } else {
      rows.push(character);
      visible = 0;
    }
    if (character === ESC || character === CSI) {
      isInsideEscape = true;
      isInsideLinkEscape = word.startsWith(ANSI_ESCAPE_LINK, rawCharacterIndex + 1);
    }
    if (isInsideEscape) {
      if (isInsideLinkEscape) {
        if (character === ANSI_ESCAPE_BELL) {
          isInsideEscape = false;
          isInsideLinkEscape = false;
        }
      } else if (character === ANSI_SGR_TERMINATOR) {
        isInsideEscape = false;
      }
    } else {
      visible += characterLength;
      if (visible === columns && !nextCharacter.done) {
        rows.push("");
        visible = 0;
      }
    }
    currentCharacter = nextCharacter;
    nextCharacter = characters.next();
    rawCharacterIndex += character.length;
  }
  lastRow = rows.at(-1);
  if (!visible && lastRow !== void 0 && lastRow.length && rows.length > 1) {
    rows[rows.length - 2] += rows.pop();
  }
};
var stringVisibleTrimSpacesRight = (string) => {
  const words = string.split(" ");
  let last = words.length;
  while (last) {
    if (dist_default2(words[last - 1])) {
      break;
    }
    last--;
  }
  if (last === words.length) {
    return string;
  }
  return words.slice(0, last).join(" ") + words.slice(last).join("");
};
var exec = (string, columns, options = {}) => {
  if (options.trim !== false && string.trim() === "") {
    return "";
  }
  let returnValue = "";
  let escapeCode;
  let escapeUrl;
  const words = string.split(" ");
  let rows = [""];
  let rowLength = 0;
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    if (options.trim !== false) {
      const row = rows.at(-1) ?? "";
      const trimmed = row.trimStart();
      if (row.length !== trimmed.length) {
        rows[rows.length - 1] = trimmed;
        rowLength = dist_default2(trimmed);
      }
    }
    if (index !== 0) {
      if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
        rows.push("");
        rowLength = 0;
      }
      if (rowLength || options.trim === false) {
        rows[rows.length - 1] += " ";
        rowLength++;
      }
    }
    const wordLength = dist_default2(word);
    if (options.hard && wordLength > columns) {
      const remainingColumns = columns - rowLength;
      const breaksStartingThisLine = 1 + Math.floor((wordLength - remainingColumns - 1) / columns);
      const breaksStartingNextLine = Math.floor((wordLength - 1) / columns);
      if (breaksStartingNextLine < breaksStartingThisLine) {
        rows.push("");
      }
      wrapWord(rows, word, columns);
      rowLength = dist_default2(rows.at(-1) ?? "");
      continue;
    }
    if (rowLength + wordLength > columns && rowLength && wordLength) {
      if (options.wordWrap === false && rowLength < columns) {
        wrapWord(rows, word, columns);
        rowLength = dist_default2(rows.at(-1) ?? "");
        continue;
      }
      rows.push("");
      rowLength = 0;
    }
    if (rowLength + wordLength > columns && options.wordWrap === false) {
      wrapWord(rows, word, columns);
      rowLength = dist_default2(rows.at(-1) ?? "");
      continue;
    }
    rows[rows.length - 1] += word;
    rowLength += wordLength;
  }
  if (options.trim !== false) {
    rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
  }
  const preString = rows.join("\n");
  let inSurrogate = false;
  for (let i2 = 0; i2 < preString.length; i2++) {
    const character = preString[i2];
    returnValue += character;
    if (!inSurrogate) {
      inSurrogate = character >= "\uD800" && character <= "\uDBFF";
      if (inSurrogate) {
        continue;
      }
    } else {
      inSurrogate = false;
    }
    if (character === ESC || character === CSI) {
      GROUP_REGEX.lastIndex = i2 + 1;
      const groupsResult = GROUP_REGEX.exec(preString);
      const groups = groupsResult?.groups;
      if (groups?.code !== void 0) {
        const code = Number.parseFloat(groups.code);
        escapeCode = code === END_CODE ? void 0 : code;
      } else if (groups?.uri !== void 0) {
        escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
      }
    }
    if (preString[i2 + 1] === "\n") {
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink("");
      }
      const closingCode = escapeCode ? getClosingCode(escapeCode) : void 0;
      if (escapeCode && closingCode) {
        returnValue += wrapAnsiCode(closingCode);
      }
    } else if (character === "\n") {
      if (escapeCode && getClosingCode(escapeCode)) {
        returnValue += wrapAnsiCode(escapeCode);
      }
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink(escapeUrl);
      }
    }
  }
  return returnValue;
};
var CRLF_OR_LF = /\r?\n/;
function wrapAnsi(string, columns, options) {
  return String(string).normalize().split(CRLF_OR_LF).map((line) => exec(line, columns, options)).join("\n");
}

// ../../node_modules/.pnpm/sisteransi@2.0.0/node_modules/sisteransi/dist/index.js
var ESC2 = "\x1B";
var CSI2 = `${ESC2}[`;
var cursor = {
  to(x, y) {
    if (!y)
      return `${CSI2}${x + 1}G`;
    return `${CSI2}${y + 1};${x + 1}H`;
  },
  move(x, y) {
    let ret = "";
    if (x < 0)
      ret += `${CSI2}${-x}D`;
    else if (x > 0)
      ret += `${CSI2}${x}C`;
    if (y < 0)
      ret += `${CSI2}${-y}A`;
    else if (y > 0)
      ret += `${CSI2}${y}B`;
    return ret;
  },
  up: (count = 1) => `${CSI2}${count}A`,
  down: (count = 1) => `${CSI2}${count}B`,
  forward: (count = 1) => `${CSI2}${count}C`,
  backward: (count = 1) => `${CSI2}${count}D`,
  nextLine: (count = 1) => `${CSI2}E`.repeat(count),
  prevLine: (count = 1) => `${CSI2}F`.repeat(count),
  left: `${CSI2}G`,
  hide: `${CSI2}?25l`,
  show: `${CSI2}?25h`,
  save: `${ESC2}7`,
  restore: `${ESC2}8`
};
var erase = {
  screen: `${CSI2}2J`,
  up: (count = 1) => `${CSI2}1J`.repeat(count),
  down: (count = 1) => `${CSI2}J`.repeat(count),
  line: `${CSI2}2K`,
  lineEnd: `${CSI2}K`,
  lineStart: `${CSI2}1K`,
  lines(count) {
    let clear2 = "";
    for (let i2 = 0; i2 < count; i2++)
      clear2 += this.line + (i2 < count - 1 ? cursor.up() : "");
    if (count)
      clear2 += cursor.left;
    return clear2;
  }
};
var clear = {
  screen: `${ESC2}c`
};

// ../../node_modules/.pnpm/@clack+core@1.6.0/node_modules/@clack/core/dist/index.mjs
var a$1 = ["up", "down", "left", "right", "space", "enter", "cancel"];
var t = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var settings = {
  actions: new Set(a$1),
  aliases: /* @__PURE__ */ new Map([
    // vim support
    ["k", "up"],
    ["j", "down"],
    ["h", "left"],
    ["l", "right"],
    ["", "cancel"],
    // opinionated defaults!
    ["escape", "cancel"]
  ]),
  messages: {
    cancel: "Canceled",
    error: "Something went wrong"
  },
  withGuide: true,
  accessible: void 0,
  date: {
    monthNames: [...t],
    messages: {
      required: "Please enter a valid date",
      invalidMonth: "There are only 12 months in a year",
      invalidDay: (n2, e) => `There are only ${n2} days in ${e}`,
      afterMin: (n2) => `Date must be on or after ${n2.toISOString().slice(0, 10)}`,
      beforeMax: (n2) => `Date must be on or before ${n2.toISOString().slice(0, 10)}`
    }
  }
};
function isAccessible(n2) {
  if (n2 !== void 0) return n2;
  if (settings.accessible !== void 0) return settings.accessible;
  const e = process.env.ACCESSIBLE;
  return e !== void 0 && e !== "" && e !== "0" && e !== "false";
}
function isActionKey(n2, e) {
  if (typeof n2 == "string")
    return settings.aliases.get(n2) === e;
  for (const s of n2)
    if (s !== void 0 && isActionKey(s, e))
      return true;
  return false;
}
function diffLines(i2, s) {
  if (i2 === s) return;
  const e = i2.split(`
`), t2 = s.split(`
`), r2 = Math.max(e.length, t2.length), f = [];
  for (let n2 = 0; n2 < r2; n2++)
    e[n2] !== t2[n2] && f.push(n2);
  return {
    lines: f,
    numLinesBefore: e.length,
    numLinesAfter: t2.length,
    numLines: r2
  };
}
var R = globalThis.process.platform.startsWith("win");
var CANCEL_SYMBOL = /* @__PURE__ */ Symbol("clack:cancel");
function isCancel(e) {
  return e === CANCEL_SYMBOL;
}
function setRawMode(e, r2) {
  const o = e;
  o.isTTY && o.setRawMode(r2);
}
var getColumns = (e) => "columns" in e && typeof e.columns == "number" ? e.columns : 80;
var getRows = (e) => "rows" in e && typeof e.rows == "number" ? e.rows : 20;
function wrapTextWithPrefix(e, r2, o, n2 = o, s = o, t2) {
  const l = getColumns(e ?? stdout), i2 = dist_default2(o);
  return wrapAnsi(r2, l - i2, {
    hard: true,
    trim: false
  }).split(`
`).map((c2, a2, g) => {
    const m = t2 ? t2(c2, a2) : c2;
    return a2 === 0 ? `${n2}${m}` : a2 === g.length - 1 ? `${s}${m}` : `${o}${m}`;
  }).join(`
`);
}
function runValidation(e, a2) {
  if ("~standard" in e) {
    const n2 = e["~standard"].validate(a2);
    return n2 instanceof Promise ? n2.then((r2) => r2.issues?.at(0)?.message) : n2.issues?.at(0)?.message;
  }
  return e(a2);
}
var C$1 = class C {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = /* @__PURE__ */ new Map();
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  /**
   * Whether accessible (static, screen-reader friendly) output is enabled for
   * this prompt, resolved from the `accessible` option, the global setting,
   * and the `ACCESSIBLE` env var.
   */
  get accessible() {
    return isAccessible(this.opts.accessible);
  }
  constructor(t2, e = true) {
    const { input: i2 = stdin, output: s = stdout, render: r2, signal: n2, ...o } = t2;
    this.opts = o, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = r2.bind(this), this._track = e, this._abortSignal = n2, this.input = i2, this.output = s;
  }
  /**
   * Unsubscribe all listeners
   */
  unsubscribe() {
    this._subscribers.clear();
  }
  /**
   * Set a subscriber with opts
   * @param event - The event name
   */
  setSubscriber(t2, e) {
    const i2 = this._subscribers.get(t2) ?? [];
    i2.push(e), this._subscribers.set(t2, i2);
  }
  /**
   * Subscribe to an event
   * @param event - The event name
   * @param cb - The callback
   */
  on(t2, e) {
    this.setSubscriber(t2, { cb: e });
  }
  /**
   * Subscribe to an event once
   * @param event - The event name
   * @param cb - The callback
   */
  once(t2, e) {
    this.setSubscriber(t2, { cb: e, once: true });
  }
  /**
   * Emit an event with data
   * @param event - The event name
   * @param data - The data to pass to the callback
   */
  emit(t2, ...e) {
    const i2 = this._subscribers.get(t2) ?? [], s = [];
    for (const r2 of i2)
      r2.cb(...e), r2.once && s.push(() => i2.splice(i2.indexOf(r2), 1));
    for (const r2 of s)
      r2();
  }
  prompt() {
    return new Promise((t2) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), t2(CANCEL_SYMBOL);
        this._abortSignal.addEventListener(
          "abort",
          () => {
            this.state = "cancel", this.close();
          },
          { once: true }
        );
      }
      this.rl = f__default.createInterface({
        input: this.input,
        tabSize: 2,
        prompt: "",
        escapeCodeTimeout: 50,
        terminal: true
      }), this.rl.prompt(), this.opts.initialUserInput !== void 0 && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), setRawMode(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(this.value);
      }), this.once("cancel", () => {
        this.output.write(cursor.show), this.output.off("resize", this.render), setRawMode(this.input, false), t2(CANCEL_SYMBOL);
      });
    });
  }
  _isActionKey(t2, e) {
    return t2 === "	";
  }
  _shouldSubmit(t2, e) {
    return true;
  }
  _setValue(t2) {
    this.value = t2, this.emit("value", this.value);
  }
  _setUserInput(t2, e) {
    this.userInput = t2 ?? "", this.emit("userInput", this.userInput), e && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  async onKeypress(t2, e) {
    if (this.state !== "validating") {
      if (this._track && e.name !== "return" && (e.name && this._isActionKey(t2, e) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), e?.name && (!this._track && settings.aliases.has(e.name) && this.emit("cursor", settings.aliases.get(e.name)), settings.actions.has(e.name) && this.emit("cursor", e.name)), t2 && (t2.toLowerCase() === "y" || t2.toLowerCase() === "n") && this.emit("confirm", t2.toLowerCase() === "y"), this.emit("key", t2, e), e?.name === "return" && this._shouldSubmit(t2, e)) {
        if (this.opts.validate) {
          const i2 = runValidation(this.opts.validate, this.value);
          let s;
          i2 instanceof Promise ? (this.state = "validating", this.render(), s = await i2) : s = i2, s && (this.error = s instanceof Error ? s.message : s, this.state = "error", this.rl?.write(this.userInput));
        }
        this.state !== "error" && (this.state = "submit");
      }
      isActionKey([t2, e?.name, e?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
    }
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), setRawMode(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const t2 = wrapAnsi(this._prevFrame, getColumns(this.output), { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(cursor.move(-999, t2 * -1));
  }
  render() {
    const t2 = wrapAnsi(this._render(this) ?? "", getColumns(this.output), {
      hard: true,
      trim: false
    });
    if (t2 !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(cursor.hide);
      else {
        const e = diffLines(this._prevFrame, t2), i2 = getRows(this.output);
        if (this.restoreCursor(), e) {
          const s = Math.max(0, e.numLinesAfter - i2), r2 = Math.max(0, e.numLinesBefore - i2);
          let n2 = e.lines.find((o) => o >= s);
          if (n2 === void 0) {
            this._prevFrame = t2;
            return;
          }
          if (e.lines.length === 1) {
            this.output.write(cursor.move(0, n2 - r2)), this.output.write(erase.lines(1));
            const o = t2.split(`
`);
            this.output.write(o[n2]), this._prevFrame = t2, this.output.write(cursor.move(0, o.length - n2 - 1));
            return;
          } else if (e.lines.length > 1) {
            if (s < r2)
              n2 = s;
            else {
              const h2 = n2 - r2;
              h2 > 0 && this.output.write(cursor.move(0, h2));
            }
            this.output.write(erase.down());
            const m = t2.split(`
`).slice(n2);
            this.output.write(m.join(`
`)), this._prevFrame = t2;
            return;
          }
        }
        this.output.write(erase.down());
      }
      this.output.write(t2), this.state === "initial" && (this.state = "active"), this._prevFrame = t2;
    }
  }
};
var r = class extends C$1 {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(t2) {
    super(t2, false), this.value = !!t2.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (i2) => {
      this.output.write(cursor.move(0, -1)), this.value = i2, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
};

// ../../node_modules/.pnpm/@clack+prompts@1.9.0/node_modules/@clack/prompts/dist/index.mjs
import process$1 from "node:process";
function isUnicodeSupported() {
  if (process$1.platform !== "win32") {
    return process$1.env.TERM !== "linux";
  }
  return Boolean(process$1.env.CI) || Boolean(process$1.env.WT_SESSION) || Boolean(process$1.env.TERMINUS_SUBLIME) || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var unicode = isUnicodeSupported();
var unicodeOr = (e, o) => unicode ? e : o;
var S_STEP_ACTIVE = unicodeOr("\u25C6", "*");
var S_STEP_CANCEL = unicodeOr("\u25A0", "x");
var S_STEP_ERROR = unicodeOr("\u25B2", "x");
var S_STEP_SUBMIT = unicodeOr("\u25C7", "o");
var S_BAR_START = unicodeOr("\u250C", "T");
var S_BAR = unicodeOr("\u2502", "|");
var S_BAR_END = unicodeOr("\u2514", "\u2014");
var S_BAR_START_RIGHT = unicodeOr("\u2510", "T");
var S_BAR_END_RIGHT = unicodeOr("\u2518", "\u2014");
var S_RADIO_ACTIVE = unicodeOr("\u25CF", ">");
var S_RADIO_INACTIVE = unicodeOr("\u25CB", " ");
var S_CHECKBOX_ACTIVE = unicodeOr("\u25FB", "[\u2022]");
var S_CHECKBOX_SELECTED = unicodeOr("\u25FC", "[+]");
var S_CHECKBOX_INACTIVE = unicodeOr("\u25FB", "[ ]");
var S_PASSWORD_MASK = unicodeOr("\u25AA", "\u2022");
var S_BAR_H = unicodeOr("\u2500", "-");
var S_CORNER_TOP_RIGHT = unicodeOr("\u256E", "+");
var S_CONNECT_LEFT = unicodeOr("\u251C", "+");
var S_CORNER_BOTTOM_RIGHT = unicodeOr("\u256F", "+");
var S_CORNER_BOTTOM_LEFT = unicodeOr("\u2570", "+");
var S_CORNER_TOP_LEFT = unicodeOr("\u256D", "+");
var S_INFO = unicodeOr("\u25CF", "\u2022");
var S_SUCCESS = unicodeOr("\u25C6", "*");
var S_WARN = unicodeOr("\u25B2", "!");
var S_ERROR = unicodeOr("\u25A0", "x");
var symbol = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return styleText2("cyan", S_STEP_ACTIVE);
    case "cancel":
      return styleText2("red", S_STEP_CANCEL);
    case "error":
      return styleText2("yellow", S_STEP_ERROR);
    case "submit":
      return styleText2("green", S_STEP_SUBMIT);
    case "validating":
      return styleText2("dim", S_STEP_ACTIVE);
  }
};
var confirm = (e) => {
  const a2 = e.active ?? "Yes", o = e.inactive ?? "No";
  return new r({
    active: a2,
    inactive: o,
    signal: e.signal,
    input: e.input,
    output: e.output,
    initialValue: e.initialValue ?? true,
    render() {
      const i2 = e.withGuide ?? settings.withGuide, u3 = `${symbol(this.state)}  `, l = i2 ? `${styleText2("gray", S_BAR)}  ` : "", f = wrapTextWithPrefix(
        e.output,
        e.message,
        l,
        u3
      ), s = `${i2 ? `${styleText2("gray", S_BAR)}
` : ""}${f}
`, c2 = this.value ? a2 : o;
      switch (this.state) {
        case "submit": {
          const r2 = i2 ? `${styleText2("gray", S_BAR)}  ` : "";
          return `${s}${r2}${styleText2("dim", c2)}`;
        }
        case "cancel": {
          const r2 = i2 ? `${styleText2("gray", S_BAR)}  ` : "";
          return `${s}${r2}${styleText2(["strikethrough", "dim"], c2)}${i2 ? `
${styleText2("gray", S_BAR)}` : ""}`;
        }
        default: {
          const r2 = i2 ? `${styleText2("cyan", S_BAR)}  ` : "", g = i2 ? styleText2("cyan", S_BAR_END) : "";
          return `${s}${r2}${this.value ? `${styleText2("green", S_RADIO_ACTIVE)} ${a2}` : `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", a2)}`}${e.vertical ? i2 ? `
${styleText2("cyan", S_BAR)}  ` : `
` : ` ${styleText2("dim", "/")} `}${this.value ? `${styleText2("dim", S_RADIO_INACTIVE)} ${styleText2("dim", o)}` : `${styleText2("green", S_RADIO_ACTIVE)} ${o}`}
${g}
`;
        }
      }
    }
  }).prompt();
};
var MULTISELECT_INSTRUCTIONS = [
  `${styleText2("dim", "\u2191/\u2193")} to navigate`,
  `${styleText2("dim", "Space:")} select`,
  `${styleText2("dim", "Enter:")} confirm`
];
var u2 = {
  light: unicodeOr("\u2500", "-"),
  heavy: unicodeOr("\u2501", "="),
  block: unicodeOr("\u2588", "#")
};
var SELECT_INSTRUCTIONS = [
  `${styleText2("dim", "\u2191/\u2193")} to navigate`,
  `${styleText2("dim", "Enter:")} confirm`
];
var i = `${styleText2("gray", S_BAR)}  `;

// ../../node_modules/.pnpm/oauth4webapi@3.8.8/node_modules/oauth4webapi/build/index.js
var USER_AGENT;
if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "oauth4webapi";
  const VERSION = "v3.8.8";
  USER_AGENT = `${NAME}/${VERSION}`;
}
function looseInstanceOf(input, expected) {
  if (input == null) {
    return false;
  }
  try {
    return input instanceof expected || Object.getPrototypeOf(input)[Symbol.toStringTag] === expected.prototype[Symbol.toStringTag];
  } catch {
    return false;
  }
}
var ERR_INVALID_ARG_VALUE = "ERR_INVALID_ARG_VALUE";
var ERR_INVALID_ARG_TYPE = "ERR_INVALID_ARG_TYPE";
function CodedTypeError(message, code, cause) {
  const err = new TypeError(message, { cause });
  Object.assign(err, { code });
  return err;
}
var allowInsecureRequests = /* @__PURE__ */ Symbol();
var clockSkew = /* @__PURE__ */ Symbol();
var clockTolerance = /* @__PURE__ */ Symbol();
var customFetch = /* @__PURE__ */ Symbol();
var jweDecrypt = /* @__PURE__ */ Symbol();
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function buf(input) {
  if (typeof input === "string") {
    return encoder.encode(input);
  }
  return decoder.decode(input);
}
var encodeBase64Url;
if (Uint8Array.prototype.toBase64) {
  encodeBase64Url = (input) => {
    if (input instanceof ArrayBuffer) {
      input = new Uint8Array(input);
    }
    return input.toBase64({ alphabet: "base64url", omitPadding: true });
  };
} else {
  const CHUNK_SIZE = 32768;
  encodeBase64Url = (input) => {
    if (input instanceof ArrayBuffer) {
      input = new Uint8Array(input);
    }
    const arr = [];
    for (let i2 = 0; i2 < input.byteLength; i2 += CHUNK_SIZE) {
      arr.push(String.fromCharCode.apply(null, input.subarray(i2, i2 + CHUNK_SIZE)));
    }
    return btoa(arr.join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  };
}
var decodeBase64Url;
if (Uint8Array.fromBase64) {
  decodeBase64Url = (input) => {
    try {
      return Uint8Array.fromBase64(input, { alphabet: "base64url" });
    } catch (cause) {
      throw CodedTypeError("The input to be decoded is not correctly encoded.", ERR_INVALID_ARG_VALUE, cause);
    }
  };
} else {
  decodeBase64Url = (input) => {
    try {
      const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i2 = 0; i2 < binary.length; i2++) {
        bytes[i2] = binary.charCodeAt(i2);
      }
      return bytes;
    } catch (cause) {
      throw CodedTypeError("The input to be decoded is not correctly encoded.", ERR_INVALID_ARG_VALUE, cause);
    }
  };
}
function b64u(input) {
  if (typeof input === "string") {
    return decodeBase64Url(input);
  }
  return encodeBase64Url(input);
}
var UnsupportedOperationError = class extends Error {
  code;
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = UNSUPPORTED_OPERATION;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var OperationProcessingError = class extends Error {
  code;
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    if (options?.code) {
      this.code = options?.code;
    }
    Error.captureStackTrace?.(this, this.constructor);
  }
};
function OPE(message, code, cause) {
  return new OperationProcessingError(message, { code, cause });
}
function isJsonObject(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  return true;
}
function prepareHeaders(input) {
  if (looseInstanceOf(input, Headers)) {
    input = Object.fromEntries(input.entries());
  }
  const headers = new Headers(input ?? {});
  if (USER_AGENT && !headers.has("user-agent")) {
    headers.set("user-agent", USER_AGENT);
  }
  if (headers.has("authorization")) {
    throw CodedTypeError('"options.headers" must not include the "authorization" header name', ERR_INVALID_ARG_VALUE);
  }
  return headers;
}
function signal(url, value) {
  if (value !== void 0) {
    if (typeof value === "function") {
      value = value(url.href);
    }
    if (!(value instanceof AbortSignal)) {
      throw CodedTypeError('"options.signal" must return or be an instance of AbortSignal', ERR_INVALID_ARG_TYPE);
    }
    return value;
  }
  return void 0;
}
function replaceDoubleSlash(pathname) {
  if (pathname.includes("//")) {
    return pathname.replace("//", "/");
  }
  return pathname;
}
function prependWellKnown(url, wellKnown, allowTerminatingSlash = false) {
  if (url.pathname === "/") {
    url.pathname = wellKnown;
  } else {
    url.pathname = replaceDoubleSlash(`${wellKnown}/${allowTerminatingSlash ? url.pathname : url.pathname.replace(/(\/)$/, "")}`);
  }
  return url;
}
function appendWellKnown(url, wellKnown) {
  url.pathname = replaceDoubleSlash(`${url.pathname}/${wellKnown}`);
  return url;
}
async function performDiscovery(input, urlName, transform, options) {
  if (!(input instanceof URL)) {
    throw CodedTypeError(`"${urlName}" must be an instance of URL`, ERR_INVALID_ARG_TYPE);
  }
  checkProtocol(input, options?.[allowInsecureRequests] !== true);
  const url = transform(new URL(input.href));
  const headers = prepareHeaders(options?.headers);
  headers.set("accept", "application/json");
  return (options?.[customFetch] || fetch)(url.href, {
    body: void 0,
    headers: Object.fromEntries(headers.entries()),
    method: "GET",
    redirect: "manual",
    signal: signal(url, options?.signal)
  });
}
async function discoveryRequest(issuerIdentifier, options) {
  return performDiscovery(issuerIdentifier, "issuerIdentifier", (url) => {
    switch (options?.algorithm) {
      case void 0:
      case "oidc":
        appendWellKnown(url, ".well-known/openid-configuration");
        break;
      case "oauth2":
        prependWellKnown(url, ".well-known/oauth-authorization-server");
        break;
      default:
        throw CodedTypeError('"options.algorithm" must be "oidc" (default), or "oauth2"', ERR_INVALID_ARG_VALUE);
    }
    return url;
  }, options);
}
function assertNumber(input, allow0, it, code, cause) {
  try {
    if (typeof input !== "number" || !Number.isFinite(input)) {
      throw CodedTypeError(`${it} must be a number`, ERR_INVALID_ARG_TYPE, cause);
    }
    if (input > 0)
      return;
    if (allow0) {
      if (input !== 0) {
        throw CodedTypeError(`${it} must be a non-negative number`, ERR_INVALID_ARG_VALUE, cause);
      }
      return;
    }
    throw CodedTypeError(`${it} must be a positive number`, ERR_INVALID_ARG_VALUE, cause);
  } catch (err) {
    if (code) {
      throw OPE(err.message, code, cause);
    }
    throw err;
  }
}
function assertString(input, it, code, cause) {
  try {
    if (typeof input !== "string") {
      throw CodedTypeError(`${it} must be a string`, ERR_INVALID_ARG_TYPE, cause);
    }
    if (input.length === 0) {
      throw CodedTypeError(`${it} must not be empty`, ERR_INVALID_ARG_VALUE, cause);
    }
  } catch (err) {
    if (code) {
      throw OPE(err.message, code, cause);
    }
    throw err;
  }
}
async function processDiscoveryResponse(expectedIssuerIdentifier, response) {
  const expected = expectedIssuerIdentifier;
  if (!(expected instanceof URL) && expected !== _nodiscoverycheck) {
    throw CodedTypeError('"expectedIssuerIdentifier" must be an instance of URL', ERR_INVALID_ARG_TYPE);
  }
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  if (response.status !== 200) {
    throw OPE('"response" is not a conform Authorization Server Metadata response (unexpected HTTP status code)', RESPONSE_IS_NOT_CONFORM, response);
  }
  assertReadableResponse(response);
  const json = await getResponseJsonBody(response);
  assertString(json.issuer, '"response" body "issuer" property', INVALID_RESPONSE, { body: json });
  if (expected !== _nodiscoverycheck && new URL(json.issuer).href !== expected.href) {
    throw OPE('"response" body "issuer" property does not match the expected value', JSON_ATTRIBUTE_COMPARISON, { expected: expected.href, body: json, attribute: "issuer" });
  }
  return json;
}
function assertApplicationJson(response) {
  assertContentType(response, "application/json");
}
function notJson(response, ...types) {
  let msg = '"response" content-type must be ';
  if (types.length > 2) {
    const last = types.pop();
    msg += `${types.join(", ")}, or ${last}`;
  } else if (types.length === 2) {
    msg += `${types[0]} or ${types[1]}`;
  } else {
    msg += types[0];
  }
  return OPE(msg, RESPONSE_IS_NOT_JSON, response);
}
function assertContentType(response, contentType) {
  if (getContentType(response) !== contentType) {
    throw notJson(response, contentType);
  }
}
function getClockSkew(client) {
  const skew = client?.[clockSkew];
  return typeof skew === "number" && Number.isFinite(skew) ? skew : 0;
}
function getClockTolerance(client) {
  const tolerance = client?.[clockTolerance];
  return typeof tolerance === "number" && Number.isFinite(tolerance) && Math.sign(tolerance) !== -1 ? tolerance : 30;
}
function epochTime() {
  return Math.floor(Date.now() / 1e3);
}
function assertAs(as) {
  if (typeof as !== "object" || as === null) {
    throw CodedTypeError('"as" must be an object', ERR_INVALID_ARG_TYPE);
  }
  assertString(as.issuer, '"as.issuer"');
}
function assertClient(client) {
  if (typeof client !== "object" || client === null) {
    throw CodedTypeError('"client" must be an object', ERR_INVALID_ARG_TYPE);
  }
  assertString(client.client_id, '"client.client_id"');
}
function None() {
  return (_as, client, body, _headers) => {
    body.set("client_id", client.client_id);
  };
}
var URLParse = URL.parse ? (url, base) => URL.parse(url, base) : (url, base) => {
  try {
    return new URL(url, base);
  } catch {
    return null;
  }
};
function checkProtocol(url, enforceHttps) {
  if (enforceHttps && url.protocol !== "https:") {
    throw OPE("only requests to HTTPS are allowed", HTTP_REQUEST_FORBIDDEN, url);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw OPE("only HTTP and HTTPS requests are allowed", REQUEST_PROTOCOL_FORBIDDEN, url);
  }
}
function validateEndpoint(value, endpoint, useMtlsAlias, enforceHttps) {
  let url;
  if (typeof value !== "string" || !(url = URLParse(value))) {
    throw OPE(`authorization server metadata does not contain a valid ${useMtlsAlias ? `"as.mtls_endpoint_aliases.${endpoint}"` : `"as.${endpoint}"`}`, value === void 0 ? MISSING_SERVER_METADATA : INVALID_SERVER_METADATA, { attribute: useMtlsAlias ? `mtls_endpoint_aliases.${endpoint}` : endpoint });
  }
  checkProtocol(url, enforceHttps);
  return url;
}
function resolveEndpoint(as, endpoint, useMtlsAlias, enforceHttps) {
  if (useMtlsAlias && as.mtls_endpoint_aliases && endpoint in as.mtls_endpoint_aliases) {
    return validateEndpoint(as.mtls_endpoint_aliases[endpoint], endpoint, useMtlsAlias, enforceHttps);
  }
  return validateEndpoint(as[endpoint], endpoint, useMtlsAlias, enforceHttps);
}
var ResponseBodyError = class extends Error {
  cause;
  code;
  error;
  status;
  error_description;
  response;
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = RESPONSE_BODY_ERROR;
    this.cause = options.cause;
    this.error = options.cause.error;
    this.status = options.response.status;
    this.error_description = options.cause.error_description;
    Object.defineProperty(this, "response", { enumerable: false, value: options.response });
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var AuthorizationResponseError = class extends Error {
  cause;
  code;
  error;
  error_description;
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = AUTHORIZATION_RESPONSE_ERROR;
    this.cause = options.cause;
    this.error = options.cause.get("error");
    this.error_description = options.cause.get("error_description") ?? void 0;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var WWWAuthenticateChallengeError = class extends Error {
  cause;
  code;
  response;
  status;
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = WWW_AUTHENTICATE_CHALLENGE;
    this.cause = options.cause;
    this.status = options.response.status;
    this.response = options.response;
    Object.defineProperty(this, "response", { enumerable: false });
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var tokenMatch = "[a-zA-Z0-9!#$%&\\'\\*\\+\\-\\.\\^_`\\|~]+";
var token68Match = "[a-zA-Z0-9\\-\\._\\~\\+\\/]+={0,2}";
var quotedMatch = '"((?:[^"\\\\]|\\\\[\\s\\S])*)"';
var quotedParamMatcher = "(" + tokenMatch + ")\\s*=\\s*" + quotedMatch;
var paramMatcher = "(" + tokenMatch + ")\\s*=\\s*(" + tokenMatch + ")";
var schemeRE = new RegExp("^[,\\s]*(" + tokenMatch + ")");
var quotedParamRE = new RegExp("^[,\\s]*" + quotedParamMatcher + "[,\\s]*(.*)");
var unquotedParamRE = new RegExp("^[,\\s]*" + paramMatcher + "[,\\s]*(.*)");
var token68ParamRE = new RegExp("^(" + token68Match + ")(?:$|[,\\s])(.*)");
function parseWwwAuthenticateChallenges(response) {
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  const header = response.headers.get("www-authenticate");
  if (header === null) {
    return void 0;
  }
  const challenges = [];
  let rest = header;
  while (rest) {
    let match2 = rest.match(schemeRE);
    const scheme = match2?.["1"].toLowerCase();
    if (!scheme) {
      return void 0;
    }
    const afterScheme = rest.substring(match2[0].length);
    if (afterScheme && !afterScheme.match(/^[\s,]/)) {
      return void 0;
    }
    const spaceMatch = afterScheme.match(/^\s+(.*)$/);
    const hasParameters = !!spaceMatch;
    rest = spaceMatch ? spaceMatch[1] : void 0;
    const parameters = {};
    let token68;
    if (hasParameters) {
      while (rest) {
        let key;
        let value;
        if (match2 = rest.match(quotedParamRE)) {
          ;
          [, key, value, rest] = match2;
          if (value.includes("\\")) {
            value = value.replace(/\\([\s\S])/g, "$1");
          }
          parameters[key.toLowerCase()] = value;
          continue;
        }
        if (match2 = rest.match(unquotedParamRE)) {
          ;
          [, key, value, rest] = match2;
          parameters[key.toLowerCase()] = value;
          continue;
        }
        if (match2 = rest.match(token68ParamRE)) {
          if (Object.keys(parameters).length) {
            break;
          }
          ;
          [, token68, rest] = match2;
          break;
        }
        return void 0;
      }
    } else {
      rest = afterScheme || void 0;
    }
    const challenge = { scheme, parameters };
    if (token68) {
      challenge.token68 = token68;
    }
    challenges.push(challenge);
  }
  if (!challenges.length) {
    return void 0;
  }
  return challenges;
}
async function parseOAuthResponseErrorBody(response) {
  if (response.status > 399 && response.status < 500) {
    assertReadableResponse(response);
    assertApplicationJson(response);
    try {
      const json = await response.clone().json();
      if (isJsonObject(json) && typeof json.error === "string" && json.error.length) {
        return json;
      }
    } catch {
    }
  }
  return void 0;
}
async function checkOAuthBodyError(response, expected, label2) {
  if (response.status !== expected) {
    checkAuthenticationChallenges(response);
    let err;
    if (err = await parseOAuthResponseErrorBody(response)) {
      await response.body?.cancel();
      throw new ResponseBodyError("server responded with an error in the response body", {
        cause: err,
        response
      });
    }
    throw OPE(`"response" is not a conform ${label2} response (unexpected HTTP status code)`, RESPONSE_IS_NOT_CONFORM, response);
  }
}
function assertDPoP(option) {
  if (!branded.has(option)) {
    throw CodedTypeError('"options.DPoP" is not a valid DPoPHandle', ERR_INVALID_ARG_VALUE);
  }
}
function getContentType(input) {
  return input.headers.get("content-type")?.split(";")[0];
}
async function authenticatedRequest(as, client, clientAuthentication, url, body, headers, options) {
  await clientAuthentication(as, client, body, headers);
  headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  return (options?.[customFetch] || fetch)(url.href, {
    body,
    headers: Object.fromEntries(headers.entries()),
    method: "POST",
    redirect: "manual",
    signal: signal(url, options?.signal)
  });
}
async function tokenEndpointRequest(as, client, clientAuthentication, grantType, parameters, options) {
  const url = resolveEndpoint(as, "token_endpoint", client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
  parameters.set("grant_type", grantType);
  const headers = prepareHeaders(options?.headers);
  headers.set("accept", "application/json");
  if (options?.DPoP !== void 0) {
    assertDPoP(options.DPoP);
    await options.DPoP.addProof(url, headers, "POST");
  }
  const response = await authenticatedRequest(as, client, clientAuthentication, url, parameters, headers, options);
  options?.DPoP?.cacheNonce(response, url);
  return response;
}
async function refreshTokenGrantRequest(as, client, clientAuthentication, refreshToken, options) {
  assertAs(as);
  assertClient(client);
  assertString(refreshToken, '"refreshToken"');
  const parameters = new URLSearchParams(options?.additionalParameters);
  parameters.set("refresh_token", refreshToken);
  return tokenEndpointRequest(as, client, clientAuthentication, "refresh_token", parameters, options);
}
var idTokenClaims = /* @__PURE__ */ new WeakMap();
var jwtRefs = /* @__PURE__ */ new WeakMap();
function getValidatedIdTokenClaims(ref) {
  if (!ref.id_token) {
    return void 0;
  }
  const claims = idTokenClaims.get(ref);
  if (!claims) {
    throw CodedTypeError('"ref" was already garbage collected or did not resolve from the proper sources', ERR_INVALID_ARG_VALUE);
  }
  return claims;
}
async function processGenericAccessTokenResponse(as, client, response, additionalRequiredIdTokenClaims, decryptFn, recognizedTokenTypes) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  await checkOAuthBodyError(response, 200, "Token Endpoint");
  assertReadableResponse(response);
  const json = await getResponseJsonBody(response);
  assertString(json.access_token, '"response" body "access_token" property', INVALID_RESPONSE, {
    body: json
  });
  assertString(json.token_type, '"response" body "token_type" property', INVALID_RESPONSE, {
    body: json
  });
  json.token_type = json.token_type.toLowerCase();
  if (json.expires_in !== void 0) {
    let expiresIn = typeof json.expires_in !== "number" ? parseFloat(json.expires_in) : json.expires_in;
    assertNumber(expiresIn, true, '"response" body "expires_in" property', INVALID_RESPONSE, {
      body: json
    });
    json.expires_in = expiresIn;
  }
  if (json.refresh_token !== void 0) {
    assertString(json.refresh_token, '"response" body "refresh_token" property', INVALID_RESPONSE, {
      body: json
    });
  }
  if (json.scope !== void 0 && typeof json.scope !== "string") {
    throw OPE('"response" body "scope" property must be a string', INVALID_RESPONSE, { body: json });
  }
  if (json.id_token !== void 0) {
    assertString(json.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
      body: json
    });
    const requiredClaims = [];
    if (client.require_auth_time === true) {
      requiredClaims.push("auth_time");
    }
    if (client.default_max_age !== void 0) {
      assertNumber(client.default_max_age, true, '"client.default_max_age"');
      requiredClaims.push("auth_time");
    }
    if (additionalRequiredIdTokenClaims?.length) {
      requiredClaims.push(...additionalRequiredIdTokenClaims);
    }
    const { claims, jwt } = await validateIdTokenClaims(as, client, json.id_token, requiredClaims, decryptFn);
    validateIdTokenAuthorizedParty(client, claims);
    validateIdTokenAuthTimeClaim(claims);
    jwtRefs.set(response, jwt);
    idTokenClaims.set(json, claims);
  }
  if (recognizedTokenTypes?.[json.token_type] !== void 0) {
    recognizedTokenTypes[json.token_type](response, json);
  } else if (json.token_type !== "dpop" && json.token_type !== "bearer") {
    throw new UnsupportedOperationError("unsupported `token_type` value", { cause: { body: json } });
  }
  return json;
}
function checkAuthenticationChallenges(response) {
  let challenges;
  if (challenges = parseWwwAuthenticateChallenges(response)) {
    throw new WWWAuthenticateChallengeError("server responded with a challenge in the WWW-Authenticate HTTP Header", { cause: challenges, response });
  }
}
async function processRefreshTokenResponse(as, client, response, options) {
  return processGenericAccessTokenResponse(as, client, response, void 0, options?.[jweDecrypt], options?.recognizedTokenTypes);
}
function validateAudience(expected, result) {
  if (Array.isArray(result.claims.aud)) {
    if (!result.claims.aud.includes(expected)) {
      throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
        expected,
        claims: result.claims,
        claim: "aud"
      });
    }
  } else if (result.claims.aud !== expected) {
    throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
      expected,
      claims: result.claims,
      claim: "aud"
    });
  }
  return result;
}
function validateIssuer(as, result) {
  const expected = as[_expectedIssuer]?.(result) ?? as.issuer;
  if (result.claims.iss !== expected) {
    throw OPE('unexpected JWT "iss" (issuer) claim value', JWT_CLAIM_COMPARISON, {
      expected,
      claims: result.claims,
      claim: "iss"
    });
  }
  return result;
}
var branded = /* @__PURE__ */ new WeakSet();
function brand(searchParams) {
  branded.add(searchParams);
  return searchParams;
}
var nopkce = /* @__PURE__ */ Symbol();
async function authorizationCodeGrantRequest(as, client, clientAuthentication, callbackParameters, redirectUri, codeVerifier, options) {
  assertAs(as);
  assertClient(client);
  if (!branded.has(callbackParameters)) {
    throw CodedTypeError('"callbackParameters" must be an instance of URLSearchParams obtained from "validateAuthResponse()", or "validateJwtAuthResponse()', ERR_INVALID_ARG_VALUE);
  }
  assertString(redirectUri, '"redirectUri"');
  const code = getURLSearchParameter(callbackParameters, "code");
  if (!code) {
    throw OPE('no authorization code in "callbackParameters"', INVALID_RESPONSE);
  }
  const parameters = new URLSearchParams(options?.additionalParameters);
  parameters.set("redirect_uri", redirectUri);
  parameters.set("code", code);
  if (codeVerifier !== nopkce) {
    assertString(codeVerifier, '"codeVerifier"');
    parameters.set("code_verifier", codeVerifier);
  }
  return tokenEndpointRequest(as, client, clientAuthentication, "authorization_code", parameters, options);
}
var jwtClaimNames = {
  aud: "audience",
  c_hash: "code hash",
  client_id: "client id",
  exp: "expiration time",
  iat: "issued at",
  iss: "issuer",
  jti: "jwt id",
  nonce: "nonce",
  s_hash: "state hash",
  sub: "subject",
  ath: "access token hash",
  htm: "http method",
  htu: "http uri",
  cnf: "confirmation",
  auth_time: "authentication time"
};
function validatePresence(required, result) {
  for (const claim of required) {
    if (result.claims[claim] === void 0) {
      throw OPE(`JWT "${claim}" (${jwtClaimNames[claim]}) claim missing`, INVALID_RESPONSE, {
        claims: result.claims
      });
    }
  }
  return result;
}
function validateStringClaim(claim, result) {
  if (typeof result.claims[claim] !== "string") {
    throw OPE(`unexpected JWT "${claim}" (${jwtClaimNames[claim]}) claim type`, INVALID_RESPONSE, {
      claims: result.claims
    });
  }
  return result;
}
function validateIdTokenClaims(as, client, idToken, requiredClaims, decryptFn) {
  return validateJwt(idToken, checkSigningAlgorithm.bind(void 0, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported, "RS256"), getClockSkew(client), getClockTolerance(client), decryptFn).then(validatePresence.bind(void 0, ["aud", "exp", "iat", "iss", "sub", ...requiredClaims])).then(validateIssuer.bind(void 0, as)).then(validateAudience.bind(void 0, client.client_id)).then(validateStringClaim.bind(void 0, "sub"));
}
function resolveIdTokenMaxAge(client, maxAge) {
  if (maxAge === skipAuthTimeCheck) {
    return maxAge;
  }
  const fromClient = maxAge === void 0;
  if (fromClient) {
    maxAge = client.default_max_age;
  }
  if (maxAge === void 0) {
    return skipAuthTimeCheck;
  }
  assertNumber(maxAge, true, fromClient ? '"client.default_max_age"' : '"maxAge" argument');
  return maxAge;
}
function validateIdTokenAuthTimeClaim(claims) {
  if (claims.auth_time !== void 0) {
    assertNumber(claims.auth_time, true, 'ID Token "auth_time" (authentication time)', INVALID_RESPONSE, { claims });
  }
}
function validateIdTokenAuthTime(client, claims, maxAge) {
  if (maxAge === skipAuthTimeCheck) {
    return;
  }
  const now = epochTime() + getClockSkew(client);
  const tolerance = getClockTolerance(client);
  if (claims.auth_time + maxAge < now - tolerance) {
    throw OPE("too much time has elapsed since the last End-User authentication", JWT_TIMESTAMP_CHECK, { claims, now, tolerance, claim: "auth_time" });
  }
}
function validateIdTokenNonce(claims, expectedNonce) {
  const expected = expectedNonce === expectNoNonce ? void 0 : expectedNonce;
  if (claims.nonce !== expected) {
    throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
      expected,
      claims,
      claim: "nonce"
    });
  }
}
function validateIdTokenAuthorizedParty(client, claims) {
  if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
    if (claims.azp === void 0) {
      throw OPE('ID Token "aud" (audience) claim includes additional untrusted audiences', JWT_CLAIM_COMPARISON, { claims, claim: "aud" });
    }
    if (claims.azp !== client.client_id) {
      throw OPE('unexpected ID Token "azp" (authorized party) claim value', JWT_CLAIM_COMPARISON, {
        expected: client.client_id,
        claims,
        claim: "azp"
      });
    }
  }
}
var expectNoNonce = /* @__PURE__ */ Symbol();
var skipAuthTimeCheck = /* @__PURE__ */ Symbol();
async function processAuthorizationCodeResponse(as, client, response, options) {
  if (typeof options?.expectedNonce === "string" || typeof options?.maxAge === "number" || options?.requireIdToken) {
    return processAuthorizationCodeOpenIDResponse(as, client, response, options.expectedNonce, options.maxAge, options[jweDecrypt], options.recognizedTokenTypes);
  }
  return processAuthorizationCodeOAuth2Response(as, client, response, options?.maxAge, options?.[jweDecrypt], options?.recognizedTokenTypes);
}
async function processAuthorizationCodeOpenIDResponse(as, client, response, expectedNonce, maxAge, decryptFn, recognizedTokenTypes) {
  const additionalRequiredClaims = [];
  switch (expectedNonce) {
    case void 0:
      expectedNonce = expectNoNonce;
      break;
    case expectNoNonce:
      break;
    default:
      assertString(expectedNonce, '"expectedNonce" argument');
      additionalRequiredClaims.push("nonce");
  }
  maxAge = resolveIdTokenMaxAge(client, maxAge);
  if (maxAge !== skipAuthTimeCheck) {
    additionalRequiredClaims.push("auth_time");
  }
  const result = await processGenericAccessTokenResponse(as, client, response, additionalRequiredClaims, decryptFn, recognizedTokenTypes);
  assertString(result.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
    body: result
  });
  const claims = getValidatedIdTokenClaims(result);
  validateIdTokenAuthTime(client, claims, maxAge);
  validateIdTokenNonce(claims, expectedNonce);
  return result;
}
async function processAuthorizationCodeOAuth2Response(as, client, response, maxAge, decryptFn, recognizedTokenTypes) {
  const result = await processGenericAccessTokenResponse(as, client, response, void 0, decryptFn, recognizedTokenTypes);
  const claims = getValidatedIdTokenClaims(result);
  if (claims) {
    validateIdTokenAuthTime(client, claims, resolveIdTokenMaxAge(client, maxAge));
    validateIdTokenNonce(claims, expectNoNonce);
  }
  return result;
}
var WWW_AUTHENTICATE_CHALLENGE = "OAUTH_WWW_AUTHENTICATE_CHALLENGE";
var RESPONSE_BODY_ERROR = "OAUTH_RESPONSE_BODY_ERROR";
var UNSUPPORTED_OPERATION = "OAUTH_UNSUPPORTED_OPERATION";
var AUTHORIZATION_RESPONSE_ERROR = "OAUTH_AUTHORIZATION_RESPONSE_ERROR";
var PARSE_ERROR = "OAUTH_PARSE_ERROR";
var INVALID_RESPONSE = "OAUTH_INVALID_RESPONSE";
var RESPONSE_IS_NOT_JSON = "OAUTH_RESPONSE_IS_NOT_JSON";
var RESPONSE_IS_NOT_CONFORM = "OAUTH_RESPONSE_IS_NOT_CONFORM";
var HTTP_REQUEST_FORBIDDEN = "OAUTH_HTTP_REQUEST_FORBIDDEN";
var REQUEST_PROTOCOL_FORBIDDEN = "OAUTH_REQUEST_PROTOCOL_FORBIDDEN";
var JWT_TIMESTAMP_CHECK = "OAUTH_JWT_TIMESTAMP_CHECK_FAILED";
var JWT_CLAIM_COMPARISON = "OAUTH_JWT_CLAIM_COMPARISON_FAILED";
var JSON_ATTRIBUTE_COMPARISON = "OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED";
var MISSING_SERVER_METADATA = "OAUTH_MISSING_SERVER_METADATA";
var INVALID_SERVER_METADATA = "OAUTH_INVALID_SERVER_METADATA";
async function revocationRequest(as, client, clientAuthentication, token, options) {
  assertAs(as);
  assertClient(client);
  assertString(token, '"token"');
  const url = resolveEndpoint(as, "revocation_endpoint", client.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
  const body = new URLSearchParams(options?.additionalParameters);
  body.set("token", token);
  const headers = prepareHeaders(options?.headers);
  headers.delete("accept");
  return authenticatedRequest(as, client, clientAuthentication, url, body, headers, options);
}
async function processRevocationResponse(response) {
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  await checkOAuthBodyError(response, 200, "Revocation Endpoint");
  return void 0;
}
function assertReadableResponse(response) {
  if (response.bodyUsed) {
    throw CodedTypeError('"response" body has been used already', ERR_INVALID_ARG_VALUE);
  }
}
async function validateJwt(jws, checkAlg, clockSkew2, clockTolerance2, decryptJwt) {
  let { 0: protectedHeader, 1: payload, length } = jws.split(".");
  if (length === 5) {
    if (decryptJwt !== void 0) {
      jws = await decryptJwt(jws);
      ({ 0: protectedHeader, 1: payload, length } = jws.split("."));
    } else {
      throw new UnsupportedOperationError("JWE decryption is not configured", { cause: jws });
    }
  }
  if (length !== 3) {
    throw OPE("Invalid JWT", INVALID_RESPONSE, jws);
  }
  let header;
  try {
    header = JSON.parse(buf(b64u(protectedHeader)));
  } catch (cause) {
    throw OPE("failed to parse JWT Header body as base64url encoded JSON", PARSE_ERROR, cause);
  }
  if (!isJsonObject(header)) {
    throw OPE("JWT Header must be a top level object", INVALID_RESPONSE, jws);
  }
  checkAlg(header);
  if (header.crit !== void 0) {
    throw new UnsupportedOperationError('no JWT "crit" header parameter extensions are supported', {
      cause: { header }
    });
  }
  let claims;
  try {
    claims = JSON.parse(buf(b64u(payload)));
  } catch (cause) {
    throw OPE("failed to parse JWT Payload body as base64url encoded JSON", PARSE_ERROR, cause);
  }
  if (!isJsonObject(claims)) {
    throw OPE("JWT Payload must be a top level object", INVALID_RESPONSE, jws);
  }
  const now = epochTime() + clockSkew2;
  if (claims.exp !== void 0) {
    if (typeof claims.exp !== "number") {
      throw OPE('unexpected JWT "exp" (expiration time) claim type', INVALID_RESPONSE, { claims });
    }
    if (claims.exp <= now - clockTolerance2) {
      throw OPE('unexpected JWT "exp" (expiration time) claim value, expiration is past current timestamp', JWT_TIMESTAMP_CHECK, { claims, now, tolerance: clockTolerance2, claim: "exp" });
    }
  }
  if (claims.iat !== void 0) {
    if (typeof claims.iat !== "number") {
      throw OPE('unexpected JWT "iat" (issued at) claim type', INVALID_RESPONSE, { claims });
    }
  }
  if (claims.iss !== void 0) {
    if (typeof claims.iss !== "string") {
      throw OPE('unexpected JWT "iss" (issuer) claim type', INVALID_RESPONSE, { claims });
    }
  }
  if (claims.nbf !== void 0) {
    if (typeof claims.nbf !== "number") {
      throw OPE('unexpected JWT "nbf" (not before) claim type', INVALID_RESPONSE, { claims });
    }
    if (claims.nbf > now + clockTolerance2) {
      throw OPE('unexpected JWT "nbf" (not before) claim value', JWT_TIMESTAMP_CHECK, {
        claims,
        now,
        tolerance: clockTolerance2,
        claim: "nbf"
      });
    }
  }
  if (claims.aud !== void 0) {
    if (typeof claims.aud !== "string" && !Array.isArray(claims.aud)) {
      throw OPE('unexpected JWT "aud" (audience) claim type', INVALID_RESPONSE, { claims });
    }
  }
  return { header, claims, jwt: jws };
}
function checkSigningAlgorithm(client, issuer, fallback2, header) {
  if (client !== void 0) {
    if (typeof client === "string" ? header.alg !== client : !client.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: client,
        reason: "client configuration"
      });
    }
    return;
  }
  if (Array.isArray(issuer)) {
    if (!issuer.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: issuer,
        reason: "authorization server metadata"
      });
    }
    return;
  }
  if (fallback2 !== void 0) {
    if (typeof fallback2 === "string" ? header.alg !== fallback2 : typeof fallback2 === "function" ? !fallback2(header.alg) : !fallback2.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: fallback2,
        reason: "default value"
      });
    }
    return;
  }
  throw OPE('missing client or server configuration to verify used JWT "alg" header parameter', void 0, { client, issuer, fallback: fallback2 });
}
function getURLSearchParameter(parameters, name) {
  const { 0: value, length } = parameters.getAll(name);
  if (length > 1) {
    throw OPE(`"${name}" parameter must be provided only once`, INVALID_RESPONSE);
  }
  return value;
}
var skipStateCheck = /* @__PURE__ */ Symbol();
var expectNoState = /* @__PURE__ */ Symbol();
function validateAuthResponse(as, client, parameters, expectedState) {
  assertAs(as);
  assertClient(client);
  if (parameters instanceof URL) {
    parameters = parameters.searchParams;
  }
  if (!(parameters instanceof URLSearchParams)) {
    throw CodedTypeError('"parameters" must be an instance of URLSearchParams, or URL', ERR_INVALID_ARG_TYPE);
  }
  if (getURLSearchParameter(parameters, "response")) {
    throw OPE('"parameters" contains a JARM response, use validateJwtAuthResponse() instead of validateAuthResponse()', INVALID_RESPONSE, { parameters });
  }
  const iss = getURLSearchParameter(parameters, "iss");
  const state = getURLSearchParameter(parameters, "state");
  if (!iss && as.authorization_response_iss_parameter_supported) {
    throw OPE('response parameter "iss" (issuer) missing', INVALID_RESPONSE, { parameters });
  }
  if (iss && iss !== as.issuer) {
    throw OPE('unexpected "iss" (issuer) response parameter value', INVALID_RESPONSE, {
      expected: as.issuer,
      parameters
    });
  }
  switch (expectedState) {
    case void 0:
    case expectNoState:
      if (state !== void 0) {
        throw OPE('unexpected "state" response parameter encountered', INVALID_RESPONSE, {
          expected: void 0,
          parameters
        });
      }
      break;
    case skipStateCheck:
      break;
    default:
      assertString(expectedState, '"expectedState" argument');
      if (state !== expectedState) {
        throw OPE(state === void 0 ? 'response parameter "state" missing' : 'unexpected "state" response parameter value', INVALID_RESPONSE, { expected: expectedState, parameters });
      }
  }
  const error = getURLSearchParameter(parameters, "error");
  if (error) {
    throw new AuthorizationResponseError("authorization response from the server is an error", {
      cause: parameters
    });
  }
  const id_token = getURLSearchParameter(parameters, "id_token");
  const token = getURLSearchParameter(parameters, "token");
  if (id_token !== void 0 || token !== void 0) {
    throw new UnsupportedOperationError("implicit and hybrid flows are not supported");
  }
  return brand(new URLSearchParams(parameters));
}
async function dynamicClientRegistrationRequest(as, metadata, options) {
  assertAs(as);
  const url = resolveEndpoint(as, "registration_endpoint", metadata.use_mtls_endpoint_aliases, options?.[allowInsecureRequests] !== true);
  const headers = prepareHeaders(options?.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  const method = "POST";
  if (options?.DPoP) {
    assertDPoP(options.DPoP);
    await options.DPoP.addProof(url, headers, method, options.initialAccessToken);
  }
  if (options?.initialAccessToken) {
    headers.set("authorization", `${headers.has("dpop") ? "DPoP" : "Bearer"} ${options.initialAccessToken}`);
  }
  const response = await (options?.[customFetch] || fetch)(url.href, {
    body: JSON.stringify(metadata),
    headers: Object.fromEntries(headers.entries()),
    method,
    redirect: "manual",
    signal: signal(url, options?.signal)
  });
  options?.DPoP?.cacheNonce(response, url);
  return response;
}
async function processDynamicClientRegistrationResponse(response) {
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  await checkOAuthBodyError(response, 201, "Dynamic Client Registration Endpoint");
  assertReadableResponse(response);
  const json = await getResponseJsonBody(response);
  assertString(json.client_id, '"response" body "client_id" property', INVALID_RESPONSE, {
    body: json
  });
  if (json.client_secret !== void 0) {
    assertString(json.client_secret, '"response" body "client_secret" property', INVALID_RESPONSE, {
      body: json
    });
  }
  if (json.client_secret) {
    assertNumber(json.client_secret_expires_at, true, '"response" body "client_secret_expires_at" property', INVALID_RESPONSE, {
      body: json
    });
  }
  return json;
}
async function getResponseJsonBody(response, check = assertApplicationJson) {
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    check(response);
    throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
  }
  if (!isJsonObject(json)) {
    throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json });
  }
  return json;
}
var _nodiscoverycheck = /* @__PURE__ */ Symbol();
var _expectedIssuer = /* @__PURE__ */ Symbol();

// src/state/config.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import {
  chmod,
  lstat as lstat2,
  readFile as readFile2,
  rename as rename2,
  rm as rm2,
  writeFile as writeFile2
} from "node:fs/promises";
import { join as join10 } from "node:path";

// src/state/lock.ts
import { randomBytes as randomBytes3 } from "node:crypto";
import {
  lstatSync as lstatSync5,
  mkdirSync as mkdirSync3,
  renameSync as renameSync4,
  rmSync as rmSync3,
  writeFileSync as writeFileSync3
} from "node:fs";
import { join as join8 } from "node:path";
function lockPath(name) {
  return join8(stateSubdir("locks"), name);
}
function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function readOwnerFile(path) {
  return readPrivateFile(join8(path, "owner.json"), 64 * 1024);
}
function readOwner(path) {
  try {
    const value = JSON.parse(readOwnerFile(path));
    const createdAt = typeof value.createdAt === "string" ? Date.parse(value.createdAt) : NaN;
    if (typeof value.pid !== "number" || Number.isNaN(createdAt))
      return void 0;
    const heartbeat2 = typeof value.heartbeatAt === "string" ? Date.parse(value.heartbeatAt) : NaN;
    return {
      pid: value.pid,
      createdAt,
      heartbeatAt: Number.isNaN(heartbeat2) ? createdAt : heartbeat2
    };
  } catch {
    return void 0;
  }
}
function isStale(path, staleMs) {
  let info;
  try {
    info = lstatSync5(path);
  } catch {
    return false;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) return true;
  const owner = readOwner(path);
  if (!owner) return Date.now() - info.mtimeMs > staleMs;
  if (!processAlive(owner.pid)) return true;
  return Date.now() - owner.heartbeatAt > staleMs;
}
var held = /* @__PURE__ */ new Map();
function tryMkdir(path) {
  try {
    mkdirSync3(path, { mode: 448 });
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
  const token = randomBytes3(8).toString("hex");
  held.set(path, { ino: lstatSync5(path).ino, token });
  writeOwner(path, (/* @__PURE__ */ new Date()).toISOString(), token);
  return true;
}
function writeOwner(path, createdAt, token) {
  const temporary = join8(path, `owner.${process.pid}.${token}.tmp`);
  writeFileSync3(
    temporary,
    JSON.stringify({
      pid: process.pid,
      createdAt,
      heartbeatAt: (/* @__PURE__ */ new Date()).toISOString(),
      token
    }),
    { mode: 384 }
  );
  renameSync4(temporary, join8(path, "owner.json"));
}
function readToken(path) {
  try {
    const value = JSON.parse(readOwnerFile(path));
    return typeof value.token === "string" ? value.token : void 0;
  } catch {
    return void 0;
  }
}
function stillOurs(path) {
  const mine = held.get(path);
  if (!mine) return false;
  try {
    return lstatSync5(path).ino === mine.ino && readToken(path) === mine.token;
  } catch {
    return false;
  }
}
function heartbeat(name) {
  const path = lockPath(name);
  const mine = held.get(path);
  const owner = readOwner(path);
  if (!mine || !owner || !stillOurs(path)) {
    held.delete(path);
    return false;
  }
  try {
    writeOwner(path, new Date(owner.createdAt).toISOString(), mine.token);
  } catch {
    held.delete(path);
    return false;
  }
  if (!stillOurs(path)) {
    held.delete(path);
    return false;
  }
  return true;
}
function clearStale(path, staleMs) {
  const tombstone = `${path}.stale-${process.pid}-${randomBytes3(4).toString("hex")}`;
  try {
    renameSync4(path, tombstone);
  } catch {
    return;
  }
  if (!isStale(tombstone, staleMs)) {
    try {
      renameSync4(tombstone, path);
      return;
    } catch {
    }
  }
  rmSync3(tombstone, { recursive: true, force: true });
}
async function acquireLock(name, options) {
  const path = lockPath(name);
  const deadline = Date.now() + (options.waitMs ?? 0);
  let cleanups = 0;
  for (; ; ) {
    if (options.signal?.aborted) return void 0;
    if (tryMkdir(path)) {
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (stillOurs(path)) rmSync3(path, { recursive: true, force: true });
        held.delete(path);
      };
    }
    if (cleanups < 3 && isStale(path, options.staleMs)) {
      cleanups++;
      clearStale(path, options.staleMs);
      continue;
    }
    if (Date.now() >= deadline) return void 0;
    await new Promise((resolve3) => setTimeout(resolve3, options.pollMs ?? 100));
  }
}
async function withCredentialLock(name, operation) {
  const release = await acquireLock(name, {
    staleMs: 6e4,
    waitMs: 6e4,
    pollMs: 100
  });
  if (!release)
    throw new Error(
      "AUTH_BUSY: Another credential operation is in progress; retry."
    );
  const timer = setInterval(() => heartbeat(name), 1e4);
  timer.unref();
  try {
    return await operation();
  } finally {
    clearInterval(timer);
    release();
  }
}

// src/state/storage.ts
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname6, isAbsolute as isAbsolute3, join as join9 } from "node:path";
function dataDirectory() {
  const base = process.platform === "win32" ? process.env.LOCALAPPDATA ?? join9(homedir2(), "AppData", "Local") : process.env.XDG_DATA_HOME ?? join9(homedir2(), ".local", "share");
  if (!isAbsolute3(base))
    throw new Error(
      "INVALID_DATA_DIRECTORY: XDG_DATA_HOME or LOCALAPPDATA must be absolute."
    );
  return join9(base, "memroot");
}
async function safeDirectory(path) {
  const boundary = dataDirectory();
  if (path !== boundary && path.startsWith(`${boundary}/`))
    await safeDirectory(dirname6(path));
  await mkdir(path, { recursive: true, mode: 448 });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error(`UNSAFE_PATH: Expected a real directory at ${path}.`);
}

// src/state/config.ts
function configDirectory() {
  return memrootConfigDir();
}
function configPath() {
  return join10(configDirectory(), "config.json");
}
function optionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function containsCredential(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, entry]) => /token|secret|password|credential|api[_-]?key/i.test(key) || containsCredential(entry)
  );
}
async function migrateLegacy(record, raw) {
  if (!(typeof record.user_id === "string" || typeof record.email === "string") || containsCredential(record) || record.apiBase !== void 0 && (typeof record.apiBase !== "string" || !isAllowedApiBase(record.apiBase)))
    throw new Error(
      "INVALID_CONFIG: Legacy config cannot be safely migrated. No credentials were imported."
    );
  await safeDirectory(configDirectory());
  const backup = `${configPath()}.legacy-backup`;
  try {
    await writeFile2(backup, raw, { flag: "wx", mode: 384 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const info = await lstat2(backup);
    if (!info.isFile() || info.isSymbolicLink() || await readFile2(backup, "utf8") !== raw)
      throw new Error(
        "INVALID_CONFIG: Legacy backup differs or is unsafe. Original config was preserved."
      );
    await chmod(backup, 384);
  }
  return { schemaVersion: 1 };
}
async function readConfig() {
  const path = configPath();
  let raw;
  try {
    const info = await lstat2(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("INVALID_CONFIG: Expected a regular config file.");
    raw = await readFile2(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      return { schemaVersion: 1 };
    throw error;
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "INVALID_CONFIG: ~/.memroot/config.json is not valid JSON. Fix or remove it."
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_CONFIG: Cannot safely read CLI config.");
  const record = value;
  if (record.schemaVersion === void 0) return migrateLegacy(record, raw);
  const apiBase = optionalString(record.apiBase);
  if (record.schemaVersion !== 1 || apiBase && !isAllowedApiBase(apiBase))
    throw new Error("INVALID_CONFIG: Cannot safely read CLI config.");
  const config = { schemaVersion: 1 };
  if (apiBase) config.apiBase = apiBase;
  const clientId = optionalString(record.clientId);
  if (clientId) config.clientId = clientId;
  const clientIdApiBase = optionalString(record.clientIdApiBase);
  if (clientIdApiBase) config.clientIdApiBase = clientIdApiBase;
  const userId = optionalString(record.userId);
  if (userId) config.userId = userId;
  const mcp = record.mcpRegistered;
  if (mcp && typeof mcp === "object" && !Array.isArray(mcp)) {
    const registered = {};
    if (mcp.claude === true)
      registered.claude = true;
    if (mcp.codex === true)
      registered.codex = true;
    if (mcp.grok === true) registered.grok = true;
    if (mcp.agy === true) registered.agy = true;
    if (registered.claude || registered.codex || registered.grok || registered.agy)
      config.mcpRegistered = registered;
  }
  const stamps = record.instructionsInstalled;
  if (stamps && typeof stamps === "object" && !Array.isArray(stamps)) {
    const installed = {};
    for (const key of ["claude", "codex", "grok", "agy"]) {
      const value2 = optionalString(stamps[key]);
      if (value2) installed[key] = value2;
    }
    if (installed.claude || installed.codex || installed.grok || installed.agy)
      config.instructionsInstalled = installed;
  }
  const banner = optionalString(record.importBannerShown);
  if (banner) config.importBannerShown = banner;
  const agy = record.agyMcpClient;
  if (agy && typeof agy === "object" && !Array.isArray(agy)) {
    const value2 = agy;
    if (typeof value2.apiBase === "string" && isAllowedApiBase(value2.apiBase) && typeof value2.clientId === "string" && /^[A-Za-z0-9._:-]{1,256}$/u.test(value2.clientId) && typeof value2.principalId === "string" && /^[a-f0-9-]{36}$/iu.test(value2.principalId))
      config.agyMcpClient = {
        apiBase: value2.apiBase,
        clientId: value2.clientId,
        principalId: value2.principalId
      };
  }
  const registration = record.agyMcpRegistration;
  if (registration && typeof registration === "object" && !Array.isArray(registration)) {
    const value2 = registration;
    if (typeof value2.command === "string" && value2.command.startsWith("/") && value2.command.length <= 4096 && !value2.command.includes("\0") && typeof value2.script === "string" && value2.script.startsWith("/") && value2.script.length <= 4096 && !value2.script.includes("\0"))
      config.agyMcpRegistration = {
        command: value2.command,
        script: value2.script
      };
  }
  return config;
}
async function writeConfig(config) {
  const directory = configDirectory();
  await safeDirectory(directory);
  const path = configPath();
  const temporary = `${path}.${randomUUID3()}.tmp`;
  try {
    await writeFile2(temporary, `${JSON.stringify(config, null, 2)}
`, {
      flag: "wx",
      mode: 384
    });
    await rename2(temporary, path);
    await chmod(path, 384);
  } finally {
    await rm2(temporary, { force: true });
  }
}

// src/commands/global-cli.ts
var import_compare = __toESM(require_compare(), 1);
var import_valid = __toESM(require_valid(), 1);

// ../../node_modules/.pnpm/smol-toml@1.9.1/node_modules/smol-toml/dist/stringify.js
var HAS_WELLFORMED = !!"".isWellFormed;

// src/connection/credential-accounts.ts
var CLI_CLIENT_ID = "memroot-cli";
function restAccount(apiBase) {
  return apiBase;
}
function captureAccount(apiBase) {
  return `${apiBase}#mcp`;
}
function agyAccount(apiBase) {
  return `${apiBase}#agy-mcp`;
}

// src/connection/credentials.ts
import { spawnSync } from "node:child_process";
import { lstatSync as lstatSync6 } from "node:fs";
import {
  chmod as chmod2,
  lstat as lstat3,
  readFile as readFile3,
  rename as rename3,
  rm as rm3,
  writeFile as writeFile3
} from "node:fs/promises";
import { isAbsolute as isAbsolute4, join as join11 } from "node:path";
var SERVICE = "memroot";
var TOOL_TIMEOUT_MS = 15e3;
function credentialStoreKind() {
  const override = process.env.MEMROOT_TEST_CREDENTIAL_STORE;
  if (override === "file" && process.env.NODE_ENV === "test")
    return "test-file";
  if (override)
    throw new Error(
      "INVALID_CREDENTIAL_STORE: MEMROOT_TEST_CREDENTIAL_STORE=file is honored only when NODE_ENV=test; refusing to file-back credentials."
    );
  return process.platform === "darwin" ? "macos-keychain" : "libsecret";
}
function unavailable(tool) {
  return new Error(
    `AUTH_KEYCHAIN_UNAVAILABLE: ${tool} is not installed, so there is no OS credential store for the Memroot refresh token. Tokens are never written to files; install ${tool === "security" ? "the macOS security tool" : "libsecret's secret-tool"} or sign in on a supported system.`
  );
}
function run(tool, args, input, allowNotFound = false, timeoutMs = TOOL_TIMEOUT_MS, hardDeadline = false) {
  const result = spawnSync(tool, args, {
    encoding: "utf8",
    input,
    timeout: Math.max(1, Math.min(TOOL_TIMEOUT_MS, timeoutMs)),
    ...hardDeadline ? { killSignal: "SIGKILL" } : {},
    shell: false,
    maxBuffer: 1024 * 1024
  });
  if (result.error) {
    if (result.error.code === "ENOENT")
      throw unavailable(tool);
    throw new Error(
      `AUTH_KEYCHAIN_FAILED: ${tool} could not run (${result.error.code ?? "error"}).`
    );
  }
  if (allowNotFound) return result;
  if (result.status !== 0)
    throw new Error(
      `AUTH_KEYCHAIN_FAILED: ${tool} ${args[0] ?? ""} failed (${result.status ?? "signal"}). No credential was read or written.`
    );
  return result;
}
function quote(value) {
  return JSON.stringify(value);
}
function testStorePath() {
  return join11(configDirectory(), "test-credentials.json");
}
async function readTestStore() {
  try {
    const info = await lstat3(testStorePath());
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error("INVALID_CREDENTIAL_STORE: Expected a regular file.");
    const value = JSON.parse(await readFile3(testStorePath(), "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}
async function writeTestStore(entries) {
  const directory = configDirectory();
  await safeDirectory(directory);
  const path = testStorePath();
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile3(temporary, `${JSON.stringify(entries, null, 2)}
`, {
      flag: "wx",
      mode: 384
    });
    await rename3(temporary, path);
    await chmod2(path, 384);
  } finally {
    await rm3(temporary, { force: true });
  }
}
function assertMacOSDefaultKeychain(timeoutMs) {
  try {
    const result = run(
      "/usr/bin/security",
      ["default-keychain", "-d", "user"],
      void 0,
      true,
      Math.min(5e3, timeoutMs ?? 5e3),
      true
    );
    const match2 = /^"([^"\r\n]+)"$/u.exec(result.stdout.trim());
    const path = match2?.[1];
    if (result.status !== 0 || !path || !isAbsolute4(path)) throw new Error();
    const info = lstatSync6(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error();
  } catch {
    throw new Error(
      "AUTH_KEYCHAIN_DEFAULT_UNAVAILABLE: This process has no usable default macOS keychain. Open Keychain Access for this macOS account, or run Memroot from its usual signed-in HOME, then retry. No keychain was created or changed."
    );
  }
}
function assertCredentialStoreAvailable() {
  const kind = credentialStoreKind();
  if (kind === "test-file") return;
  if (kind === "macos-keychain") {
    assertMacOSDefaultKeychain();
    run(
      "security",
      ["find-generic-password", "-s", SERVICE, "-a", "memroot:probe"],
      void 0,
      true
    );
  } else {
    const result = run(
      "secret-tool",
      ["lookup", "service", SERVICE, "account", "memroot:probe"],
      void 0,
      true
    );
    if (result.status !== 0 && !noUnlockedMatch(result))
      throw new Error("AUTH_KEYCHAIN_FAILED: secret-tool lookup failed.");
  }
}
async function storeSecret(account, secret, timeoutMs) {
  const kind = credentialStoreKind();
  if (kind === "test-file") {
    const entries = await readTestStore();
    entries[account] = secret;
    await writeTestStore(entries);
    return;
  }
  if (kind === "macos-keychain") {
    const started = Date.now();
    assertMacOSDefaultKeychain(timeoutMs);
    const remaining = timeoutMs === void 0 ? void 0 : timeoutMs - (Date.now() - started);
    if (remaining !== void 0 && remaining <= 0)
      throw new Error(
        "AUTH_KEYCHAIN_FAILED: Credential write deadline expired before any write."
      );
    run(
      "security",
      ["-i"],
      `add-generic-password -U -s ${quote(SERVICE)} -a ${quote(account)} -w ${quote(secret)}
`,
      false,
      remaining,
      timeoutMs !== void 0
    );
    return;
  }
  run(
    "secret-tool",
    ["store", "--label", "Memroot CLI", "service", SERVICE, "account", account],
    secret,
    false,
    timeoutMs,
    timeoutMs !== void 0
  );
}
async function readSecret(account, timeoutMs) {
  const kind = credentialStoreKind();
  if (kind === "test-file") return (await readTestStore())[account];
  if (kind === "macos-keychain") {
    const result2 = run(
      "security",
      ["find-generic-password", "-s", SERVICE, "-a", account, "-w"],
      void 0,
      true,
      timeoutMs,
      timeoutMs !== void 0
    );
    if (result2.status !== 0) {
      if (/could not be found|item not found/i.test(result2.stderr))
        return void 0;
      throw new Error(
        `AUTH_KEYCHAIN_FAILED: security find-generic-password failed (${result2.status ?? "signal"}).`
      );
    }
    const secret2 = result2.stdout.replace(/\n$/, "");
    return secret2.length ? secret2 : void 0;
  }
  const result = run(
    "secret-tool",
    ["lookup", "service", SERVICE, "account", account],
    void 0,
    true,
    timeoutMs,
    timeoutMs !== void 0
  );
  if (noUnlockedMatch(result)) return void 0;
  const secret = result.stdout.replace(/\n$/, "");
  if (result.status !== 0 || !secret)
    throw new Error("AUTH_KEYCHAIN_FAILED: secret-tool lookup failed.");
  return secret;
}
function noUnlockedMatch(result) {
  return result.status === 1 && result.stderr === "" && result.stdout === "";
}
async function deleteSecret(account, knownPresent = false) {
  const kind = credentialStoreKind();
  if (kind === "test-file") {
    const entries = await readTestStore();
    if (account in entries) {
      delete entries[account];
      await writeTestStore(entries);
    }
    return;
  }
  if (kind === "macos-keychain") {
    assertMacOSDefaultKeychain();
    const result2 = run(
      "security",
      ["delete-generic-password", "-s", SERVICE, "-a", account],
      void 0,
      true
    );
    if (result2.status !== 0 && (knownPresent || !/could not be found|item not found/i.test(result2.stderr)))
      throw new Error(
        `AUTH_KEYCHAIN_FAILED: security delete-generic-password failed (${result2.status ?? "signal"}).`
      );
    return;
  }
  const result = run(
    "secret-tool",
    ["clear", "service", SERVICE, "account", account],
    void 0,
    true
  );
  if (result.status !== 0 && (knownPresent || !noUnlockedMatch(result)))
    throw new Error("AUTH_KEYCHAIN_FAILED: secret-tool clear failed.");
}

// src/connection/http.ts
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
var HTTP_TIMEOUT_MS = 3e4;
var MAX_RESPONSE_BYTES = 1024 * 1024;
var TransportError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
  code;
};
function httpPost(target, headers, payload, timeoutMs = HTTP_TIMEOUT_MS, budget) {
  const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve3, reject) => {
    const req = transport(
      target,
      {
        method: "POST",
        agent: false,
        timeout: timeoutMs,
        ...budget?.signal ? { signal: budget.signal } : {},
        headers: { ...headers, "content-length": Buffer.byteLength(payload) }
      },
      (response) => {
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(new TransportError("response_too_large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on(
          "end",
          () => resolve3({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          })
        );
        response.on("error", () => reject(new TransportError("network_error")));
      }
    );
    const deadline = budget?.absoluteTimeout ? setTimeout(() => req.destroy(new TransportError("timeout")), timeoutMs) : void 0;
    if (deadline) req.once("close", () => clearTimeout(deadline));
    req.on("timeout", () => req.destroy(new TransportError("timeout")));
    req.on(
      "error",
      (error) => reject(
        error instanceof TransportError ? error : new TransportError("network_error")
      )
    );
    req.end(payload);
  });
}

// src/connection/token-broker.ts
var REFRESH_SKEW_MS = 3e4;
var AuthRequiredError = class extends Error {
  constructor() {
    super("AUTH_REQUIRED");
  }
};
function mcpResource(apiBase) {
  return `${apiBase}/mcp`;
}
var TokenBroker = class {
  /**
   * `pending`: a fresh sign-in's access token, held in memory only while the
   * connection's account is checked before its refresh token is stored. Such
   * a broker never reads the credential store, which still holds the
   * previous connection.
   */
  constructor(apiBase, pending, credentials) {
    this.apiBase = apiBase;
    this.pending = pending;
    this.credentials = credentials;
  }
  apiBase;
  pending;
  credentials;
  cached;
  refreshing;
  invalidate() {
    this.cached = void 0;
  }
  async accessToken(signal2) {
    if (this.pending) {
      if (this.pending.expiresAt <= Date.now()) throw new AuthRequiredError();
      return this.pending.token;
    }
    if (this.cached && this.cached.expiresAt - Date.now() > REFRESH_SKEW_MS)
      return this.cached.token;
    if (this.credentials?.authTimeoutMs !== void 0) {
      if (!this.refreshing) {
        const deadline = Date.now() + this.credentials.authTimeoutMs;
        const abort = AbortSignal.any([
          AbortSignal.timeout(this.credentials.authTimeoutMs),
          ...signal2 ? [signal2] : []
        ]);
        this.refreshing = this.refreshAccessToken(deadline, abort).finally(
          () => {
            this.refreshing = void 0;
          }
        );
      }
      const pending = this.refreshing;
      if (!signal2) return pending;
      if (signal2.aborted) throw new TransportError("auth_cancelled");
      return new Promise((resolve3, reject) => {
        const aborted = () => reject(new TransportError("auth_cancelled"));
        signal2.addEventListener("abort", aborted, { once: true });
        pending.then(resolve3, reject).finally(() => signal2.removeEventListener("abort", aborted));
      });
    }
    return this.refreshAccessToken();
  }
  async refreshAccessToken(deadline, signal2) {
    const remaining = () => {
      if (signal2?.aborted || deadline !== void 0 && deadline <= Date.now())
        throw new TransportError("auth_timeout");
      return deadline === void 0 ? void 0 : Math.max(1, deadline - Date.now());
    };
    const release = await acquireLock(
      this.credentials?.lockName ?? "auth.lock",
      {
        staleMs: 6e4,
        waitMs: Math.min(2e4, remaining() ?? 2e4),
        pollMs: 100,
        ...signal2 ? { signal: signal2 } : {}
      }
    );
    if (!release) throw new TransportError("auth_lock_busy");
    try {
      const account = this.credentials?.account ?? captureAccount(this.apiBase);
      const refreshToken = await readSecret(account, remaining());
      if (!refreshToken) throw new AuthRequiredError();
      const as = {
        issuer: this.apiBase,
        token_endpoint: `${this.apiBase}/oauth/token`
      };
      const client = {
        client_id: this.credentials?.clientId ?? CLI_CLIENT_ID
      };
      const seen = {};
      const answer = await refreshTokenGrantRequest(
        as,
        client,
        None(),
        refreshToken,
        {
          additionalParameters: { resource: mcpResource(this.apiBase) },
          [customFetch]: async (url, init) => {
            const { "user-agent": _agent, ...headers } = init.headers;
            const response2 = await httpPost(
              new URL(url),
              headers,
              String(init.body),
              remaining(),
              deadline === void 0 ? void 0 : { absoluteTimeout: true, ...signal2 ? { signal: signal2 } : {} }
            ).catch((error) => {
              if (deadline !== void 0 && error instanceof TransportError && error.code === "timeout")
                throw new TransportError("network_error");
              throw error;
            });
            seen.response = response2;
            const contentType = response2.headers["content-type"];
            const empty = response2.status === 204 || response2.status === 205 || response2.status === 304;
            return new Response(empty ? null : response2.body, {
              // A Response needs a status in 200-599; anything else is malformed.
              status: response2.status >= 200 && response2.status <= 599 ? response2.status : 500,
              headers: typeof contentType === "string" ? { "content-type": contentType } : {}
            });
          },
          // The API base admits plain HTTP only on a loopback address.
          [allowInsecureRequests]: new URL(this.apiBase).protocol === "http:"
        }
      );
      const response = seen.response;
      if (!response) throw new TransportError("token_response_invalid");
      let body = {};
      try {
        const parsed = JSON.parse(response.body || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          body = parsed;
      } catch {
        body = {};
      }
      if (response.status >= 400) {
        if (response.status === 400 && (body.error === "invalid_grant" || body.error === "invalid_client" || body.error === "invalid_target"))
          throw new AuthRequiredError();
        throw new TransportError(`token_http_${response.status}`);
      }
      let tokens;
      try {
        tokens = await processRefreshTokenResponse(as, client, answer);
      } catch {
        throw new TransportError("token_response_invalid");
      }
      if (typeof tokens.refresh_token === "string" && tokens.refresh_token && tokens.refresh_token !== refreshToken)
        await storeSecret(account, tokens.refresh_token, remaining());
      remaining();
      const lifetime = typeof tokens.expires_in === "number" && tokens.expires_in > 0 ? tokens.expires_in : 300;
      this.cached = {
        token: tokens.access_token,
        expiresAt: Date.now() + lifetime * 1e3
      };
      return tokens.access_token;
    } finally {
      release();
    }
  }
};

// src/connection/mcp-client.ts
var MCP_PROTOCOL_VERSION = "2025-11-25";
var McpInputRejected = class extends Error {
  constructor(rules) {
    super("MCP_INPUT_REJECTED");
    this.rules = rules;
  }
  rules;
};
var McpToolError = class extends Error {
  constructor(code) {
    super(`MCP_TOOL_ERROR:${code}`);
    this.code = code;
  }
  code;
};
var McpRateLimited = class extends Error {
  constructor(retryAfterMs) {
    super("MCP_RATE_LIMITED");
    this.retryAfterMs = retryAfterMs;
  }
  retryAfterMs;
};
var MIN_RETRY_MS = 6e4;
var MAX_RETRY_MS = 36e5;
function retryAfter(value) {
  const header = Array.isArray(value) ? value[0] : value;
  const seconds = header ? Number(header) : Number.NaN;
  let ms = MIN_RETRY_MS;
  if (Number.isFinite(seconds) && seconds >= 0) ms = seconds * 1e3;
  else {
    const date = header ? Date.parse(header) : Number.NaN;
    if (Number.isFinite(date)) ms = date - Date.now();
  }
  return Math.min(Math.max(ms, MIN_RETRY_MS), MAX_RETRY_MS);
}
function parseRpc(contentType, body) {
  let text = body;
  if (contentType.includes("text/event-stream")) {
    const data = body.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
    text = data.at(-1) ?? "";
  }
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TransportError("rpc_invalid");
  return value;
}
var McpClient = class {
  constructor(apiBase, broker, userAgent) {
    this.apiBase = apiBase;
    this.broker = broker;
    this.userAgent = userAgent;
  }
  apiBase;
  broker;
  userAgent;
  id = 0;
  async post(token, payload) {
    return httpPost(
      new URL(`${this.apiBase}/mcp`),
      {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": MCP_PROTOCOL_VERSION,
        authorization: `Bearer ${token}`,
        "user-agent": this.userAgent
      },
      payload
    );
  }
  async call(name, args) {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: ++this.id,
      method: "tools/call",
      params: { name, arguments: args }
    });
    let response = await this.post(await this.broker.accessToken(), payload);
    if (response.status === 401) {
      this.broker.invalidate();
      response = await this.post(await this.broker.accessToken(), payload);
      if (response.status === 401) throw new AuthRequiredError();
    }
    if (response.status === 403) throw new AuthRequiredError();
    if (response.status === 429)
      throw new McpRateLimited(retryAfter(response.headers["retry-after"]));
    if (response.status !== 200)
      throw new TransportError(`mcp_http_${response.status}`);
    let message;
    try {
      message = parseRpc(
        String(response.headers["content-type"] ?? ""),
        response.body
      );
    } catch {
      throw new TransportError("rpc_invalid");
    }
    const error = message.error;
    if (error) {
      if (error.code === -32602) {
        const issues = error.data?.issues;
        const rules = Array.isArray(issues) ? issues.map((issue) => issue.rule).filter((rule) => typeof rule === "string") : [];
        throw new McpInputRejected(rules);
      }
      throw new TransportError(
        `rpc_error_${typeof error.code === "number" ? error.code : "unknown"}`
      );
    }
    const result = message.result;
    const text = result?.content?.find((item) => item.type === "text")?.text;
    let value;
    try {
      value = typeof text === "string" ? JSON.parse(text) : void 0;
    } catch {
      value = void 0;
    }
    if (result?.isError === true) {
      const error2 = value?.error;
      if (error2?.code === "invalid_request" && Array.isArray(error2.issues))
        throw new McpInputRejected(
          error2.issues.map((issue) => issue.rule).filter((rule) => typeof rule === "string")
        );
      const code = error2?.code;
      const safe = typeof code === "string" && /^[a-z_]{1,64}$/.test(code) ? code : "unknown";
      if (safe === "rate_limited") throw new McpRateLimited(6e4);
      throw new McpToolError(safe);
    }
    if (value === void 0) throw new TransportError("rpc_result_invalid");
    return value;
  }
};

// src/capture/extract/run.ts
var MAX_OUTPUT_BYTES = 256 * 1024;
var MAX_STDERR_BYTES = 8 * 1024;

// src/capture/queue/ledger.ts
var UPLOAD_RETENTION_MS = 7 * 24 * 60 * 60 * 1e3;

// src/project/list.ts
import { join as join12 } from "node:path";

// src/project/target.ts
var UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
var NIL = "00000000-0000-0000-0000-000000000000";
var MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";
function projectIdShape(value) {
  if (typeof value !== "string" || !UUID4.test(value)) return false;
  const id = value.toLowerCase();
  return id !== NIL && id !== MAX;
}

// src/project/list.ts
var PROJECT_LIST_FILE = "project-list.json";
var SOURCES = ["cli", "agy"];
var MAX_FILE_BYTES3 = 128 * 1024;
var MAX_LISTED_IDS = 100;
var MAX_IDS = MAX_LISTED_IDS;
var FUTURE_SKEW_MS = 5 * 6e4;
var MAX_ACCOUNTS2 = 64;
var PROJECT_LIST_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1e3;
function projectListPath() {
  return join12(memrootConfigDir(), PROJECT_LIST_FILE);
}
function validSource(value) {
  const v = value;
  return !!v && typeof v === "object" && typeof v.listedAt === "string" && !Number.isNaN(Date.parse(v.listedAt)) && Array.isArray(v.projectIds) && v.projectIds.length <= MAX_IDS && v.projectIds.every(projectIdShape);
}
function readStore3() {
  let raw;
  try {
    raw = readPrivateFileIfExists(projectListPath(), MAX_FILE_BYTES3);
  } catch {
    return void 0;
  }
  if (raw === void 0) return { store: {}, present: false };
  try {
    const value = JSON.parse(raw);
    if (value?.schemaVersion !== 1 || !value.lists || typeof value.lists !== "object" || Array.isArray(value.lists))
      return void 0;
    const store = {};
    for (const [key, entry] of Object.entries(
      value.lists
    )) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const account = {};
      for (const source of SOURCES) {
        const list = entry[source];
        if (validSource(list))
          account[source] = {
            listedAt: list.listedAt,
            projectIds: list.projectIds.map((id) => id.toLowerCase())
          };
      }
      store[key] = account;
    }
    return { store, present: true };
  } catch {
    return void 0;
  }
}
function update2(change) {
  withConfigLock(PROJECT_LIST_FILE, () => {
    const store = readStore3()?.store ?? {};
    if (!change(store)) return;
    for (const key of Object.keys(store))
      if (Object.keys(store[key] ?? {}).length === 0) delete store[key];
    const keys = Object.keys(store);
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ACCOUNTS2)))
      delete store[key];
    persistConfigJson(PROJECT_LIST_FILE, { schemaVersion: 1, lists: store });
  });
}
function writeProjectList(apiBase, principalId, source, projectIds) {
  if (!isAllowedApiBase(apiBase) || !projectIdShape(principalId)) return;
  const ids = [
    ...new Set(projectIds.filter(projectIdShape).map((id) => id.toLowerCase()))
  ];
  const key = selectionKey(apiBase, principalId);
  update2((store) => {
    const { [source]: _replaced, ...prior } = store[key] ?? {};
    delete store[key];
    store[key] = ids.length > MAX_IDS ? prior : {
      ...prior,
      [source]: { listedAt: (/* @__PURE__ */ new Date()).toISOString(), projectIds: ids }
    };
    return true;
  });
}

// src/connection/auth.ts
var CALLBACK_PATH = "/callback";
var LOGIN_TIMEOUT_MS = 18e4;
var REQUESTED_SCOPE = "memory.read memory.write";
var OAuthError = class extends Error {
  constructor(oauth, message) {
    super(message);
    this.oauth = oauth;
  }
  oauth;
};
function parseTokenSet(body) {
  if (typeof body.access_token !== "string" || !body.access_token)
    throw new Error(
      "AUTH_RESPONSE_INVALID: The token endpoint returned no access token."
    );
  const tokens = { accessToken: body.access_token };
  if (typeof body.refresh_token === "string" && body.refresh_token)
    tokens.refreshToken = body.refresh_token;
  if (typeof body.expires_in === "number") tokens.expiresIn = body.expires_in;
  return tokens;
}
var REQUEST_TIMEOUT_MS = 3e4;
function request(target, method, requestHeaders, payload) {
  const transport = target.protocol === "https:" ? httpsRequest2 : httpRequest2;
  const headers = { ...requestHeaders };
  if (payload !== void 0)
    headers["content-length"] = Buffer.byteLength(payload);
  return new Promise((resolve3, reject) => {
    const request2 = transport(
      target,
      {
        method,
        agent: false,
        timeout: REQUEST_TIMEOUT_MS,
        headers
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          const contentType = response.headers["content-type"];
          resolve3({
            status: response.statusCode ?? 0,
            body,
            ...contentType ? { contentType } : {}
          });
        });
      }
    );
    request2.on("timeout", () => request2.destroy(new Error("request timeout")));
    request2.on(
      "error",
      () => reject(
        new Error(
          `AUTH_UNREACHABLE: Cannot reach ${target.origin}. Check the network connection and API base URL.`
        )
      )
    );
    request2.end(payload);
  });
}
function oauthTransport(apiBase) {
  const seen = { answer: void 0 };
  const options = {
    [customFetch]: async (url, init) => {
      const { "user-agent": _agent, ...headers } = init.headers;
      seen.answer = void 0;
      const answer = await request(
        new URL(url),
        init.method,
        headers,
        init.body === void 0 ? void 0 : String(init.body)
      );
      seen.answer = answer;
      const empty = answer.status === 204 || answer.status === 205 || answer.status === 304;
      return new Response(empty ? null : answer.body, {
        // A Response needs a status in 200-599; anything else is malformed.
        status: answer.status >= 200 && answer.status <= 599 ? answer.status : 500,
        headers: answer.contentType ? { "content-type": answer.contentType } : {}
      });
    },
    // resolveApiBase admits plain HTTP only on a loopback address.
    [allowInsecureRequests]: new URL(apiBase).protocol === "http:"
  };
  return { options, seen };
}
function authorizationServer(apiBase) {
  return {
    issuer: apiBase,
    authorization_endpoint: `${apiBase}/authorize`,
    token_endpoint: `${apiBase}/oauth/token`,
    registration_endpoint: `${apiBase}/oauth/register`
  };
}
function parseJsonBody(text) {
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = void 0;
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error(
      "AUTH_RESPONSE_INVALID: The server returned a malformed response."
    );
  return body;
}
function oauthFailure(record, status) {
  const code = typeof record.error === "string" ? record.error : `http_${status}`;
  const description = typeof record.error_description === "string" ? ` ${record.error_description}` : "";
  return new OAuthError(code, `AUTH_TOKEN_REJECTED: ${code}.${description}`);
}
function errorRecord(answer) {
  try {
    return answer.body ? parseJsonBody(answer.body) : {};
  } catch {
    return {};
  }
}
function tokenFailure(answer, error) {
  if (!answer) return error instanceof Error ? error : new Error(String(error));
  if (answer.status >= 400)
    return oauthFailure(errorRecord(answer), answer.status);
  const body = parseJsonBody(answer.body);
  if (typeof body.access_token !== "string" || !body.access_token)
    return new Error(
      "AUTH_RESPONSE_INVALID: The token endpoint returned no access token."
    );
  return new Error(
    "AUTH_RESPONSE_INVALID: The server returned a malformed response."
  );
}
async function tokenRequest(apiBase, send, process2) {
  const { options, seen } = oauthTransport(apiBase);
  const response = await send(options);
  try {
    return parseTokenSet(await process2(response));
  } catch (error) {
    throw tokenFailure(seen.answer, error);
  }
}
async function registerClient(apiBase, redirectUri, clientName = "Memroot CLI") {
  const { options, seen } = oauthTransport(apiBase);
  const response = await dynamicClientRegistrationRequest(
    authorizationServer(apiBase),
    {
      client_name: clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: REQUESTED_SCOPE
    },
    options
  );
  if (response.status === 404 || response.status === 405 || response.status === 501)
    return void 0;
  try {
    return (await processDynamicClientRegistrationResponse(response)).client_id;
  } catch (error) {
    const answer = seen.answer;
    if (!answer) throw error;
    if (answer.status >= 400) {
      const record = errorRecord(answer);
      const code = typeof record.error === "string" ? record.error : `http_${answer.status}`;
      throw new OAuthError(
        code,
        `AUTH_REGISTRATION_FAILED: Client registration failed (${code}).`
      );
    }
    throw new Error(
      "AUTH_RESPONSE_INVALID: Client registration returned no client_id."
    );
  }
}
async function exchangeCode(apiBase, clientId, redirectUri, code, state, verifier, resource) {
  const as = authorizationServer(apiBase);
  const client = { client_id: clientId };
  const callback = validateAuthResponse(
    as,
    client,
    new URLSearchParams({ code, state }),
    state
  );
  return tokenRequest(
    apiBase,
    (options) => authorizationCodeGrantRequest(
      as,
      client,
      None(),
      callback,
      redirectUri,
      verifier,
      resource ? { ...options, additionalParameters: { resource } } : options
    ),
    (response) => processAuthorizationCodeResponse(as, client, response)
  );
}
function sameOrigin(url, apiBase) {
  try {
    return new URL(url).origin === new URL(apiBase).origin;
  } catch {
    return false;
  }
}
function terminalSafe(text, max = 200) {
  const clean = text.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
  return clean.length > max ? `${clean.slice(0, max)}\u2026` : clean;
}
async function revokeRefreshToken(apiBase, refreshToken, clientId) {
  const metadataUrl = `${apiBase}/.well-known/oauth-authorization-server`;
  const discovery = oauthTransport(apiBase);
  let metadata;
  try {
    metadata = await processDiscoveryResponse(
      new URL(apiBase),
      await discoveryRequest(new URL(apiBase), {
        ...discovery.options,
        algorithm: "oauth2"
      })
    );
  } catch (error) {
    const answer = discovery.seen.answer;
    if (!answer) throw error;
    if (answer.status >= 400)
      throw new Error(
        `AUTH_METADATA_FAILED: ${metadataUrl} returned ${answer.status}.`
      );
    throw new Error(
      "AUTH_RESPONSE_INVALID: The server returned a malformed response."
    );
  }
  const endpoint = metadata.revocation_endpoint;
  if (typeof endpoint !== "string" || !endpoint || !isAllowedApiBase(endpoint) || !sameOrigin(endpoint, apiBase))
    throw new Error(
      "AUTH_REVOKE_UNSUPPORTED: The server does not advertise a usable revocation endpoint."
    );
  const { options, seen } = oauthTransport(apiBase);
  try {
    await processRevocationResponse(
      await revocationRequest(
        { ...metadata, revocation_endpoint: endpoint },
        { client_id: clientId },
        None(),
        refreshToken,
        {
          ...options,
          additionalParameters: { token_type_hint: "refresh_token" }
        }
      )
    );
  } catch (error) {
    if (!seen.answer) throw error;
    throw new Error(
      `AUTH_REVOKE_FAILED: Revocation returned ${seen.answer.status}.`
    );
  }
}
function page(title, detail) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Memroot \u2014 ${title}</title></head><body><h1>${title}</h1><p>${detail}</p></body></html>`;
}
function startCallbackServer(expectedState, apiBase) {
  let failure;
  let timer;
  const pending = [];
  const waiters = [];
  const deliver = (result) => {
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(result);
    else pending.push(result);
  };
  const server = createServer((request2, response) => {
    const url = new URL(request2.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== CALLBACK_PATH) {
      response.writeHead(404).end("Not found");
      return;
    }
    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      if (url.searchParams.get("state") !== expectedState) {
        response.writeHead(400).end("State mismatch; rejected.");
        return;
      }
      const description = url.searchParams.get("error_description");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(page("Sign-in failed", "Return to the terminal for details."));
      deliver({
        kind: "error",
        error: terminalSafe(errorParam, 64),
        ...typeof description === "string" ? { description: terminalSafe(description) } : {}
      });
      return;
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      response.writeHead(400).end("Missing code or state.");
      return;
    }
    if (state !== expectedState) {
      response.writeHead(400).end("State mismatch; rejected.");
      return;
    }
    const issuer = url.searchParams.get("iss");
    const issuerOrigin = (() => {
      try {
        return issuer ? new URL(issuer).origin : void 0;
      } catch {
        return void 0;
      }
    })();
    if (!issuer || !issuerOrigin) {
      response.writeHead(400).end("Missing or malformed issuer; rejected.");
      deliver({ kind: "error", error: "iss_missing" });
      return;
    }
    if (issuerOrigin !== new URL(apiBase).origin) {
      response.writeHead(400).end("Issuer mismatch; rejected.");
      deliver({ kind: "error", error: "iss_mismatch" });
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
      page(
        "Sign-in complete",
        "You can close this tab and return to the terminal."
      )
    );
    deliver({ kind: "code", code });
  });
  const fail = (error) => {
    if (failure) return;
    failure = error;
    if (timer) clearTimeout(timer);
    server.close();
    server.closeAllConnections();
    for (const waiter of waiters.splice(0)) waiter.reject(error);
  };
  timer = setTimeout(
    () => fail(
      new Error(
        "AUTH_TIMEOUT: Timed out waiting for the browser sign-in callback. Retry memroot login."
      )
    ),
    LOGIN_TIMEOUT_MS
  );
  return new Promise((resolve3, reject) => {
    server.once("error", (error) => {
      fail(error);
      reject(error);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve3({
        port: address.port,
        next: () => {
          if (failure) return Promise.reject(failure);
          const queued = pending.shift();
          if (queued) return Promise.resolve(queued);
          const result = new Promise(
            (resolve4, rejectPromise) => waiters.push({ resolve: resolve4, reject: rejectPromise })
          );
          result.catch(() => {
          });
          return result;
        },
        close: () => fail(new Error("AUTH_ABORTED: Sign-in was aborted."))
      });
    });
  });
}
function htmlAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function appleScriptString(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
function openBrowser(url) {
  if (process.platform === "darwin") {
    try {
      const child = spawn2("osascript", ["-"], {
        detached: true,
        stdio: ["pipe", "ignore", "ignore"],
        shell: false
      });
      child.on("error", () => {
      });
      child.stdin?.on("error", () => {
      });
      child.stdin?.end(`open location ${appleScriptString(url)}
`);
      child.unref();
    } catch {
    }
    return () => {
    };
  }
  let directory;
  const onSignal = (signal2) => {
    cleanup();
    process.kill(process.pid, signal2);
  };
  const cleanup = () => {
    if (!directory) return;
    rmSync4(directory, { recursive: true, force: true });
    directory = void 0;
    process.off("exit", cleanup);
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  };
  try {
    directory = mkdtempSync(join13(tmpdir(), "memroot-login-"));
    process.on("exit", cleanup);
    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);
    const file = join13(directory, "sign-in.html");
    const target = htmlAttribute(url);
    writeFileSync4(
      file,
      `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${target}"><title>Memroot sign-in</title></head><body><p><a href="${target}">Continue to Memroot sign-in</a></p></body></html>`,
      { flag: "wx", mode: 384 }
    );
    const child = spawn2("xdg-open", [file], {
      detached: true,
      stdio: "ignore",
      shell: false
    });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
  return cleanup;
}
var cachedAccessToken;
async function authorizePkce(requestOptions) {
  const { apiBase, resource } = requestOptions;
  const state = randomBytes4(24).toString("base64url");
  const verifier = randomBytes4(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const waiter = await startCallbackServer(state, apiBase);
  let closePage = () => {
  };
  try {
    const redirectUri = `http://127.0.0.1:${waiter.port}${CALLBACK_PATH}`;
    let clientId = requestOptions.clientId;
    let retriedWithRegistration = false;
    if (requestOptions.registerFirst) {
      const registered = await registerClient(
        apiBase,
        redirectUri,
        requestOptions.registerFirst.clientName
      );
      if (!registered)
        throw new Error(
          "AUTH_REGISTRATION_REQUIRED: The separate agent connection requires dynamic client registration."
        );
      clientId = registered;
      retriedWithRegistration = true;
    }
    for (; ; ) {
      const authorize = new URL(`${apiBase}/authorize`);
      authorize.searchParams.set("response_type", "code");
      authorize.searchParams.set("client_id", clientId);
      authorize.searchParams.set("redirect_uri", redirectUri);
      authorize.searchParams.set("state", state);
      authorize.searchParams.set("code_challenge", challenge);
      authorize.searchParams.set("code_challenge_method", "S256");
      authorize.searchParams.set("scope", REQUESTED_SCOPE);
      if (resource) authorize.searchParams.set("resource", resource);
      const url = authorize.toString();
      if (requestOptions.noBrowser)
        console.log(`Open this URL to sign in:
${url}`);
      else {
        closePage();
        closePage = openBrowser(url);
        console.log(
          `Opening ${apiBase} for sign-in. If the browser did not open or shows an error, visit:
${url}`
        );
      }
      console.log("Waiting for the browser sign-in callback\u2026");
      const result = await waiter.next();
      closePage();
      if (result.kind === "code") {
        const tokens = await exchangeCode(
          apiBase,
          clientId,
          redirectUri,
          result.code,
          state,
          verifier,
          resource
        );
        if (!tokens.refreshToken)
          throw new Error(
            "AUTH_RESPONSE_INVALID: The token endpoint returned no refresh token."
          );
        return { tokens, clientId };
      }
      const rejectedClient = result.error === "invalid_client" || result.error === "unauthorized_client";
      if (rejectedClient && !requestOptions.allowDcr)
        throw new OAuthError(
          result.error,
          "CAPTURE_CLIENT_REJECTED: The server did not accept the Memroot CLI capture client. Update memroot and retry."
        );
      if (rejectedClient && !retriedWithRegistration) {
        retriedWithRegistration = true;
        const registered = await registerClient(
          apiBase,
          redirectUri,
          requestOptions.registerFirst?.clientName
        );
        if (registered && registered !== clientId) {
          clientId = registered;
          console.log(
            "Client was not recognized; registered a fresh client and retrying sign-in."
          );
          continue;
        }
      }
      if (result.error === "iss_missing" || result.error === "iss_mismatch")
        throw new Error(
          "AUTH_ISS_MISMATCH: The callback issuer is missing or does not match the API base. Retry memroot login."
        );
      throw new OAuthError(
        result.error,
        `AUTH_AUTHORIZATION_FAILED: ${result.error}${result.description ? ` \u2014 ${result.description}` : ""}`
      );
    }
  } finally {
    closePage();
    waiter.close();
  }
}
async function confirmAccountSwitch(previous, next, options) {
  console.error(
    `This sign-in is for Memroot account ${terminalSafe(next)}, but this computer is signed in as ${terminalSafe(previous)}.`
  );
  if (options.switchAccount) {
    console.error(
      `Switching this computer to ${terminalSafe(next)} (--switch-account).`
    );
    return;
  }
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const confirmed = await confirm({
      message: `Switch this computer to account ${terminalSafe(next)}? Answer yes only if you signed in with that account yourself.`,
      initialValue: false
    });
    if (!isCancel(confirmed) && confirmed) return;
  }
  throw new Error(
    `ACCOUNT_SWITCH_REFUSED: The sign-in returned another account (${terminalSafe(next)}) than the one this computer uses (${terminalSafe(previous)}); it was discarded. To change accounts, run memroot logout first or pass --switch-account.`
  );
}
function assertCredentialLocks() {
  if (!heartbeat("auth-agy.lock") || !heartbeat("auth.lock"))
    throw new Error("AUTH_LOCK_LOST");
}
async function retireCredential(base, account, clientId, paired = false, recoverOrphan = false) {
  assertCredentialLocks();
  const old = await readSecret(account);
  if (!old) {
    if (paired && credentialStoreKind() === "libsecret")
      throw new Error(
        "AUTH_KEYCHAIN_FAILED: The paired credential could not be read for retirement."
      );
    return;
  }
  if (clientId) await revokeRefreshToken(base, old, clientId);
  else if (!recoverOrphan)
    throw new Error(
      "AGY_AUTH_STATE_INVALID: An Antigravity credential lacks its client registration. Run memroot agy login --force to replace it."
    );
  assertCredentialLocks();
  await deleteSecret(account, true);
  if (await readSecret(account)) throw new Error("AUTH_CREDENTIAL_NOT_REMOVED");
  if (!clientId)
    console.error(
      "Removed the unpaired local Antigravity credential. Its previous remote grant revocation is unverified."
    );
}
async function acceptConnectionAccount(base, verify, options, grant) {
  await withCredentialLock("auth-agy.lock", async () => {
    const principal = await verify();
    if (!principal) throw new Error("AUTH_ACCOUNT_UNVERIFIED");
    const current = await readConfig();
    const oldBase = current.apiBase ?? base;
    const switched = current.userId !== void 0 && (current.userId !== principal || oldBase !== base);
    if (switched && current.userId)
      await confirmAccountSwitch(current.userId, principal, options);
    if (!switched && !grant && current.userId === principal && current.apiBase === base)
      return;
    await withCredentialLock("auth.lock", async () => {
      assertCredentialLocks();
      const restClient = current.clientIdApiBase === oldBase ? current.clientId : void 0;
      const agyClient = current.agyMcpClient?.apiBase === oldBase ? current.agyMcpClient.clientId : void 0;
      const recoverOrphan = grant?.kind === "agy" && options.force === true;
      if (switched || grant?.kind === "agy") {
        await retireCredential(
          oldBase,
          agyAccount(oldBase),
          agyClient,
          Boolean(agyClient),
          recoverOrphan
        );
        if (agyClient) {
          delete current.agyMcpClient;
          await writeConfig(current);
        }
      }
      if (switched || grant?.kind === "rest" && restClient && restClient !== grant.clientId) {
        await retireCredential(
          oldBase,
          restAccount(oldBase),
          restClient ?? CLI_CLIENT_ID,
          Boolean(restClient)
        );
        cachedAccessToken = void 0;
        if (restClient) {
          delete current.clientId;
          delete current.clientIdApiBase;
          await writeConfig(current);
        }
      }
      if (switched) {
        if (grant || oldBase !== base)
          await retireCredential(
            oldBase,
            captureAccount(oldBase),
            CLI_CLIENT_ID
          );
      }
      const next = { ...current, apiBase: base, userId: principal };
      let account;
      if (grant?.kind === "rest") {
        next.clientId = grant.clientId;
        next.clientIdApiBase = base;
        account = restAccount(base);
        cachedAccessToken = void 0;
      } else if (grant?.kind === "capture") {
        account = captureAccount(base);
      } else if (grant?.kind === "agy") {
        next.agyMcpClient = {
          apiBase: base,
          clientId: grant.clientId,
          principalId: principal
        };
        account = agyAccount(base);
      }
      assertCredentialLocks();
      if (!account || !grant) {
        await writeConfig(next);
        return;
      }
      const staged = { ...current };
      if (grant.kind === "agy")
        staged.agyMcpClient = {
          apiBase: base,
          clientId: grant.clientId,
          principalId: principal
        };
      if (grant.kind === "rest") {
        staged.clientId = grant.clientId;
        staged.clientIdApiBase = base;
      }
      await writeConfig(staged);
      try {
        await storeSecret(account, grant.refresh);
        assertCredentialLocks();
        await writeConfig(next);
      } catch (error) {
        assertCredentialLocks();
        await writeConfig(staged);
        const stored = await readSecret(account);
        if (!stored && credentialStoreKind() === "libsecret") throw error;
        if (stored === grant.refresh) {
          await deleteSecret(account, true);
          if (await readSecret(account))
            throw new Error("AUTH_CREDENTIAL_NOT_REMOVED");
        }
        await writeConfig(current);
        throw error;
      }
    });
  });
}
async function loginMcp(apiBase, options, settle) {
  assertCredentialStoreAvailable();
  const { tokens } = await authorizePkce({
    apiBase,
    clientId: CLI_CLIENT_ID,
    noBrowser: Boolean(options.noBrowser),
    resource: `${apiBase}/mcp`,
    allowDcr: false
  });
  const refreshToken = tokens.refreshToken;
  try {
    await acceptConnectionAccount(
      apiBase,
      () => settle(
        new TokenBroker(apiBase, {
          token: tokens.accessToken,
          expiresAt: Date.now() + (tokens.expiresIn ?? 300) * 1e3
        })
      ),
      options,
      { kind: "capture", clientId: CLI_CLIENT_ID, refresh: refreshToken }
    );
  } catch (error) {
    await revokeRefreshToken(apiBase, refreshToken, CLI_CLIENT_ID).catch(
      () => {
      }
    );
    throw error;
  }
  console.log(
    "Memroot CLI connection authorized; its refresh token is stored in the OS credential store. Session capture remains controlled by memroot capture on|off."
  );
}

// src/project/command.ts
function parseProjectList(value) {
  const v = value;
  if (v?.schema_version !== 2 || !validUuid(v.principal_id) || !validUuid(v.tenant_id) || v.truncated !== false || !Array.isArray(v.projects) || v.projects.length > 100 || v.projects.some(
    (p) => !validUuid(p.project_id) || p.name !== void 0 && !isConsoleProjectName(p.name)
  ))
    throw new Error(
      "PROJECT_REAUTHORIZATION_REQUIRED: Update Memroot and authorize the Memroot CLI connection again with memroot project login. Project commands require the new project-selection API."
    );
  return v;
}
var PENDING_FILE = "project-create-pending.json";
function pendingPath() {
  return join14(memrootConfigDir(), PENDING_FILE);
}
function readPending() {
  try {
    const raw = readPrivateFileIfExists(pendingPath(), 4096);
    if (raw === void 0) return void 0;
    const v = JSON.parse(raw);
    return typeof v.name === "string" && typeof v.apiBase === "string" && validUuid(v.principalId) && validUuid(v.idempotencyKey) ? v : void 0;
  } catch {
    return void 0;
  }
}
function removeLegacySessionRecords() {
  try {
    const dir = legacySessionRecordsDir();
    const info = lstatSync7(dir);
    if (!info.isDirectory() || info.isSymbolicLink()) return;
    const records = listFiles(dir).filter((name) => /^[a-f0-9]{64}\.json$/.test(name)).map((name) => {
      const path = join14(dir, name);
      try {
        const value = JSON.parse(
          readPrivateFileIfExists(path, 16 * 1024) ?? "null"
        );
        return { at: lstatSync7(path).mtimeMs, selection: value?.selection };
      } catch {
        return { at: 0, selection: void 0 };
      }
    }).sort((a2, b) => b.at - a2.at);
    const adopted = /* @__PURE__ */ new Set();
    const fresh = !existsSync3(projectSelectionPath());
    for (const { selection } of fresh ? records : []) {
      const v = selection;
      if (!v || typeof v.apiBase !== "string" || !validUuid(v.principalId) || !validUuid(v.tenantId) || !validUuid(v.projectId))
        continue;
      const key = `${v.apiBase}|${v.principalId}`;
      if (adopted.has(key)) continue;
      adopted.add(key);
      if (readSelection(v.apiBase, v.principalId)) continue;
      try {
        writeSelection({
          apiBase: v.apiBase,
          principalId: v.principalId,
          tenantId: v.tenantId,
          projectId: v.projectId,
          name: typeof v.name === "string" && v.name ? v.name : v.projectId,
          source: "explicit"
        });
      } catch {
      }
    }
    const cutoff = Date.now() - LEGACY_RECORD_TTL_MS;
    for (const name of listFiles(dir))
      try {
        if (lstatSync7(join14(dir, name)).mtimeMs < cutoff)
          rmSync5(join14(dir, name), { force: true });
      } catch {
      }
    if (listFiles(dir).length === 0)
      rmSync5(dir, { recursive: true, force: true });
  } catch {
  }
}
var LEGACY_RECORD_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
function releaseParkedCapture() {
  try {
    if (!CAPTURE_AGENTS.some((agent) => activeAgreementFor(agent)) || listJobIds().length === 0)
      return;
    spawnWorker();
  } catch {
  }
}
function label(p) {
  return p.name ?? p.project_id;
}
function choose(base, projects, project, source) {
  try {
    return writeSelection({
      apiBase: base,
      principalId: projects.principal_id,
      tenantId: projects.tenant_id,
      projectId: project.project_id,
      name: label(project),
      source
    });
  } catch {
    throw new Error(
      "PROJECT_SELECTION_FAILED: The selection could not be saved in ~/.memroot; check that directory and retry."
    );
  }
}
function resolveSelection(base, projects) {
  try {
    refreshBindings(
      base,
      projects.principal_id,
      projects.tenant_id,
      projects.projects
    );
  } catch {
  }
  const recorded = readSelection(base, projects.principal_id);
  const live = recorded && recorded.tenantId === projects.tenant_id && projects.projects.find((p) => p.project_id === recorded.projectId);
  if (recorded && !live)
    try {
      clearSelection(base, projects.principal_id, recorded.projectId);
    } catch {
    }
  if (recorded && live) {
    if (live.name && live.name !== recorded.name)
      return { selection: choose(base, projects, live, recorded.source) };
    return { selection: recorded };
  }
  if (projects.projects.length === 1)
    return {
      selection: choose(
        base,
        projects,
        projects.projects[0],
        "sole_project"
      ),
      ...recorded ? { stale: recorded } : {}
    };
  return recorded ? { stale: recorded } : {};
}
function choiceRequired(projects, stale) {
  const command = projectCommandPrefix();
  const names = projects.projects.map((p) => `"${label(p)}"`).join(", ") || "(none)";
  return new Error(
    `${stale ? `PROJECT_SELECTION_INVALID: The selected project "${stale.name}" is no longer available to this account. ` : "PROJECT_CHOICE_REQUIRED: No project is selected on this computer. "}Choose one: ${command} use "<name>"; your projects: ${names}.${projects.projects.length === 0 ? ` Create one with ${command} create "<name>".` : ""}`
  );
}
var COVERS = {
  repository: "This folder, its subfolders and every worktree of this repository.",
  subtree: "This folder and its subfolders, in every worktree of this repository.",
  folder: "This folder and its subfolders, up to any git repository inside it."
};
var sameFolder2 = (a2, b) => FOLD_CASE ? a2.toLowerCase() === b.toLowerCase() : a2 === b;
function bindingOutput(binding) {
  return {
    folder: binding.folder,
    project_id: binding.projectId,
    name: binding.name,
    ...binding.stale ? { stale: true } : {}
  };
}
function existingFolder(path) {
  let directory = false;
  try {
    directory = statSync(path).isDirectory();
  } catch {
    directory = false;
  }
  if (!directory)
    throw new Error("INVALID_ARGUMENT: The folder does not exist.");
  return path;
}
function bindingToRemove(base, principalId, folder) {
  if (folder === void 0) return bindingFor(base, principalId, process.cwd());
  const forms = [
    bindingFolder(folder).folder,
    canonicalFolder(folder),
    normalize3(resolve2(folder))
  ];
  return readBindings(base, principalId).find(
    (b) => forms.some((form) => sameFolder2(b.folder, form))
  ) ?? bindingFor(base, principalId, folder);
}
var PROJECT_ACTIONS = [
  "list",
  "use",
  "create",
  "status",
  "unbind",
  "login"
];
var FOLDER_PROJECT_ACTIONS = ["unbind"];
async function projectCommand(args, _bundledAgent, transport) {
  const requested = args.shift() ?? "status";
  const action = PROJECT_ACTIONS.includes(requested) ? requested : "use";
  if (action === "use" && requested !== "use") args.unshift(requested);
  const parsed = (0, node_util_compat_exports.parseArgs)({
    args,
    allowPositionals: true,
    strict: true,
    options: {
      // Accepted for compatibility with 0.2.0-0.5.0 skills; the selection is
      // machine-wide, so neither changes what is selected.
      agent: { type: "string" },
      session: { type: "string" },
      "api-base": { type: "string" },
      "no-browser": { type: "boolean" },
      "switch-account": { type: "boolean" },
      here: { type: "boolean" },
      folder: { type: "string" }
    }
  });
  if (parsed.positionals.length > 1)
    throw new Error("INVALID_ARGUMENT: Pass the project name as one argument.");
  const agentOption = parsed.values.agent;
  if (agentOption !== void 0 && agentOption !== "claude" && agentOption !== "codex" && agentOption !== "grok")
    throw new Error("INVALID_AGENT");
  const target = parsed.positionals[0];
  const apiBase = parsed.values["api-base"];
  const noBrowser = parsed.values["no-browser"] ?? false;
  const switchAccount = parsed.values["switch-account"] ?? false;
  if (target !== void 0 && action !== "use" && action !== "create")
    throw new Error("INVALID_ARGUMENT: This project command takes no name.");
  const folderValue = action === "status" && parsed.values.folder?.trim() === "" ? void 0 : parsed.values.folder;
  if (parsed.values.here && folderValue !== void 0)
    throw new Error("INVALID_ARGUMENT: Pass --here or --folder, not both.");
  if (folderValue !== void 0 && !folderValue.trim())
    throw new Error("INVALID_ARGUMENT: --folder needs a folder path.");
  const folder = folderValue !== void 0 ? resolve2(folderValue) : parsed.values.here ? process.cwd() : void 0;
  if (folder !== void 0 && (action === "list" || action === "login"))
    throw new Error(
      "INVALID_ARGUMENT: --here and --folder apply to use, create, status and unbind."
    );
  if (transport && (folder !== void 0 || FOLDER_PROJECT_ACTIONS.includes(action)))
    throw new Error(
      "AGY_PROJECT_SCOPE_UNSUPPORTED: Antigravity uses the computer-wide Memroot project."
    );
  const config = await readConfig();
  const base = resolveApiBase(apiBase ? { apiBase } : {}, config);
  const command = projectCommandPrefix();
  if (action === "unbind") {
    if (noBrowser || switchAccount)
      throw new Error(
        "INVALID_ARGUMENT: unbind takes only --here or --folder."
      );
    const principalId = config.userId;
    const binding = principalId ? bindingToRemove(base, principalId, folder) : void 0;
    if (principalId && binding)
      try {
        unbindFolder(base, principalId, binding.folder);
      } catch {
        throw new Error(
          "PROJECT_FOLDER_BINDING_FAILED: The folder binding could not be removed in ~/.memroot; check that directory and retry."
        );
      }
    releaseParkedCapture();
    console.log(
      JSON.stringify({
        unbound: binding ? bindingOutput(binding) : null,
        ...binding ? {} : { note: "No Memroot folder binding applies to this folder." }
      })
    );
    return;
  }
  const userAgent = `memroot-cli/${"0.23.1"}`;
  const client = transport?.client(base) ?? new McpClient(base, new TokenBroker(base), userAgent);
  const fetchProjects = async (via = client) => {
    let projects2;
    try {
      projects2 = parseProjectList(await via.call("projects_list", {}));
    } catch (e) {
      if (e instanceof AuthRequiredError)
        throw new Error(
          "PROJECT_LOGIN_REQUIRED: Run memroot project login to authorize project commands. This does not enable session capture."
        );
      throw e;
    }
    return projects2;
  };
  const remember = (projects2, extra = []) => {
    try {
      writeProjectList(base, projects2.principal_id, transport ? "agy" : "cli", [
        ...projects2.projects.map((p) => p.project_id),
        ...extra
      ]);
    } catch {
    }
  };
  const listProjects = async (via = client) => {
    if (transport) {
      const projects2 = await fetchProjects(via);
      const current = await readConfig();
      if (current.apiBase !== base || current.userId !== projects2.principal_id)
        throw new Error("AGY_ACCOUNT_MISMATCH");
      remember(projects2);
      return projects2;
    }
    let listed;
    await acceptConnectionAccount(
      base,
      async () => {
        listed = await fetchProjects(via);
        return listed.principal_id;
      },
      { switchAccount }
    );
    remember(listed);
    return listed;
  };
  if (action === "login") {
    let projects2;
    if (transport)
      await transport.login(base, { noBrowser, switchAccount }, async (via) => {
        projects2 = await listProjects(via);
      });
    else
      await loginMcp(base, { noBrowser, switchAccount }, async (broker) => {
        projects2 = await fetchProjects(new McpClient(base, broker, userAgent));
        return projects2.principal_id;
      });
    if (!projects2) throw new Error("PROJECT_LOGIN_FAILED");
    if (!transport) remember(projects2);
    const { selection } = resolveSelection(base, projects2);
    console.log(
      selection ? `Project for this computer: ${JSON.stringify(selection.name)} (${selection.projectId}).` : `No project is selected on this computer yet. Choose one: ${command} use "<name>".`
    );
    return;
  }
  if (noBrowser)
    throw new Error(
      "INVALID_ARGUMENT: --no-browser applies only to project login."
    );
  if (folder !== void 0 && action !== "status") existingFolder(folder);
  const projects = await listProjects();
  removeLegacySessionRecords();
  if (action === "list") {
    const selected2 = readSelection(base, projects.principal_id);
    try {
      refreshBindings(
        base,
        projects.principal_id,
        projects.tenant_id,
        projects.projects
      );
    } catch {
    }
    console.log(
      JSON.stringify({
        ...projects,
        selected_project_id: selected2 && selected2.tenantId === projects.tenant_id ? selected2.projectId : null,
        ...!transport ? {
          bindings: readBindings(base, projects.principal_id).map((b) => ({
            ...bindingOutput(b),
            ...folderMissing(b.folder) ? { missing: true } : {}
          }))
        } : {}
      })
    );
    return;
  }
  if (action === "status") {
    const { selection, stale } = resolveSelection(base, projects);
    const found = !transport ? bindingMatchFor(base, projects.principal_id, folder ?? process.cwd()) : void 0;
    if (found) {
      const { binding, via } = found;
      console.log(
        JSON.stringify({
          selected: binding.stale ? null : { project_id: binding.projectId, name: binding.name },
          scope: "folder",
          folder: binding.folder,
          ...via === "folder" ? {} : { via },
          ...binding.stale ? {
            stale: { project_id: binding.projectId, name: binding.name },
            next: `${command} use "<name>" ${folderOption(binding.folder)}`
          } : {}
        })
      );
      if (!binding.stale) releaseParkedCapture();
      return;
    }
    console.log(
      JSON.stringify({
        selected: selection ? {
          project_id: selection.projectId,
          name: selection.name,
          source: selection.source
        } : null,
        scope: "computer",
        ...stale ? { stale: { project_id: stale.projectId, name: stale.name } } : {},
        ...selection ? {} : { next: `${command} use "<name>"` }
      })
    );
    if (selection) releaseParkedCapture();
    return;
  }
  const named = () => {
    if (!target?.trim()) return void 0;
    const matches = projects.projects.filter(
      (p) => p.project_id === target || p.name === target.normalize("NFC").trim()
    );
    const match2 = matches[0];
    if (matches.length !== 1 || !match2)
      throw new Error(
        matches.length ? "PROJECT_NAME_AMBIGUOUS: Use the project ID from project list." : `PROJECT_NOT_FOUND: Use ${command} list to choose an authorized project.`
      );
    return match2;
  };
  const bind = (project) => {
    const place = bindingFolder(folder);
    let binding;
    try {
      binding = bindFolder({
        apiBase: base,
        principalId: projects.principal_id,
        tenantId: projects.tenant_id,
        projectId: project.project_id,
        name: label(project),
        folder: place.folder
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("PROJECT_FOLDER_LIMIT"))
        throw error;
      throw new Error(
        "PROJECT_FOLDER_BINDING_FAILED: The folder binding could not be saved in ~/.memroot; check that directory and retry."
      );
    }
    releaseParkedCapture();
    const consent = readConsent();
    const capturing = consent.kind === "ok" && consent.consent.enabled && consent.consent.apiBase === base;
    console.log(
      JSON.stringify({
        project_id: binding.projectId,
        name: binding.name,
        scope: "folder",
        folder: binding.folder,
        ...capturing ? {
          capture: "Session captures in this folder go to this Memroot project."
        } : {},
        covers: COVERS[place.covers],
        ...place.mapped ? {
          note: "This folder is in a linked git worktree; the binding is stored for the main checkout, so every worktree of the repository uses it."
        } : {}
      })
    );
  };
  let selected;
  if (action === "create") {
    const name = (target ?? "").normalize("NFC").trim();
    if (!isConsoleProjectName(name))
      throw new Error(
        "INVALID_ARGUMENT: Use a visible, single-line project name of 1 to 64 characters."
      );
    const prior = readPending();
    const pending = prior && prior.name === name && prior.apiBase === base && prior.principalId === projects.principal_id ? prior : {
      name,
      apiBase: base,
      principalId: projects.principal_id,
      idempotencyKey: randomUUID4()
    };
    writePrivateFileAtomic(pendingPath(), `${JSON.stringify(pending)}
`);
    const created = await client.call("projects_create", {
      name,
      idempotency_key: pending.idempotencyKey
    });
    if (created.schema_version !== 2 || created.principal_id !== projects.principal_id || created.tenant_id !== projects.tenant_id || !validUuid(created.project_id) || created.name !== name)
      throw new Error(
        "PROJECT_RESPONSE_INVALID: The server did not confirm this account's new project."
      );
    const createdId = created.project_id;
    remember(projects, [createdId]);
    try {
      if (folder !== void 0) {
        bind({ project_id: createdId, name });
      } else
        selected = choose(
          base,
          projects,
          { project_id: createdId, name },
          "explicit"
        );
    } catch {
      throw new Error(
        `PROJECT_CREATED_SELECTION_FAILED: Project ${createdId} was created. Do not repeat create; select it with ${command} use ${createdId}${folder !== void 0 ? ` ${folderOption(folder)}` : ""}.`
      );
    }
    try {
      removeFile(pendingPath());
    } catch {
    }
    if (folder !== void 0) return;
  } else if (folder !== void 0) {
    let project = named();
    if (!project) {
      const current = bindingFor(base, projects.principal_id, folder);
      if (current && !current.stale)
        project = { project_id: current.projectId, name: current.name };
      else {
        const { selection, stale } = resolveSelection(base, projects);
        if (!selection) throw choiceRequired(projects, stale);
        project = { project_id: selection.projectId, name: selection.name };
      }
    }
    bind(project);
    return;
  } else {
    const match2 = named();
    if (match2) selected = choose(base, projects, match2, "explicit");
    else {
      const { selection, stale } = resolveSelection(base, projects);
      if (!selection) throw choiceRequired(projects, stale);
      selected = selection;
    }
  }
  if (!selected) throw new Error("PROJECT_SELECTION_FAILED");
  releaseParkedCapture();
  const here = bindingFor(base, projects.principal_id, process.cwd());
  const keeps = here && (here.stale || here.projectId !== selected.projectId) ? {
    note: `This folder stays bound to Memroot project ${JSON.stringify(here.name)} (${here.folder}). To switch it too: ${command} use "<name>" ${folderOption(here.folder)}.`
  } : {};
  console.log(
    JSON.stringify({
      project_id: selected.projectId,
      name: selected.name,
      scope: "computer",
      ...keeps
    })
  );
}

// src/plugin/project.ts
projectCommand(process.argv.slice(2), "grok").catch((error) => {
  console.error(
    error instanceof Error ? error.message : "PROJECT_COMMAND_FAILED"
  );
  process.exitCode = 1;
});
/*! Bundled license information:

smol-toml/dist/error.js:
smol-toml/dist/primitive.js:
smol-toml/dist/date.js:
smol-toml/dist/extract.js:
smol-toml/dist/util.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
