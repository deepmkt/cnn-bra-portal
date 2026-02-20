import { describe, expect, it } from "vitest";
import { validateCredentials } from "./sendpulse";

describe("SendPulse Integration", () => {
  it("should validate credentials and obtain an access token", async () => {
    const result = await validateCredentials();
    expect(result.valid).toBe(true);
    expect(result.message).toBe("SendPulse credentials are valid");
  }, 15000); // Allow 15s for API call
});
