import { describe, it, expect } from "vitest";
import { verifyConfiguration } from "../lib/engine/ruleEngine";
import { DEFAULT_QUESTIONS } from "../lib/data/defaultQuestions";

describe("Rule-Based Verification Engine", () => {
  const wanQuestion = DEFAULT_QUESTIONS.find((q) => q.id === "ip-wan-address");
  const natQuestion = DEFAULT_QUESTIONS.find((q) => q.id === "nat-masquerade");

  it("passes when exact WAN IP and interface match requirements", () => {
    const validConfig = `
      /ip address
      add address=203.0.113.10/24 interface=ether1 comment="WAN Uplink"
    `;
    const result = verifyConfiguration(validConfig, wanQuestion, "7.x");

    expect(result.passed).toBe(true);
    expect(result.failedRules).toBe(0);
    expect(result.passedRules).toBe(1);
    expect(result.checks[0].status).toBe("passed");
  });

  it("fails with clear explanation when wrong IP address is provided", () => {
    const invalidConfig = `
      /ip address
      add address=10.0.0.1/24 interface=ether1
    `;
    const result = verifyConfiguration(invalidConfig, wanQuestion, "7.x");

    expect(result.passed).toBe(false);
    expect(result.failedRules).toBe(1);
    expect(result.checks[0].status).toBe("failed");
    expect(result.checks[0].explanation).toContain("203.0.113.10/24");
    expect(result.checks[0].suggestedFix).toBe("Set address=203.0.113.10/24");
  });

  it("fails when configuration section is completely missing", () => {
    const wrongSectionConfig = `
      /ip firewall nat
      add chain=srcnat action=masquerade out-interface=ether1
    `;
    const result = verifyConfiguration(wrongSectionConfig, wanQuestion, "7.x");

    expect(result.passed).toBe(false);
    expect(result.missingRules).toBe(1);
    expect(result.checks[0].status).toBe("missing");
    expect(result.checks[0].explanation).toContain("Missing expected command");
  });

  it("verifies NAT masquerade rule with alternative interfaces (ether1 or WAN)", () => {
    const validNat1 = `
      /ip firewall nat
      add chain=srcnat action=masquerade out-interface=ether1
    `;
    const result1 = verifyConfiguration(validNat1, natQuestion, "7.x");
    expect(result1.passed).toBe(true);

    const validNat2 = `
      /ip firewall nat
      add action=masquerade chain=srcnat out-interface=WAN
    `;
    const result2 = verifyConfiguration(validNat2, natQuestion, "7.x");
    expect(result2.passed).toBe(true);

    const invalidNat = `
      /ip firewall nat
      add chain=forward action=masquerade out-interface=ether1
    `;
    const result3 = verifyConfiguration(invalidNat, natQuestion, "7.x");
    expect(result3.passed).toBe(false);
    expect(result3.checks[0].paramResults.find((p) => p.field === "chain").status).toBe("failed");
  });

  it("handles empty config with appropriate prompt to paste configuration", () => {
    const result = verifyConfiguration("", wanQuestion, "7.x");
    expect(result.passed).toBe(false);
    expect(result.message).toContain("No RouterOS commands were detected");
  });

  it("handles questions without rules gracefully", () => {
    const customTaskWithoutRules = {
      id: "custom-task-1",
      title: "Custom BGP peer",
      rules: null,
    };
    const result = verifyConfiguration("/routing bgp", customTaskWithoutRules, "7.x");
    expect(result.isSupported).toBe(false);
    expect(result.message).toContain("Verification rules are not available yet");
  });
});
