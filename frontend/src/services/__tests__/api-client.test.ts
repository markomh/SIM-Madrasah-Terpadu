import { z } from "zod";
import assert from "node:assert";

// Setup window and CustomEvent on globalThis BEFORE importing api-client
const events: Array<{ type: string; detail: any }> = [];
const mockWindow = {
  dispatchEvent: (event: any) => {
    events.push({ type: event.type, detail: event.detail });
    return true;
  },
  __events: events,
};
(globalThis as any).window = mockWindow;
(globalThis as any).CustomEvent = class CustomEvent {
  type: string;
  detail: any;
  constructor(type: string, options: any) {
    this.type = type;
    this.detail = options?.detail;
  }
};

async function runTests() {
  console.log("Running api-client gatekeeper tests...");

  const { apiClient } = await import("../api-client.ts");
  const originalFetch = globalThis.fetch;

  try {
    // Test 1: Schema validation failure emits app-api-error with issue details
    (globalThis as any).window.__events.length = 0;
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            nama: "Test",
          },
        }),
      } as any;
    }) as any;

    const TestSchema = z.object({
      nama: z.string(),
      email: z.string({ required_error: "Email wajib" }).email(),
    });

    let threw = false;
    try {
      await apiClient.get("/test", TestSchema);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes("SSoT Violation"), "Error message should include SSoT Violation");
      assert(err.message.includes("email"), "Error message should detail missing field 'email'");
    }
    assert(threw, "apiClient.get should throw on Zod schema mismatch");

    const eventsList = (globalThis as any).window.__events;
    assert.strictEqual(eventsList.length, 1, "Should dispatch 1 app-api-error event on schema violation");
    assert.strictEqual(eventsList[0].detail.status, 500);
    assert(eventsList[0].detail.message.includes("email"), "Event message should include Zod issue details");

    console.log("✔ Test 1 passed: Schema validation failure emits detailed app-api-error");

    // Test 2: HTTP 500 error emits app-api-error event
    (globalThis as any).window.__events.length = 0;
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal Server Error" }),
      } as any;
    }) as any;

    threw = false;
    try {
      await apiClient.get("/error-500");
    } catch {
      threw = true;
    }
    assert(threw, "apiClient.get should throw on HTTP 500");
    const events500 = (globalThis as any).window.__events;
    assert.strictEqual(events500.length, 1, "Should dispatch app-api-error for HTTP 500");
    assert.strictEqual(events500[0].detail.status, 500);

    console.log("✔ Test 2 passed: HTTP 500 emits app-api-error event");

    console.log("ALL TESTS PASSED SUCCESSFULLY!");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
