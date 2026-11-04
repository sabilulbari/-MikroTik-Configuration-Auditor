import { describe, it, expect, beforeEach } from "vitest";
import {
  getDefaultStorageState,
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_KEY,
  SCHEMA_VERSION,
} from "../lib/storage/localStorageService";

describe("LocalStorage Persistence & Schema Handling", () => {
  // Mock localStorage for node environment
  let storageMock = {};

  beforeEach(() => {
    storageMock = {};
    global.window = {
      localStorage: {
        getItem: (k) => storageMock[k] || null,
        setItem: (k, v) => {
          storageMock[k] = String(v);
        },
        removeItem: (k) => {
          delete storageMock[k];
        },
      },
    };
  });

  it("returns default state when storage is empty", () => {
    const seed = [{ id: "q1", number: 1, title: "Test Q", status: "pending" }];
    const state = loadFromLocalStorage(seed);

    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.questions.length).toBe(1);
    expect(state.questions[0].title).toBe("Test Q");
  });

  it("persists and restores state correctly", () => {
    const stateToSave = {
      schemaVersion: SCHEMA_VERSION,
      project: { name: "Lab RB5009" },
      questions: [
        { id: "q1", number: 1, title: "Configure WAN IP", status: "completed" },
        { id: "q2", number: 2, title: "Configure LAN IP", status: "pending" },
      ],
      recentActivities: [{ id: "act1", message: "Task completed" }],
      userSettings: { autoVerifyOnPaste: true, preferredVersion: "7.x" },
    };

    saveToLocalStorage(stateToSave);
    const restored = loadFromLocalStorage();

    expect(restored.project.name).toBe("Lab RB5009");
    expect(restored.questions.length).toBe(2);
    expect(restored.questions[0].status).toBe("completed");
    expect(restored.userSettings.autoVerifyOnPaste).toBe(true);
  });

  it("sanitizes duplicate IDs if found in storage data", () => {
    const corruptedState = {
      schemaVersion: SCHEMA_VERSION,
      questions: [
        { id: "dup-id", number: 1, title: "Item 1" },
        { id: "dup-id", number: 2, title: "Item 2" },
      ],
    };
    storageMock[STORAGE_KEY] = JSON.stringify(corruptedState);

    const loaded = loadFromLocalStorage();
    expect(loaded.questions.length).toBe(2);
    expect(loaded.questions[0].id).not.toBe(loaded.questions[1].id);
  });

  it("recovers gracefully from malformed JSON in localStorage", () => {
    storageMock[STORAGE_KEY] = "MALFORMED_JSON{{{";
    const seed = [{ id: "q1", number: 1, title: "Fallback", status: "pending" }];
    const loaded = loadFromLocalStorage(seed);

    expect(loaded.questions.length).toBe(1);
    expect(loaded.questions[0].title).toBe("Fallback");
  });
});
