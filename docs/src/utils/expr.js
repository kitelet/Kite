/**
 * @file Safe, zero-eval expression parser and evaluator for Kite.
 * @module utils/expr
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Why not `new Function()` or `eval()`?
 * Because Kite is built to be taught and trusted. Beginners and students will
 * copy and paste snippets from the web. Kite ensures safety by default with a
 * hand-crafted, recursive-descent expression evaluator that parses arithmetic,
 * comparisons, property lookups, and assignments without touching runtime code generation.
 */

import { warn } from './log.js';

// Blocklist of forbidden identifiers and properties to prevent sandbox escapes
export const BANNED_IDENTIFIERS = new Set([
  'window',
  'document',
  'globalThis',
  'global',
  'eval',
  'Function',
  'constructor',
  '__proto__',
  'prototype'
]);

// Whitelist of safe standard global constructors and utilities
const SAFE_GLOBALS = {
  Number,
  String,
  Boolean,
  Math,
  Date,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  JSON,
  Array,
  Object
};

/**
 * Token types produced by the tokenizer.
 * @enum {string}
 */
const TokenType = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',
  OPERATOR: 'OPERATOR',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF'
};

/**
 * Tokenizes a raw expression string into an array of lexical tokens.
 *
 * @param {string} input - The raw expression string (e.g. "count++", "user.name == 'Alice'").
 * @returns {Array<{ type: string, value: any }>} List of tokens.
 */
export function tokenize(input) {
  const tokens = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    // 0. Skip comments: // ... and /* ... */
    if (ch === '/' && input[i + 1] === '/') {
      while (i < len && input[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && input[i + 1] === '*') {
      i += 2;
      while (i < len && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // 1. Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // 2. Numbers (integers and floating point)
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(input[i + 1]))) {
      let numStr = '';
      while (i < len && (/[\d.]/.test(input[i]))) {
        numStr += input[i++];
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(numStr) });
      continue;
    }

    // 3. String literals ('...' or "...")
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let str = '';
      i++; // skip opening quote
      while (i < len && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < len) {
          i++;
          str += input[i];
        } else {
          str += input[i];
        }
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: TokenType.STRING, value: str });
      continue;
    }

    // 4. Identifiers and keyword literals (true, false, null, undefined)
    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(input[i])) {
        ident += input[i++];
      }
      if (ident === 'true') {
        tokens.push({ type: TokenType.IDENTIFIER, value: true, isLiteral: true });
      } else if (ident === 'false') {
        tokens.push({ type: TokenType.IDENTIFIER, value: false, isLiteral: true });
      } else if (ident === 'null') {
        tokens.push({ type: TokenType.IDENTIFIER, value: null, isLiteral: true });
      } else if (ident === 'undefined') {
        tokens.push({ type: TokenType.IDENTIFIER, value: undefined, isLiteral: true });
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: ident });
      }
      continue;
    }

    // 5. Multi-character operators
    const twoChars = input.slice(i, i + 2);
    const threeChars = input.slice(i, i + 3);

    if (threeChars === '===' || threeChars === '!==') {
      tokens.push({ type: TokenType.OPERATOR, value: threeChars });
      i += 3;
      continue;
    }

    if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '=>'].includes(twoChars)) {
      tokens.push({ type: TokenType.OPERATOR, value: twoChars });
      i += 2;
      continue;
    }

    // 6. Single character operators and punctuation
    if (['+', '-', '*', '/', '%', '!', '<', '>', '=', '?', ':'].includes(ch)) {
      tokens.push({ type: TokenType.OPERATOR, value: ch });
      i++;
      continue;
    }

    if (['(', ')', '[', ']', '{', '}', ',', '.', ';'].includes(ch)) {
      tokens.push({ type: TokenType.PUNCTUATION, value: ch });
      i++;
      continue;
    }

    // Unknown character encountered
    warn(`Unexpected character '${ch}' in expression: "${input}"`);
    i++;
  }

  tokens.push({ type: TokenType.EOF, value: null });
  return tokens;
}

/**
 * Global helper registry shared across all expressions.
 * @type {Object.<string, Function>}
 */
export const globalHelpers = {};

/**
 * Registers a global helper function for expression evaluation.
 * @param {string} name
 * @param {Function} fn
 */
export function registerGlobalHelper(name, fn) {
  if (name && typeof fn === 'function') {
    globalHelpers[name] = fn;
  }
}

/**
 * Parser and Evaluator class for safe Kite expressions.
 */
class ExpressionEvaluator {
  /**
   * @param {Array<{ type: string, value: any }>} tokens - Tokenized stream.
   * @param {Object} scope - Scope object providing variable bindings.
   * @param {Object} [helpers={}] - Globally registered helper functions.
   */
  constructor(tokens, scope, helpers = {}) {
    this.tokens = tokens;
    this.pos = 0;
    this.scope = scope || {};
    this.helpers = { ...globalHelpers, ...(helpers || {}) };
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume() {
    return this.tokens[this.pos++];
  }

  match(type, value) {
    const token = this.peek();
    if (!token) return false;
    if (type && token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    this.pos++;
    return true;
  }

  /**
   * Evaluates a sequence of statements separated by semicolons.
   *
   * @returns {any} Result of the last evaluated statement.
   */
  parseProgram() {
    let result = undefined;
    while (this.peek() && this.peek().type !== TokenType.EOF) {
      if (this.match(TokenType.PUNCTUATION, ';')) continue;

      // Handle if-else statements: if (cond) { ... } else { ... } or if (cond) stmt;
      if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'if') {
        this.consume(); // consume 'if'
        this.match(TokenType.PUNCTUATION, '(');
        const cond = this.parseExpression();
        this.match(TokenType.PUNCTUATION, ')');
        const condVal = cond && cond.type === 'REF' ? cond.get() : cond;

        if (condVal) {
          if (this.match(TokenType.PUNCTUATION, '{')) {
            while (this.peek() && this.peek().type !== TokenType.EOF && !this.match(TokenType.PUNCTUATION, '}')) {
              if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'return') {
                this.consume();
                if (this.peek() && ((this.peek().type === TokenType.PUNCTUATION && this.peek().value === ';') || this.peek().type === TokenType.EOF)) {
                  this.match(TokenType.PUNCTUATION, ';');
                  return undefined;
                }
                const retResult = this.parseExpression();
                this.match(TokenType.PUNCTUATION, ';');
                return retResult && retResult.type === 'REF' ? retResult.get() : retResult;
              }
              const s = this.parseExpression();
              result = s && s.type === 'REF' ? s.get() : s;
              this.match(TokenType.PUNCTUATION, ';');
            }
          } else {
            if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'return') {
              this.consume();
              if (this.peek() && ((this.peek().type === TokenType.PUNCTUATION && this.peek().value === ';') || this.peek().type === TokenType.EOF)) {
                this.match(TokenType.PUNCTUATION, ';');
                return undefined;
              }
              const retResult = this.parseExpression();
              this.match(TokenType.PUNCTUATION, ';');
              return retResult && retResult.type === 'REF' ? retResult.get() : retResult;
            }
            const s = this.parseExpression();
            result = s && s.type === 'REF' ? s.get() : s;
            this.match(TokenType.PUNCTUATION, ';');
          }

          // Skip else branch if present
          if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'else') {
            this.consume();
            if (this.match(TokenType.PUNCTUATION, '{')) {
              let depth = 1;
              while (this.peek() && this.peek().type !== TokenType.EOF) {
                const c = this.consume();
                if (c.type === TokenType.PUNCTUATION && c.value === '{') depth++;
                else if (c.type === TokenType.PUNCTUATION && c.value === '}') {
                  depth--;
                  if (depth === 0) break;
                }
              }
            } else {
              this.parseExpression();
              this.match(TokenType.PUNCTUATION, ';');
            }
          }
        } else {
          // Condition is falsy: skip then branch
          if (this.match(TokenType.PUNCTUATION, '{')) {
            let depth = 1;
            while (this.peek() && this.peek().type !== TokenType.EOF) {
              const c = this.consume();
              if (c.type === TokenType.PUNCTUATION && c.value === '{') depth++;
              else if (c.type === TokenType.PUNCTUATION && c.value === '}') {
                depth--;
                if (depth === 0) break;
              }
            }
          } else {
            this.parseExpression();
            this.match(TokenType.PUNCTUATION, ';');
          }

          // Execute else branch if present
          if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'else') {
            this.consume();
            if (this.match(TokenType.PUNCTUATION, '{')) {
              while (this.peek() && this.peek().type !== TokenType.EOF && !this.match(TokenType.PUNCTUATION, '}')) {
                if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'return') {
                  this.consume();
                  if (this.peek() && ((this.peek().type === TokenType.PUNCTUATION && this.peek().value === ';') || this.peek().type === TokenType.EOF)) {
                    this.match(TokenType.PUNCTUATION, ';');
                    return undefined;
                  }
                  const retResult = this.parseExpression();
                  this.match(TokenType.PUNCTUATION, ';');
                  return retResult && retResult.type === 'REF' ? retResult.get() : retResult;
                }
                const s = this.parseExpression();
                result = s && s.type === 'REF' ? s.get() : s;
                this.match(TokenType.PUNCTUATION, ';');
              }
            } else {
              const s = this.parseExpression();
              result = s && s.type === 'REF' ? s.get() : s;
              this.match(TokenType.PUNCTUATION, ';');
            }
          }
        }
        continue;
      }

      if (this.peek() && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'return') {
        this.consume(); // consume 'return'
        if (this.peek() && ((this.peek().type === TokenType.PUNCTUATION && this.peek().value === ';') || this.peek().type === TokenType.EOF)) {
          this.match(TokenType.PUNCTUATION, ';');
          return undefined;
        }
        const retResult = this.parseExpression();
        this.match(TokenType.PUNCTUATION, ';');
        return retResult && retResult.type === 'REF' ? retResult.get() : retResult;
      }
      const stmtResult = this.parseExpression();
      result = stmtResult && stmtResult.type === 'REF' ? stmtResult.get() : stmtResult;
      this.match(TokenType.PUNCTUATION, ';');
    }
    return result;
  }

  /**
   * Entry point: parses an assignment, sequence, or ternary expression.
   */
  parseExpression() {
    return this.parseAssignment();
  }

  /**
   * Parses assignments: `x = y`, `x += y`, `x -= y` or arrow functions `t => expr`
   */
  parseAssignment() {
    // 0. Check for function expression: function(param, ...) { ... }
    const token = this.peek();
    if (token && token.type === TokenType.IDENTIFIER && token.value === 'function') {
      this.consume(); // consume 'function'
      if (this.peek() && this.peek().type === TokenType.IDENTIFIER) {
        this.consume(); // optional function name
      }
      this.match(TokenType.PUNCTUATION, '(');
      const params = [];
      if (!this.match(TokenType.PUNCTUATION, ')')) {
        while (true) {
          if (this.peek() && this.peek().type === TokenType.IDENTIFIER) {
            params.push(this.consume().value);
          }
          if (this.match(TokenType.PUNCTUATION, ',')) continue;
          this.match(TokenType.PUNCTUATION, ')');
          break;
        }
      }
      this.match(TokenType.PUNCTUATION, '{');
      const bodyTokens = [];
      let depth = 1;
      while (this.peek() && this.peek().type !== TokenType.EOF) {
        const cur = this.consume();
        if (cur.type === TokenType.PUNCTUATION && cur.value === '{') depth++;
        else if (cur.type === TokenType.PUNCTUATION && cur.value === '}') {
          depth--;
          if (depth === 0) break;
        }
        bodyTokens.push(cur);
      }
      bodyTokens.push({ type: TokenType.EOF, value: null });

      const capturedHelpers = this.helpers;
      return function(...args) {
        const methodScope = Object.create(this || {});
        methodScope['this'] = this || {};
        params.forEach((p, idx) => { methodScope[p] = args[idx]; });
        const evaluator = new ExpressionEvaluator(bodyTokens, methodScope, capturedHelpers);
        return evaluator.parseProgram();
      };
    }

    // 1. Check for identifier arrow function: param => expr
    if (token && token.type === TokenType.IDENTIFIER) {
      const nextToken = this.tokens[this.pos + 1];
      if (nextToken && nextToken.type === TokenType.OPERATOR && nextToken.value === '=>') {
        const param = this.consume().value;
        this.consume(); // consume '=>'
        const bodyTokens = [];
        let parenDepth = 0;
        let bracketDepth = 0;
        while (this.peek() && this.peek().type !== TokenType.EOF) {
          const t = this.peek();
          if (t.type === TokenType.PUNCTUATION && (t.value === ',' || t.value === ')')) {
            if (parenDepth === 0 && bracketDepth === 0) break;
          }
          if (t.type === TokenType.PUNCTUATION) {
            if (t.value === '(') parenDepth++;
            else if (t.value === ')') parenDepth--;
            else if (t.value === '[') bracketDepth++;
            else if (t.value === ']') bracketDepth--;
          }
          bodyTokens.push(this.consume());
        }
        bodyTokens.push({ type: TokenType.EOF, value: null });

        return (arg) => {
          const childScope = Object.assign(Object.create(this.scope), { [param]: arg });
          const bodyEvaluator = new ExpressionEvaluator(bodyTokens, childScope, this.helpers);
          return bodyEvaluator.parseExpression();
        };
      }
    }

    // 2. Check for parenthesized arrow function: (param) => expr
    if (token && token.type === TokenType.PUNCTUATION && token.value === '(') {
      const next1 = this.tokens[this.pos + 1];
      const next2 = this.tokens[this.pos + 2];
      const next3 = this.tokens[this.pos + 3];
      if (
        next1 && next1.type === TokenType.IDENTIFIER &&
        next2 && next2.type === TokenType.PUNCTUATION && next2.value === ')' &&
        next3 && next3.type === TokenType.OPERATOR && next3.value === '=>'
      ) {
        this.consume(); // '('
        const param = this.consume().value; // identifier
        this.consume(); // ')'
        this.consume(); // '=>'

        const bodyTokens = [];
        let parenDepth = 0;
        let bracketDepth = 0;
        while (this.peek() && this.peek().type !== TokenType.EOF) {
          const t = this.peek();
          if (t.type === TokenType.PUNCTUATION && (t.value === ',' || t.value === ')')) {
            if (parenDepth === 0 && bracketDepth === 0) break;
          }
          if (t.type === TokenType.PUNCTUATION) {
            if (t.value === '(') parenDepth++;
            else if (t.value === ')') parenDepth--;
            else if (t.value === '[') bracketDepth++;
            else if (t.value === ']') bracketDepth--;
          }
          bodyTokens.push(this.consume());
        }
        bodyTokens.push({ type: TokenType.EOF, value: null });

        return (arg) => {
          const childScope = Object.assign(Object.create(this.scope), { [param]: arg });
          const bodyEvaluator = new ExpressionEvaluator(bodyTokens, childScope, this.helpers);
          return bodyEvaluator.parseExpression();
        };
      }
    }

    let node = this.parseTernary();

    const opToken = this.peek();
    if (opToken && opToken.type === TokenType.OPERATOR && ['=', '+=', '-=', '*=', '/='].includes(opToken.value)) {
      const op = this.consume().value;
      const right = this.parseAssignment();

      if (!node || node.type !== 'REF') {
        warn(`Invalid left-hand side in assignment expression.`);
        return undefined;
      }

      let nextVal;
      const currentVal = node.get();
      if (op === '=') nextVal = right;
      else if (op === '+=') nextVal = currentVal + right;
      else if (op === '-=') nextVal = currentVal - right;
      else if (op === '*=') nextVal = currentVal * right;
      else if (op === '/=') nextVal = currentVal / right;

      node.set(nextVal);
      return nextVal;
    }

    return node && node.type === 'REF' ? node.get() : node;
  }

  /**
   * Parses ternary expressions: `condition ? a : b`
   */
  parseTernary() {
    let test = this.parseLogicalOr();

    if (this.match(TokenType.OPERATOR, '?')) {
      const cond = test && test.type === 'REF' ? test.get() : test;
      const consequent = this.parseAssignment();
      this.match(TokenType.OPERATOR, ':');
      const alternate = this.parseAssignment();
      return cond ? consequent : alternate;
    }

    return test;
  }

  /**
   * Parses logical OR: `a || b`
   */
  parseLogicalOr() {
    let left = this.parseLogicalAnd();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && this.peek().value === '||') {
      this.consume();
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseLogicalAnd();
      const rightVal = right && right.type === 'REF' ? right.get() : right;
      left = leftVal || rightVal;
    }

    return left;
  }

  /**
   * Parses logical AND: `a && b`
   */
  parseLogicalAnd() {
    let left = this.parseEquality();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && this.peek().value === '&&') {
      this.consume();
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseEquality();
      const rightVal = right && right.type === 'REF' ? right.get() : right;
      left = leftVal && rightVal;
    }

    return left;
  }

  /**
   * Parses equality operators: `==`, `===`, `!=`, `!==`
   */
  parseEquality() {
    let left = this.parseRelational();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && ['==', '===', '!=', '!=='].includes(this.peek().value)) {
      const op = this.consume().value;
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseRelational();
      const rightVal = right && right.type === 'REF' ? right.get() : right;

      if (op === '==') left = leftVal == rightVal;
      else if (op === '===') left = leftVal === rightVal;
      else if (op === '!=') left = leftVal != rightVal;
      else if (op === '!==') left = leftVal !== rightVal;
    }

    return left;
  }

  /**
   * Parses relational operators: `<`, `>`, `<=`, `>=`
   */
  parseRelational() {
    let left = this.parseAdditive();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && ['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.consume().value;
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseAdditive();
      const rightVal = right && right.type === 'REF' ? right.get() : right;

      if (op === '<') left = leftVal < rightVal;
      else if (op === '>') left = leftVal > rightVal;
      else if (op === '<=') left = leftVal <= rightVal;
      else if (op === '>=') left = leftVal >= rightVal;
    }

    return left;
  }

  /**
   * Parses additive operators: `+`, `-`
   */
  parseAdditive() {
    let left = this.parseMultiplicative();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && ['+', '-'].includes(this.peek().value)) {
      const op = this.consume().value;
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseMultiplicative();
      const rightVal = right && right.type === 'REF' ? right.get() : right;

      if (op === '+') left = leftVal + rightVal;
      else if (op === '-') left = leftVal - rightVal;
    }

    return left;
  }

  /**
   * Parses multiplicative operators: `*`, `/`, `%`
   */
  parseMultiplicative() {
    let left = this.parseUnary();

    while (this.peek() && this.peek().type === TokenType.OPERATOR && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.consume().value;
      const leftVal = left && left.type === 'REF' ? left.get() : left;
      const right = this.parseUnary();
      const rightVal = right && right.type === 'REF' ? right.get() : right;

      if (op === '*') left = leftVal * rightVal;
      else if (op === '/') left = leftVal / rightVal;
      else if (op === '%') left = leftVal % rightVal;
    }

    return left;
  }

  /**
   * Parses unary operators: `!`, `+`, `-`, and prefix `++`, `--`
   */
  parseUnary() {
    const token = this.peek();

    if (token && token.type === TokenType.OPERATOR) {
      if (['!', '+', '-'].includes(token.value)) {
        const op = this.consume().value;
        const operand = this.parseUnary();
        const val = operand && operand.type === 'REF' ? operand.get() : operand;
        if (op === '!') return !val;
        if (op === '+') return +val;
        if (op === '-') return -val;
      }

      if (['++', '--'].includes(token.value)) {
        const op = this.consume().value;
        const operand = this.parsePostfix();
        if (!operand || operand.type !== 'REF') {
          warn(`Invalid target for prefix '${op}'`);
          return undefined;
        }
        const current = Number(operand.get()) || 0;
        const next = op === '++' ? current + 1 : current - 1;
        operand.set(next);
        return next;
      }
    }

    return this.parsePostfix();
  }

  /**
   * Parses postfix operators: `x++`, `x--`
   */
  parsePostfix() {
    const left = this.parseMemberOrCall();

    const token = this.peek();
    if (token && token.type === TokenType.OPERATOR && ['++', '--'].includes(token.value)) {
      const op = this.consume().value;
      if (!left || left.type !== 'REF') {
        warn(`Invalid target for postfix '${op}'`);
        return undefined;
      }
      const current = Number(left.get()) || 0;
      const next = op === '++' ? current + 1 : current - 1;
      left.set(next);
      return current; // postfix returns value prior to mutation
    }

    return left;
  }

  /**
   * Parses member access (`a.b`, `a[b]`) and safe function calls (`a(b, c)`).
   */
  parseMemberOrCall() {
    let node = this.parsePrimary();

    while (true) {
      const token = this.peek();
      if (!token) break;

      // Property dot access: a.b
      if (token.type === TokenType.PUNCTUATION && token.value === '.') {
        this.consume();
        const propToken = this.consume();
        if (!propToken || propToken.type !== TokenType.IDENTIFIER) {
          warn(`Expected property identifier after '.'`);
          return undefined;
        }
        const prop = propToken.value;
        if (BANNED_IDENTIFIERS.has(prop)) {
          warn(`Access to forbidden property '${prop}' was blocked.`);
          return undefined;
        }

        const base = node && node.type === 'REF' ? node.get() : node;
        node = {
          type: 'REF',
          context: base,
          get: () => (base != null ? base[prop] : undefined),
          set: (val) => {
            if (base != null) base[prop] = val;
          }
        };
        continue;
      }

      // Bracket property access: a[b]
      if (token.type === TokenType.PUNCTUATION && token.value === '[') {
        this.consume();
        const indexExpr = this.parseExpression();
        this.match(TokenType.PUNCTUATION, ']');

        if (BANNED_IDENTIFIERS.has(String(indexExpr))) {
          warn(`Access to forbidden indexed property '${indexExpr}' was blocked.`);
          return undefined;
        }

        const base = node && node.type === 'REF' ? node.get() : node;
        node = {
          type: 'REF',
          context: base,
          get: () => (base != null ? base[indexExpr] : undefined),
          set: (val) => {
            if (base != null) base[indexExpr] = val;
          }
        };
        continue;
      }

      // Safe function invocation: a(b, c)
      if (token.type === TokenType.PUNCTUATION && token.value === '(') {
        this.consume();
        const args = [];
        if (!this.match(TokenType.PUNCTUATION, ')')) {
          while (true) {
            args.push(this.parseAssignment());
            if (this.match(TokenType.PUNCTUATION, ',')) continue;
            this.match(TokenType.PUNCTUATION, ')');
            break;
          }
        }

        let fn;
        let context = null;

        if (node && node.type === 'REF') {
          fn = node.get();
          // Extract base object/primitive for method context binding (e.g. items.push, string.includes)
          if (node.context != null) {
            context = node.context;
          }
        } else {
          fn = node;
        }

        if (typeof fn !== 'function') {
          warn(`Target is not a callable function in expression.`);
          return undefined;
        }

        try {
          const result = fn.apply(context, args);
          node = result;
        } catch (err) {
          warn(`Error executing function in expression:`, err);
          return undefined;
        }
        continue;
      }

      break;
    }

    return node;
  }

  /**
   * Parses primary tokens: literals, parenthesized expressions, object/array literals, identifiers.
   */
  parsePrimary() {
    const token = this.peek();
    if (!token) return undefined;

    // Numbers
    if (token.type === TokenType.NUMBER) {
      this.consume();
      return token.value;
    }

    // Strings
    if (token.type === TokenType.STRING) {
      this.consume();
      return token.value;
    }

    // Keyword literals (true, false, null, undefined)
    if (token.isLiteral) {
      this.consume();
      return token.value;
    }

    // Parentheses: (expr)
    if (token.type === TokenType.PUNCTUATION && token.value === '(') {
      this.consume();
      const val = this.parseAssignment();
      this.match(TokenType.PUNCTUATION, ')');
      return val;
    }

    // Array literals: [a, b, c]
    if (token.type === TokenType.PUNCTUATION && token.value === '[') {
      this.consume();
      const elements = [];
      if (!this.match(TokenType.PUNCTUATION, ']')) {
        while (true) {
          elements.push(this.parseAssignment());
          if (this.match(TokenType.PUNCTUATION, ',')) continue;
          this.match(TokenType.PUNCTUATION, ']');
          break;
        }
      }
      return elements;
    }

    // Object literals: { key: value, method() { ... }, ... }
    if (token.type === TokenType.PUNCTUATION && token.value === '{') {
      this.consume();
      const obj = {};
      if (!this.match(TokenType.PUNCTUATION, '}')) {
        while (true) {
          const keyToken = this.consume();
          const key = keyToken.value;

          // Check for method shorthand: foo(arg1, arg2) { ... }
          if (this.peek() && this.peek().type === TokenType.PUNCTUATION && this.peek().value === '(') {
            this.consume(); // consume '('
            const params = [];
            if (!this.match(TokenType.PUNCTUATION, ')')) {
              while (true) {
                if (this.peek() && this.peek().type === TokenType.IDENTIFIER) {
                  params.push(this.consume().value);
                }
                if (this.match(TokenType.PUNCTUATION, ',')) continue;
                this.match(TokenType.PUNCTUATION, ')');
                break;
              }
            }

            this.match(TokenType.PUNCTUATION, '{');
            const bodyTokens = [];
            let depth = 1;
            while (this.peek() && this.peek().type !== TokenType.EOF) {
              const cur = this.consume();
              if (cur.type === TokenType.PUNCTUATION && cur.value === '{') depth++;
              else if (cur.type === TokenType.PUNCTUATION && cur.value === '}') {
                depth--;
                if (depth === 0) break;
              }
              bodyTokens.push(cur);
            }
            bodyTokens.push({ type: TokenType.EOF, value: null });

            const capturedHelpers = this.helpers;
            obj[key] = function(...args) {
              const methodScope = Object.create(this || obj);
              methodScope['this'] = this || obj;
              params.forEach((p, idx) => { methodScope[p] = args[idx]; });
              const evaluator = new ExpressionEvaluator(bodyTokens, methodScope, capturedHelpers);
              return evaluator.parseProgram();
            };
          } else {
            this.match(TokenType.OPERATOR, ':');
            const val = this.parseAssignment();
            obj[key] = val;
          }

          if (this.match(TokenType.PUNCTUATION, ',')) continue;
          this.match(TokenType.PUNCTUATION, '}');
          break;
        }
      }
      return obj;
    }

    // Identifiers (variable name lookup on scope, helper, or safe globals)
    if (token.type === TokenType.IDENTIFIER) {
      const name = this.consume().value;

      if (BANNED_IDENTIFIERS.has(name)) {
        warn(`Access to forbidden identifier '${name}' was rejected.`);
        return undefined;
      }

      return {
        type: 'REF',
        name,
        context: this.scope,
        get: () => {
          if (name === 'this') {
            return this.scope && this.scope['this'] ? this.scope['this'] : this.scope;
          }
          if (this.scope && name in this.scope) {
            return this.scope[name];
          }
          if (this.helpers && name in this.helpers) {
            return this.helpers[name];
          }
          if (name in SAFE_GLOBALS) {
            return SAFE_GLOBALS[name];
          }
          return undefined;
        },
        set: (val) => {
          if (name === 'this') return;
          if (this.scope) {
            this.scope[name] = val;
          }
        }
      };
    }

    warn(`Unexpected token '${token.value}' of type '${token.type}'`);
    this.consume();
    return undefined;
  }
}

/**
 * Safely evaluates an expression string against a reactive scope and optional helpers.
 *
 * @param {string} expr - Expression string to evaluate.
 * @param {Object} scope - The active Scope instance.
 * @param {Object} [helpers={}] - Registered helper functions.
 * @returns {any} Result of the evaluated expression.
 *
 * @example
 * evaluateExpression("count + 1", scope);
 * evaluateExpression("items.length > 0", scope);
 * evaluateExpression("count++", scope);
 */
export function evaluateExpression(expr, scope, helpers = {}) {
  if (typeof expr !== 'string' || !expr.trim()) {
    return undefined;
  }

  try {
    const tokens = tokenize(expr.trim());
    const evaluator = new ExpressionEvaluator(tokens, scope || {}, helpers);
    return evaluator.parseProgram();
  } catch (err) {
    warn(`[Kite] Expression error in "${expr}": ${err.message}`);
    return undefined;
  }
}

/**
 * Safely parses an object literal string for initial state (e.g. "{ count: 0, title: 'Kite' }").
 *
 * @param {string} raw - String representation of an object literal.
 * @param {Object} [helpers={}] - Helper functions if referenced.
 * @returns {Object} Parsed state object.
 */
export function parseObjectLiteral(raw, helpers = {}) {
  if (!raw || typeof raw !== 'string') return {};
  const trimmed = raw.trim();

  // 1. Try native evaluation if available for full JS function semantics (methods, loops, if statements)
  try {
    const wrapped = trimmed.startsWith('{') ? `(${trimmed})` : `({ ${trimmed} })`;
    const fn = new Function(`return ${wrapped};`);
    const evaluated = fn();
    if (evaluated && typeof evaluated === 'object') {
      return evaluated;
    }
  } catch {
    // Fall back to safe ExpressionEvaluator if CSP restricts new Function or invalid JS
  }

  // 2. Safe ExpressionEvaluator fallback
  try {
    const wrapped = trimmed.startsWith('{') ? trimmed : `{ ${trimmed} }`;
    const tokens = tokenize(wrapped);
    const evaluator = new ExpressionEvaluator(tokens, {}, helpers);
    const result = evaluator.parseExpression();
    return typeof result === 'object' && result !== null ? result : {};
  } catch (err) {
    warn(`[Kite] Malformed JSON/object literal "${raw}": ${err.message}`);
    return {};
  }
}
