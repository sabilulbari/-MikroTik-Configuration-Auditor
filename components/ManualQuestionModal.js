"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit3, AlertCircle } from "lucide-react";
import { QUESTION_CATEGORIES } from "@/lib/data/defaultQuestions";

export default function ManualQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  initialQuestion = null, // if provided, editing mode
  nextNumber = 1,
}) {
  const isEditing = Boolean(initialQuestion);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IP Addressing");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [routerOSVersion, setRouterOSVersion] = useState("7.x");
  const [error, setError] = useState("");

  const availableCategories = QUESTION_CATEGORIES.filter((c) => c !== "All");

  useEffect(() => {
    if (isOpen) {
      if (initialQuestion) {
        setTitle(initialQuestion.title || "");
        if (availableCategories.includes(initialQuestion.category)) {
          setCategory(initialQuestion.category);
          setCustomCategory("");
        } else {
          setCategory("Custom");
          setCustomCategory(initialQuestion.category || "");
        }
        setDescription(initialQuestion.description || "");
        setRouterOSVersion(initialQuestion.routerOSVersion || "7.x");
      } else {
        setTitle("");
        setCategory("IP Addressing");
        setCustomCategory("");
        setDescription("");
        setRouterOSVersion("7.x");
      }
      setError("");
    }
  }, [isOpen, initialQuestion]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Question title cannot be empty.");
      return;
    }

    const finalCategory =
      category === "Custom"
        ? (customCategory.trim() || "Custom")
        : category;

    const questionData = {
      id: initialQuestion ? initialQuestion.id : `q-${Date.now()}`,
      number: initialQuestion ? initialQuestion.number : nextNumber,
      title: trimmedTitle,
      category: finalCategory,
      description: description.trim(),
      status: initialQuestion ? initialQuestion.status : "pending",
      configText: initialQuestion ? initialQuestion.configText : "",
      routerOSVersion,
      verificationResult: initialQuestion ? initialQuestion.verificationResult : null,
      rules: initialQuestion ? initialQuestion.rules : null,
    };

    onSubmit(questionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? `Edit Task #${initialQuestion.number}` : "Create New Task"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? "Update question title, category, or notes" : "Add a custom MikroTik configuration task"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Question Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Configure WireGuard VPN Interface"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              autoFocus
            />
          </div>

          {/* Category & RouterOS Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                RouterOS Target
              </label>
              <select
                value={routerOSVersion}
                onChange={(e) => setRouterOSVersion(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              >
                <option value="7.x">RouterOS 7.x (Recommended)</option>
                <option value="6.x">RouterOS 6.x Legacy</option>
              </select>
            </div>
          </div>

          {/* Custom Category Input if selected */}
          {category === "Custom" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Category Name
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g., WireGuard, BGP, MPLS"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Task Description & Instructions <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify requirements, IPs, interfaces, or constraints for this lab task..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
