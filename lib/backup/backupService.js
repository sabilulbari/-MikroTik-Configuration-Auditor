/**
 * Backup and Restore Service
 * 
 * Handles JSON project export, schema validation, preview generation, and safe restoration.
 */

import { SCHEMA_VERSION } from "../storage/localStorageService";

/**
 * Exports project state as downloadable JSON file
 */
export function exportProjectToJson(state, projectName = "MikroTik-Lab") {
  if (typeof window === "undefined" || !state) return;

  const backupData = {
    app: "MikroTik Configuration Auditor",
    schemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    project: state.project || { name: projectName },
    questions: state.questions || [],
    recentActivities: state.recentActivities || [],
    userSettings: state.userSettings || {},
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const safeName = (state.project?.name || projectName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  const filename = `${safeName}-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates an uploaded JSON string and generates a preview object
 */
export function validateBackupJson(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    return {
      valid: false,
      error: "Empty or invalid file content.",
    };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      return {
        valid: false,
        error: "JSON is not a valid object structure.",
      };
    }

    if (!Array.isArray(data.questions)) {
      return {
        valid: false,
        error: "Missing required 'questions' array in backup file.",
      };
    }

    // Check version
    if (data.schemaVersion && data.schemaVersion > SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Incompatible backup version (${data.schemaVersion}). Application supports schema v${SCHEMA_VERSION}.`,
      };
    }

    const totalQuestions = data.questions.length;
    const completedCount = data.questions.filter((q) => q.status === "completed").length;
    const categoriesFound = Array.from(new Set(data.questions.map((q) => q.category).filter(Boolean)));

    return {
      valid: true,
      data,
      preview: {
        projectName: data.project?.name || "Imported Project",
        exportDate: data.exportDate || "Unknown date",
        totalQuestions,
        completedCount,
        pendingCount: totalQuestions - completedCount,
        categories: categoriesFound,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: `Invalid JSON syntax: ${err.message}`,
    };
  }
}
