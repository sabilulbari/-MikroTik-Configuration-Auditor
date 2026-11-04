import { describe, it, expect } from "vitest";
import { validateBackupJson } from "../lib/backup/backupService";
import { maskSensitiveCredentials } from "../lib/reports/pdfGenerator";
import { SCHEMA_VERSION } from "../lib/storage/localStorageService";

describe("Backup & Restore Validation", () => {
  it("validates a healthy backup JSON and returns an accurate preview", () => {
    const backupJson = JSON.stringify({
      app: "MikroTik Configuration Auditor",
      schemaVersion: SCHEMA_VERSION,
      exportDate: "2026-11-05T00:00:00.000Z",
      project: { name: "Certification Exam Lab" },
      questions: [
        { id: "q1", number: 1, title: "Configure WAN IP", category: "IP Addressing", status: "completed" },
        { id: "q2", number: 2, title: "Configure DHCP", category: "DHCP", status: "pending" },
      ],
    });

    const res = validateBackupJson(backupJson);

    expect(res.valid).toBe(true);
    expect(res.preview.projectName).toBe("Certification Exam Lab");
    expect(res.preview.totalQuestions).toBe(2);
    expect(res.preview.completedCount).toBe(1);
    expect(res.preview.pendingCount).toBe(1);
    expect(res.preview.categories).toContain("IP Addressing");
    expect(res.preview.categories).toContain("DHCP");
  });

  it("rejects invalid JSON syntax", () => {
    const res = validateBackupJson("{ broken json");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Invalid JSON syntax");
  });

  it("rejects backup files missing the questions array", () => {
    const res = validateBackupJson(JSON.stringify({ project: { name: "Empty" } }));
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Missing required 'questions' array");
  });

  it("rejects future incompatible schema versions", () => {
    const futureBackup = JSON.stringify({
      schemaVersion: SCHEMA_VERSION + 10,
      questions: [],
    });
    const res = validateBackupJson(futureBackup);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Incompatible backup version");
  });
});

describe("Security & Sensitive Data Masking", () => {
  it("masks password and secret fields in reported configurations", () => {
    const rawConfig = `
      /ppp secret
      add name=user1 password="SuperSecretPassword123" service=pppoe
      add name=user2 secret='AnotherPrivateSecret'
    `;
    const masked = maskSensitiveCredentials(rawConfig);

    expect(masked).not.toContain("SuperSecretPassword123");
    expect(masked).not.toContain("AnotherPrivateSecret");
    expect(masked).toContain('password="********"');
    expect(masked).toContain("secret='********'");
  });
});
