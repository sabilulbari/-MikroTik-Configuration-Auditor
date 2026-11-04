"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Lightbulb,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

export default function RuleResultView({ result, question }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!result) return null;

  const handleCopyFix = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!result.isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
          <Info className="w-4 h-4 text-amber-600" />
          <span>Rules Not Defined</span>
        </div>
        <p className="text-xs text-amber-700 leading-relaxed">
          {result.message || "Verification rules not available yet for this task."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Result Overview Header Card */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          result.passed
            ? "bg-emerald-50/80 border-emerald-200"
            : "bg-rose-50/80 border-rose-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              result.passed
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-rose-600 text-white shadow-xs"
            }`}
          >
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold uppercase tracking-wide ${
                  result.passed ? "text-emerald-900" : "text-rose-900"
                }`}
              >
                {result.passed ? "Audit Passed" : "Verification Failed"}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  result.passed
                    ? "bg-emerald-200/70 text-emerald-800"
                    : "bg-rose-200/70 text-rose-800"
                }`}
              >
                {result.passedRules} / {result.totalRules} Rules Passed
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {result.passed
                ? "All required RouterOS configuration parameters matched correctly."
                : result.message || "Corrections required before this task can be marked completed."}
            </p>
          </div>
        </div>

        {/* Counts summary pills */}
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <span className="px-2.5 py-1 bg-white/80 rounded-lg border border-slate-200 text-emerald-700">
            {result.passedRules} Passed
          </span>
          <span className="px-2.5 py-1 bg-white/80 rounded-lg border border-slate-200 text-rose-700">
            {result.failedRules} Failed
          </span>
          {result.missingRules > 0 && (
            <span className="px-2.5 py-1 bg-white/80 rounded-lg border border-slate-200 text-amber-700">
              {result.missingRules} Missing
            </span>
          )}
        </div>
      </div>

      {/* Rules Breakdown List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Rule-by-Rule Breakdown
        </h4>

        {result.checks.map((rule, idx) => {
          const isPassed = rule.status === "passed";
          const isMissing = rule.status === "missing";

          return (
            <div
              key={rule.ruleId || idx}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                isPassed
                  ? "border-emerald-200/70 bg-emerald-50/10"
                  : isMissing
                  ? "border-amber-200 bg-amber-50/15"
                  : "border-rose-200 bg-rose-50/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isMissing ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {rule.ruleTitle}
                      </span>
                      {rule.required && (
                        <span className="text-[10px] uppercase font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rule.explanation}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${
                    isPassed
                      ? "bg-emerald-100 text-emerald-800"
                      : isMissing
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {rule.status}
                </span>
              </div>

              {/* Matched raw command line if found */}
              {rule.matchedLine && (
                <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono-code text-slate-700">
                  <span className="text-slate-400 select-none mr-2">Line {rule.lineNumber}:</span>
                  <span>{rule.matchedLine}</span>
                </div>
              )}

              {/* Parameter Table */}
              {rule.paramResults && rule.paramResults.length > 0 && (
                <div className="mt-3 overflow-x-auto border border-slate-200/80 rounded-lg">
                  <table className="min-w-full text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-1.5 text-left">Parameter</th>
                        <th className="px-3 py-1.5 text-left">Expected</th>
                        <th className="px-3 py-1.5 text-left">Actual in Config</th>
                        <th className="px-3 py-1.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {rule.paramResults.map((param, pIdx) => (
                        <tr key={pIdx}>
                          <td className="px-3 py-2 font-mono-code font-medium text-slate-800">
                            {param.field}
                          </td>
                          <td className="px-3 py-2 font-mono-code text-slate-600">
                            {param.expected}
                          </td>
                          <td className="px-3 py-2 font-mono-code">
                            <span
                              className={
                                param.status === "passed"
                                  ? "text-emerald-700 font-semibold"
                                  : "text-rose-600 font-semibold"
                              }
                            >
                              {param.actual}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {param.status === "passed" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" /> Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                <XCircle className="w-3 h-3" /> Mismatch
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Suggested Fix Box if rule failed or missing */}
              {!isPassed && rule.suggestedFix && (
                <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-900">Suggested Fix: </span>
                      <code className="font-mono-code text-blue-950 font-medium">
                        {rule.suggestedFix}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyFix(rule.suggestedFix, idx)}
                    title="Copy suggestion to clipboard"
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors shrink-0"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Network Engineering Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] text-slate-500">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Operational Distinction:</strong> Static export verification validates syntactical commands and parameters according to the curriculum lab rules. It does not measure physical Ethernet link negotiation, IP gateway ARP resolution, or ISP connectivity.
        </span>
      </div>
    </div>
  );
}
