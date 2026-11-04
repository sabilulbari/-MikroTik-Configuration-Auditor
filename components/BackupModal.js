"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Layers,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { exportProjectToJson, validateBackupJson } from "@/lib/backup/backupService";

export default function BackupModal({
  isOpen,
  onClose,
  state,
  onRestoreState,
  onResetToDefaults,
}) {
  const [activeTab, setActiveTab] = useState("export"); // 'export' | 'import' | 'reset'
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const totalQuestions = state.questions?.length || 0;
  const completedQuestions = state.questions?.filter((q) => q.status === "completed").length || 0;

  const handleExport = () => {
    exportProjectToJson(state, state.project?.name || "MikroTik-Lab");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setValidationResult(null);
    setShowConfirmation(false);

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setImportError("Please select a valid .json backup file.");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = validateBackupJson(content);
      if (res.valid) {
        setValidationResult(res);
      } else {
        setImportError(res.error || "Invalid backup file format.");
      }
    };
    reader.onerror = () => {
      setImportError("Error reading the file.");
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!validationResult || !validationResult.data) return;
    onRestoreState(validationResult.data);
    onClose();
  };

  const handleConfirmReset = () => {
    if (window.confirm("Are you sure you want to reset all tasks to the starter questions? This cannot be undone.")) {
      onResetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Backup & Restore Center
              </h2>
              <p className="text-xs text-slate-500">
                Export project data or restore from a previously saved JSON snapshot
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("export")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "export"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Export Backup
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "import"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Restore Backup
          </button>
          <button
            onClick={() => setActiveTab("reset")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "reset"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Reset Project
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* TAB 1: EXPORT */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Project Name:</span>
                  <span className="font-semibold text-slate-800">{state.project?.name || "MikroTik Lab Project"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Tasks:</span>
                  <span className="font-semibold text-slate-800">{totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completed & Verified:</span>
                  <span className="font-semibold text-emerald-600">{completedQuestions}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Storage Persistence:</span>
                  <span className="font-semibold text-blue-600">LocalStorage + JSON Export</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Download a complete, portable JSON backup containing all configuration tasks, verification history, and RouterOS drafts. You can restore this file on any machine or browser.
              </p>

              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete Project JSON</span>
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === "import" && (
            <div className="space-y-4">
              {importError && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Upload trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : "Select a .json backup file to inspect"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to browse from your device
                </p>
              </div>

              {/* Validation Preview */}
              {validationResult && validationResult.valid && (
                <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Valid Backup File Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-600">
                      Project: <span className="font-semibold text-slate-900">{validationResult.preview.projectName}</span>
                    </div>
                    <div className="text-slate-600">
                      Total Tasks: <span className="font-semibold text-slate-900">{validationResult.preview.totalQuestions}</span>
                    </div>
                    <div className="text-slate-600">
                      Completed: <span className="font-semibold text-emerald-700">{validationResult.preview.completedCount}</span>
                    </div>
                    <div className="text-slate-600">
                      Export Date: <span className="font-semibold text-slate-900">{new Date(validationResult.preview.exportDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Warning before overwrite */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Warning:</strong> Restoring will replace your current workspace tasks with the contents of this backup file.
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmRestore}
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Confirm & Restore This Backup
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESET TO DEFAULTS */}
          {activeTab === "reset" && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Reset All Workspace Data</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  This action will clear all current custom tasks, pasted RouterOS configurations, and audit results, restoring the original 25 MikroTik starter library questions.
                </p>
              </div>

              <button
                onClick={handleConfirmReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Starter Lab Questions</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
