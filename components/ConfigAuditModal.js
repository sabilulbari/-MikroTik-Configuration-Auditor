"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Terminal, 
  Clipboard, 
  Trash2, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";
import { verifyConfiguration } from "@/lib/engine/ruleEngine";
import RuleResultView from "./RuleResultView";

export default function ConfigAuditModal({
  isOpen,
  onClose,
  question,
  onSaveProgress,
  onCompleteTask,
}) {
  const [configText, setConfigText] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("7.x");
  const [verificationResult, setVerificationResult] = useState(null);
  const [hasChangedSinceVerify, setHasChangedSinceVerify] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    if (isOpen && question) {
      setConfigText(question.configText || "");
      setSelectedVersion(question.routerOSVersion || "7.x");
      setVerificationResult(question.verificationResult || null);
      setHasChangedSinceVerify(false);
      setCopyFeedback("");
    }
  }, [isOpen, question]);

  if (!isOpen || !question) return null;

  // Auto-save configuration text on keystroke
  const handleConfigChange = (newText) => {
    setConfigText(newText);
    setHasChangedSinceVerify(true);
    if (onSaveProgress) {
      onSaveProgress(question.id, {
        configText: newText,
        routerOSVersion: selectedVersion,
      });
    }
  };

  // Paste from clipboard
  const handlePasteConfig = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const updated = configText ? `${configText}\n${text}` : text;
          handleConfigChange(updated);
          setCopyFeedback("Pasted from clipboard!");
          setTimeout(() => setCopyFeedback(""), 2000);
        }
      } else {
        alert("Clipboard access not supported by browser. Please paste using Ctrl+V.");
      }
    } catch (err) {
      console.warn("Clipboard access denied or unavailable", err);
      alert("Clipboard access was blocked. Please paste directly into the editor using Ctrl+V / Cmd+V.");
    }
  };

  // Clear editor
  const handleClearEditor = () => {
    if (configText.trim().length > 0) {
      if (window.confirm("Are you sure you want to clear the editor?")) {
        handleConfigChange("");
        setVerificationResult(null);
      }
    }
  };

  // Run Verification
  const handleVerify = () => {
    const result = verifyConfiguration(configText, question, selectedVersion);
    setVerificationResult(result);
    setHasChangedSinceVerify(false);

    if (onSaveProgress) {
      onSaveProgress(question.id, {
        configText,
        routerOSVersion: selectedVersion,
        verificationResult: result,
      });
    }
  };

  // Complete Question (Done button)
  const handleDone = () => {
    if (!verificationResult || !verificationResult.passed) return;

    onCompleteTask(question.id, {
      status: "completed",
      configText,
      routerOSVersion: selectedVersion,
      verificationResult,
      completedAt: new Date().toISOString(),
    });
    onClose();
  };

  const isDoneEnabled = Boolean(
    verificationResult &&
    verificationResult.passed &&
    !hasChangedSinceVerify
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 font-mono-code">
              #{question.number}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {question.title}
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {question.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {question.description || "Paste RouterOS export configuration commands to verify syntax."}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Controls Bar: Version Selector & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">RouterOS Version:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVersion("7.x");
                    setHasChangedSinceVerify(true);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    selectedVersion === "7.x"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  RouterOS 7.x
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVersion("6.x");
                    setHasChangedSinceVerify(true);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    selectedVersion === "6.x"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  RouterOS 6.x Legacy
                </button>
              </div>
            </div>

            {/* Paste & Clear buttons */}
            <div className="flex items-center gap-2">
              {copyFeedback && (
                <span className="text-emerald-600 font-semibold text-xs">
                  {copyFeedback}
                </span>
              )}
              <button
                type="button"
                onClick={handlePasteConfig}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Paste Configuration</span>
              </button>
              <button
                type="button"
                onClick={handleClearEditor}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                title="Clear editor"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Configuration Monospace Text Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>RouterOS Configuration Editor</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Auto-saves on input • Monospace syntax
              </span>
            </div>

            <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all bg-slate-950 text-slate-100 overflow-hidden shadow-inner">
              <textarea
                value={configText}
                onChange={(e) => handleConfigChange(e.target.value)}
                rows={8}
                placeholder={`# Paste RouterOS export config here, for example:\n/ip address\nadd address=192.168.88.1/24 interface=ether2`}
                className="w-full p-4 font-mono-code text-xs sm:text-sm bg-transparent outline-none resize-y leading-relaxed text-slate-200 placeholder-slate-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Bar: Verify Button */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500">
              {hasChangedSinceVerify && verificationResult && (
                <span className="text-amber-600 font-medium">
                  Configuration modified — re-verification required.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerify}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Verify Configuration</span>
            </button>
          </div>

          {/* Verification Results Section */}
          {verificationResult && (
            <div className="pt-3 border-t border-slate-100">
              <RuleResultView
                result={verificationResult}
                question={question}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {!isDoneEnabled && (
              <span className="text-xs text-slate-400 italic hidden sm:inline">
                Pass all required rules to unlock completion
              </span>
            )}
            <button
              type="button"
              disabled={!isDoneEnabled}
              onClick={handleDone}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
                isDoneEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Done & Mark Completed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
