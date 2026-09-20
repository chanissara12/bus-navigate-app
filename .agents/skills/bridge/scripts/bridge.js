#!/usr/bin/env node
/**
 * Agent Bridge mailbox CLI.
 * Mailbox layout: <project>/.agent-bridge/mailbox/{unclaimed,claimed,done}/<id>.json
 * Message shape is defined by ../schema/message.schema.json — validateMessage() below
 * enforces it (hand-rolled, not ajv, to keep this script dependency-free).
 * See docs/agent-bridge-spec.md for the full protocol.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const MESSAGE_TYPES = ["ask", "delegate", "review", "result", "status", "error"];
const MESSAGE_KEYS = ["id", "from", "to", "type", "content", "context", "taskId", "projectPath", "createdAt"];
const CONTEXT_KEYS = ["files", "diff", "instructions"];

function extraKeys(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

/** Throws with a descriptive message if `message` doesn't match schema/message.schema.json. */
function validateMessage(message) {
  const errors = [];
  const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

  if (typeof message !== "object" || message === null || Array.isArray(message)) {
    throw new Error("message failed schema validation (schema/message.schema.json):\n  - message must be an object");
  }

  const extra = extraKeys(message, MESSAGE_KEYS);
  if (extra.length > 0) errors.push(`unexpected propert${extra.length === 1 ? "y" : "ies"}: ${extra.join(", ")}`);

  if (!isNonEmptyString(message.id)) errors.push("id must be a non-empty string");
  if (!isNonEmptyString(message.from)) errors.push("from must be a non-empty string (agent name)");
  if (!isNonEmptyString(message.to)) errors.push("to must be a non-empty string (agent name)");
  if (!MESSAGE_TYPES.includes(message.type)) errors.push(`type must be one of ${MESSAGE_TYPES.join(", ")}`);
  if (!isNonEmptyString(message.content)) errors.push("content must be a non-empty string");
  if (!isNonEmptyString(message.taskId)) errors.push("taskId must be a non-empty string");
  if (!isNonEmptyString(message.projectPath)) errors.push("projectPath must be a non-empty string");
  if (!isNonEmptyString(message.createdAt) || Number.isNaN(Date.parse(message.createdAt))) {
    errors.push("createdAt must be an ISO 8601 date-time string");
  }

  const ctx = message.context;
  if (typeof ctx !== "object" || ctx === null || Array.isArray(ctx)) {
    errors.push("context must be an object");
  } else {
    const ctxExtra = extraKeys(ctx, CONTEXT_KEYS);
    if (ctxExtra.length > 0) {
      errors.push(`context has unexpected propert${ctxExtra.length === 1 ? "y" : "ies"}: ${ctxExtra.join(", ")}`);
    }
    if (!Array.isArray(ctx.files) || !ctx.files.every((f) => typeof f === "string")) {
      errors.push("context.files must be an array of strings");
    }
    if (ctx.diff !== null && typeof ctx.diff !== "string") {
      errors.push("context.diff must be a string or null");
    }
    if (ctx.instructions !== null && typeof ctx.instructions !== "string") {
      errors.push("context.instructions must be a string or null");
    }
  }

  if (errors.length > 0) {
    throw new Error(`message failed schema validation (schema/message.schema.json):\n  - ${errors.join("\n  - ")}`);
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function mailboxRoot(projectPath) {
  return path.join(projectPath, ".agent-bridge", "mailbox");
}

function ensureMailbox(projectPath) {
  const root = mailboxRoot(projectPath);
  for (const state of ["unclaimed", "claimed", "done"]) {
    fs.mkdirSync(path.join(root, state), { recursive: true });
  }
  return root;
}

function writeMessage(projectPath, state, message) {
  validateMessage(message);
  const root = ensureMailbox(projectPath);
  const file = path.join(root, state, `${message.id}.json`);
  fs.writeFileSync(file, JSON.stringify(message, null, 2) + "\n", "utf8");
  return file;
}

function listMessages(projectPath, state, filterTo) {
  const root = ensureMailbox(projectPath);
  const dir = path.join(root, state);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    try {
      const msg = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (!filterTo || msg.to === filterTo) out.push(msg);
    } catch (e) {
      // skip unreadable/partially-written files
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return out;
}

/** Atomic claim: rename unclaimed/<id>.json -> claimed/<id>.json. Throws on race loss. */
function claimMessage(projectPath, id) {
  const root = ensureMailbox(projectPath);
  const from = path.join(root, "unclaimed", `${id}.json`);
  const to = path.join(root, "claimed", `${id}.json`);
  fs.renameSync(from, to); // atomic on POSIX & NTFS; throws ENOENT if already claimed by someone else
  return JSON.parse(fs.readFileSync(to, "utf8"));
}

function completeMessage(projectPath, id) {
  const root = ensureMailbox(projectPath);
  const from = path.join(root, "claimed", `${id}.json`);
  const to = path.join(root, "done", `${id}.json`);
  fs.renameSync(from, to);
}

function cmdSend(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const message = {
    id: crypto.randomUUID(),
    from: required(args, "from"),
    to: required(args, "to"),
    type: required(args, "type"), // ask | delegate | review | result | status | error
    content: required(args, "content"),
    context: {
      files: args.files ? args.files.split(",").map((s) => s.trim()) : [],
      diff: args.diff || null,
      instructions: args.instructions || null,
    },
    taskId: args["task-id"] || crypto.randomUUID(),
    projectPath,
    createdAt: new Date().toISOString(),
  };
  writeMessage(projectPath, "unclaimed", message);
  print({ id: message.id, taskId: message.taskId, status: "sent" });
}

function cmdCheck(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const as = required(args, "as");
  const messages = listMessages(projectPath, "unclaimed", as);
  print(messages);
}

function cmdClaim(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const id = required(args, "id");
  try {
    const msg = claimMessage(projectPath, id);
    print(msg);
  } catch (e) {
    print({ error: "already-claimed-or-missing", id });
    process.exitCode = 1;
  }
}

function cmdComplete(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const id = required(args, "id");
  completeMessage(projectPath, id);
  print({ id, status: "done" });
}

function cmdReply(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const message = {
    id: crypto.randomUUID(),
    from: required(args, "from"),
    to: required(args, "to"),
    type: required(args, "type"),
    content: required(args, "content"),
    context: {
      files: args.files ? args.files.split(",").map((s) => s.trim()) : [],
      diff: args.diff || null,
      instructions: args.instructions || null,
    },
    taskId: required(args, "task-id"),
    projectPath,
    createdAt: new Date().toISOString(),
  };
  writeMessage(projectPath, "unclaimed", message);
  if (args["complete-id"]) {
    try {
      completeMessage(projectPath, args["complete-id"]);
    } catch (e) {
      // original may already be done; not fatal
    }
  }
  print({ id: message.id, taskId: message.taskId, status: "sent" });
}

/** Bounded poll: wait up to --timeout-ms (default 60000) for a reply addressed to --as with --task-id. */
function cmdWait(args) {
  const projectPath = path.resolve(args.project || process.cwd());
  const as = required(args, "as");
  const taskId = required(args, "task-id");
  const timeoutMs = Number(args["timeout-ms"] || 60000);
  const intervalMs = Number(args["interval-ms"] || 3000);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const candidates = listMessages(projectPath, "unclaimed", as).filter(
      (m) => m.taskId === taskId
    );
    if (candidates.length > 0) {
      try {
        const claimed = claimMessage(projectPath, candidates[0].id);
        print(claimed);
        return;
      } catch (e) {
        // lost the race to another /bridge invocation; keep polling
      }
    }
    sleepSync(intervalMs);
  }
  print({ status: "timeout", message: "not yet - run /bridge again to check" });
  process.exitCode = 1;
}

function sleepSync(ms) {
  const sab = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(sab, 0, 0, ms);
}

function required(args, key) {
  if (args[key] === undefined || args[key] === true) {
    throw new Error(`missing required --${key}`);
  }
  return args[key];
}

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);
  try {
    switch (cmd) {
      case "send":
        return cmdSend(args);
      case "check":
        return cmdCheck(args);
      case "claim":
        return cmdClaim(args);
      case "complete":
        return cmdComplete(args);
      case "reply":
        return cmdReply(args);
      case "wait":
        return cmdWait(args);
      default:
        process.stderr.write(
          "usage: bridge <send|check|claim|complete|reply|wait> [--flags]\n"
        );
        process.exitCode = 2;
    }
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`);
    process.exitCode = 1;
  }
}

main();
