/**
 * LocalStorage Service with Schema Versioning, Safe Hydration & Quota Fallback
 */

export const STORAGE_KEY = "mikrotik_auditor_state_v1";
export const SCHEMA_VERSION = 1;

/**
 * Default initial state
 */
export function getDefaultStorageState(seedQuestions = []) {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastSaved: new Date().toISOString(),
    project: {
      name: "Default Lab Project",
      targetVersion: "7.x",
    },
    questions: seedQuestions,
    recentActivities: [
      {
        id: "act-init",
        message: `Loaded ${seedQuestions.length} starter MikroTik configuration audit tasks.`,
        timestamp: "Project initialized",
      },
    ],
    userSettings: {
      autoVerifyOnPaste: false,
      preferredVersion: "7.x",
    },
  };
}

/**
 * Loads persisted state from browser localStorage.
 * Validates schema, cleans duplicate IDs, and handles corrupted JSON safely.
 */
export function loadFromLocalStorage(seedQuestions = []) {
  if (typeof window === "undefined") {
    return getDefaultStorageState(seedQuestions);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultStorageState(seedQuestions);
      saveToLocalStorage(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);

    // Validate structure & migrate if needed
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
      console.warn("Corrupted state found in localStorage, restoring defaults.");
      return getDefaultStorageState(seedQuestions);
    }

    // Deduplicate question IDs
    const seenIds = new Set();
    const sanitizedQuestions = [];
    for (const q of parsed.questions) {
      if (!q.id || seenIds.has(q.id)) {
        q.id = `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      }
      seenIds.add(q.id);
      sanitizedQuestions.push(q);
    }

    return {
      schemaVersion: parsed.schemaVersion || SCHEMA_VERSION,
      lastSaved: parsed.lastSaved || new Date().toISOString(),
      project: parsed.project || { name: "Default Lab Project", targetVersion: "7.x" },
      questions: sanitizedQuestions.length > 0 ? sanitizedQuestions : seedQuestions,
      recentActivities: Array.isArray(parsed.recentActivities) ? parsed.recentActivities : [],
      userSettings: parsed.userSettings || { autoVerifyOnPaste: false, preferredVersion: "7.x" },
    };
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    return getDefaultStorageState(seedQuestions);
  }
}

/**
 * Persists state into browser localStorage with quota error detection
 */
export function saveToLocalStorage(state) {
  if (typeof window === "undefined" || !state) return false;

  try {
    const payload = {
      ...state,
      schemaVersion: SCHEMA_VERSION,
      lastSaved: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (err.name === "QuotaExceededError" || err.code === 22) {
      console.error("LocalStorage quota exceeded! Attempting to trim activities.", err);
      try {
        const trimmed = {
          ...state,
          recentActivities: (state.recentActivities || []).slice(0, 10),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return true;
      } catch (e) {
        console.error("Could not save even after trimming:", e);
      }
    } else {
      console.error("Error saving state to localStorage:", err);
    }
    return false;
  }
}

/**
 * Clears stored auditor state
 */
export function clearLocalStorage() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
