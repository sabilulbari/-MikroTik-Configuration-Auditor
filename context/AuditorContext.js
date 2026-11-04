"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_QUESTIONS } from "@/lib/data/defaultQuestions";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  getDefaultStorageState,
  clearLocalStorage,
} from "@/lib/storage/localStorageService";

const AuditorContext = createContext(null);

export function AuditorProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [project, setProject] = useState({ name: "MikroTik Lab Project", targetVersion: "7.x" });
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userSettings, setUserSettings] = useState({ autoVerifyOnPaste: false, preferredVersion: "7.x" });

  // Safe client-side hydration from LocalStorage on mount
  useEffect(() => {
    const loaded = loadFromLocalStorage(DEFAULT_QUESTIONS);
    setProject(loaded.project);
    setQuestions(loaded.questions);
    setRecentActivities(loaded.recentActivities);
    setUserSettings(loaded.userSettings);
    setIsHydrated(true);
  }, []);

  // Auto-save changes to LocalStorage whenever state updates after hydration
  useEffect(() => {
    if (!isHydrated) return;

    saveToLocalStorage({
      project,
      questions,
      recentActivities,
      userSettings,
    });
  }, [project, questions, recentActivities, userSettings, isHydrated]);

  // Log an activity entry
  const logActivity = useCallback((message) => {
    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setRecentActivities((prev) => [newActivity, ...prev.slice(0, 24)]);
  }, []);

  // Add Question
  const addQuestion = useCallback(
    (questionData) => {
      setQuestions((prev) => [...prev, questionData]);
      logActivity(`Added task #${questionData.number}: "${questionData.title}"`);
    },
    [logActivity]
  );

  // Update Question (CRUD or progress)
  const updateQuestion = useCallback(
    (questionId, updates) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
      );
    },
    []
  );

  // Save Progress (Config draft & version)
  const saveProgress = useCallback(
    (questionId, updates) => {
      updateQuestion(questionId, updates);
    },
    [updateQuestion]
  );

  // Mark task as completed
  const completeTask = useCallback(
    (questionId, completionData) => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              ...completionData,
              status: "completed",
            };
          }
          return q;
        })
      );
      const target = questions.find((q) => q.id === questionId);
      logActivity(`Completed task #${target?.number || ""}: "${target?.title || ""}"`);
    },
    [questions, logActivity]
  );

  // Delete Question
  const deleteQuestion = useCallback(
    (questionId) => {
      const target = questions.find((q) => q.id === questionId);
      if (!target) return;
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      logActivity(`Deleted task #${target.number} ("${target.title}")`);
    },
    [questions, logActivity]
  );

  // Duplicate Question
  const duplicateQuestion = useCallback(
    (question) => {
      const nextNum =
        questions.length > 0
          ? Math.max(...questions.map((q) => q.number || 0)) + 1
          : 1;

      const duplicated = {
        ...question,
        id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        number: nextNum,
        title: `${question.title} (Copy)`,
        status: "pending",
        configText: question.configText || "",
        verificationResult: null,
      };

      setQuestions((prev) => [...prev, duplicated]);
      logActivity(`Duplicated task #${question.number} into #${nextNum}`);
    },
    [questions, logActivity]
  );

  // Batch import questions (e.g. from OCR or JSON backup)
  const importQuestions = useCallback(
    (newQuestions) => {
      if (!newQuestions || newQuestions.length === 0) return;
      setQuestions((prev) => [...prev, ...newQuestions]);
      logActivity(`Imported ${newQuestions.length} new tasks`);
    },
    [logActivity]
  );

  // Restore complete state (from JSON backup)
  const restoreState = useCallback(
    (newState) => {
      if (!newState) return;
      if (newState.project) setProject(newState.project);
      if (Array.isArray(newState.questions)) setQuestions(newState.questions);
      if (Array.isArray(newState.recentActivities)) setRecentActivities(newState.recentActivities);
      if (newState.userSettings) setUserSettings(newState.userSettings);
      logActivity("Restored project state from JSON backup");
    },
    [logActivity]
  );

  // Reset to default questions
  const resetToDefaults = useCallback(() => {
    clearLocalStorage();
    const defaults = getDefaultStorageState(DEFAULT_QUESTIONS);
    setProject(defaults.project);
    setQuestions(defaults.questions);
    setRecentActivities(defaults.recentActivities);
    setUserSettings(defaults.userSettings);
  }, []);

  return (
    <AuditorContext.Provider
      value={{
        isHydrated,
        project,
        setProject,
        questions,
        recentActivities,
        userSettings,
        setUserSettings,
        addQuestion,
        updateQuestion,
        saveProgress,
        completeTask,
        deleteQuestion,
        duplicateQuestion,
        importQuestions,
        restoreState,
        resetToDefaults,
        logActivity,
      }}
    >
      {children}
    </AuditorContext.Provider>
  );
}

export function useAuditor() {
  const context = useContext(AuditorContext);
  if (!context) {
    throw new Error("useAuditor must be used within an AuditorProvider");
  }
  return context;
}
