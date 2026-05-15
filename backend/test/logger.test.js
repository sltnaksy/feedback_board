import test from "node:test";
import assert from "node:assert/strict";
import { log } from "../src/logger.js";

test("logger writes structured JSON log entries", () => {
  const originalConsoleLog = console.log;
  let output = "";

  console.log = (message) => {
    output = message;
  };

  try {
    log("info", "Test message", { servicePart: "test" });

    const parsed = JSON.parse(output);

    assert.equal(parsed.level, "INFO");
    assert.equal(parsed.service, "backend");
    assert.equal(parsed.message, "Test message");
    assert.equal(parsed.servicePart, "test");
    assert.ok(parsed.timestamp);
  } finally {
    console.log = originalConsoleLog;
  }
});