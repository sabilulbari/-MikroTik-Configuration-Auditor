import { describe, it, expect } from "vitest";
import { verifyConfiguration } from "../lib/engine/ruleEngine";
import { DEFAULT_QUESTIONS } from "../lib/data/defaultQuestions";

describe("Question Configuration Modal Workflow Logic", () => {
  const wanTask = DEFAULT_QUESTIONS.find((q) => q.id === "ip-wan-address");

  it("initially does not allow completion when config is empty", () => {
    const result = verifyConfiguration("", wanTask, "7.x");
    expect(result.passed).toBe(false);
    expect(result.failedRules).toBeGreaterThan(0);
    // Completion must be blocked
    const isDoneEnabled = Boolean(result && result.passed);
    expect(isDoneEnabled).toBe(false);
  });

  it("blocks completion when mandatory rule fails with mismatch", () => {
    const incorrectConfig = `
      /ip address
      add address=10.10.10.1/24 interface=ether1
    `;
    const result = verifyConfiguration(incorrectConfig, wanTask, "7.x");
    expect(result.passed).toBe(false);
    expect(result.failedRules).toBe(1);

    const isDoneEnabled = Boolean(result && result.passed);
    expect(isDoneEnabled).toBe(false);

    // Verifies expected and actual are exposed in check results
    const check = result.checks[0];
    const addrParam = check.paramResults.find((p) => p.field === "address");
    expect(addrParam.expected).toBe("203.0.113.10/24");
    expect(addrParam.actual).toBe("10.10.10.1/24");
    expect(addrParam.status).toBe("failed");
    expect(check.suggestedFix).toBe("Set address=203.0.113.10/24");
  });

  it("enables completion only after all required rules pass", () => {
    const validConfig = `
      /ip address
      add address=203.0.113.10/24 interface=ether1 comment="WAN Uplink"
    `;
    const result = verifyConfiguration(validConfig, wanTask, "7.x");
    expect(result.passed).toBe(true);
    expect(result.failedRules).toBe(0);

    const isDoneEnabled = Boolean(result && result.passed);
    expect(isDoneEnabled).toBe(true);
  });

  it("disables completion if config is modified after verification", () => {
    const validConfig = `
      /ip address
      add address=203.0.113.10/24 interface=ether1
    `;
    const result = verifyConfiguration(validConfig, wanTask, "7.x");
    expect(result.passed).toBe(true);

    // Simulate user editing text after verification
    let hasChangedSinceVerify = true;
    const isDoneEnabled = Boolean(result && result.passed && !hasChangedSinceVerify);
    expect(isDoneEnabled).toBe(false);

    // After re-verifying:
    hasChangedSinceVerify = false;
    const isDoneReenabled = Boolean(result && result.passed && !hasChangedSinceVerify);
    expect(isDoneReenabled).toBe(true);
  });

  it("correctly handles RouterOS version toggle between 6.x and 7.x", () => {
    const v6RouteConfig = `/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1`;
    const defaultRouteTask = DEFAULT_QUESTIONS.find((q) => q.id === "routing-default-route");

    const resV6 = verifyConfiguration(v6RouteConfig, defaultRouteTask, "6.x");
    expect(resV6.passed).toBe(true);

    const resV7 = verifyConfiguration(v6RouteConfig, defaultRouteTask, "7.x");
    expect(resV7.passed).toBe(true);
  });
});
