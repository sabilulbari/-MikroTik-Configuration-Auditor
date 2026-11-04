import { describe, it, expect } from "vitest";
import { parseOcrTextToQuestions, inferCategory } from "../lib/ocr/ocrParser";

describe("OCR Parser & Category Inference", () => {
  it("infers categories accurately based on networking keywords", () => {
    expect(inferCategory("Configure IP address 192.168.1.1/24")).toBe("IP Addressing");
    expect(inferCategory("Set up DHCP server on ether2")).toBe("DHCP");
    expect(inferCategory("Create firewall filter to drop invalid packets")).toBe("Firewall");
    expect(inferCategory("Add src-nat masquerade rule on ether1")).toBe("NAT");
    expect(inferCategory("Create PPPoE user profile and secret")).toBe("PPPoE");
    expect(inferCategory("Configure static route via gateway 10.0.0.1")).toBe("Routing");
    expect(inferCategory("Configure VLAN interface with tag 100")).toBe("VLAN");
    expect(inferCategory("Miscellaneous system NTP task")).toBe("Custom");
  });

  it("parses numbered questions starting with digits", () => {
    const raw = `
      1. Configure WAN IP Address on ether1
      Use address 203.0.113.10/24.
      
      2. Configure LAN IP Address on ether2
      Use address 192.168.88.1/24.
    `;
    const questions = parseOcrTextToQuestions(raw, 1);
    expect(questions.length).toBe(2);
    expect(questions[0].number).toBe(1);
    expect(questions[0].title).toBe("Configure WAN IP Address on ether1");
    expect(questions[0].category).toBe("IP Addressing");
    expect(questions[0].description).toContain("203.0.113.10/24");

    expect(questions[1].number).toBe(2);
    expect(questions[1].title).toBe("Configure LAN IP Address on ether2");
  });

  it("parses questions with prefixes like 'Question 1:', 'Task 2 -', 'Q3)'", () => {
    const raw = `
      Question 1: Configure Masquerade NAT
      Chain srcnat out-interface ether1 action masquerade.

      Task 2 - Configure DHCP Server
      Interface ether2, pool dhcp_pool.

      Q3) Configure Default Route
      Destination 0.0.0.0/0 gateway 203.0.113.1.
    `;
    const questions = parseOcrTextToQuestions(raw, 1);
    expect(questions.length).toBe(3);
    expect(questions[0].number).toBe(1);
    expect(questions[0].title).toBe("Configure Masquerade NAT");
    expect(questions[0].category).toBe("NAT");

    expect(questions[1].number).toBe(2);
    expect(questions[1].title).toBe("Configure DHCP Server");
    expect(questions[1].category).toBe("DHCP");

    expect(questions[2].number).toBe(3);
    expect(questions[2].title).toBe("Configure Default Route");
    expect(questions[2].category).toBe("Routing");
  });

  it("handles empty or malformed strings gracefully", () => {
    expect(parseOcrTextToQuestions("")).toEqual([]);
    expect(parseOcrTextToQuestions(null)).toEqual([]);
    expect(parseOcrTextToQuestions("   \n\n   ")).toEqual([]);
  });
});
