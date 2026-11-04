"use client";

import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Copy, 
  Edit3, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

const CATEGORY_COLORS = {
  "IP Addressing": "bg-blue-50 text-blue-700 border-blue-200/70",
  "DHCP": "bg-purple-50 text-purple-700 border-purple-200/70",
  "Firewall": "bg-rose-50 text-rose-700 border-rose-200/70",
  "NAT": "bg-amber-50 text-amber-700 border-amber-200/70",
  "PPPoE": "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  "Routing": "bg-cyan-50 text-cyan-700 border-cyan-200/70",
  "VLAN": "bg-indigo-50 text-indigo-700 border-indigo-200/70",
  "Custom": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function QuestionCard({
  question,
  onOpenAudit,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  const isCompleted = question.status === "completed";
  const categoryBadgeClass =
    CATEGORY_COLORS[question.category] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 p-4 sm:p-5 shadow-xs hover:shadow-md ${
        isCompleted
          ? "border-emerald-200/80 bg-emerald-50/15"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left Side: Number, Title, Category, Description */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Question Number */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono-code">
              #{question.number}
            </span>

            {/* Category Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryBadgeClass}`}
            >
              {question.category}
            </span>

            {/* Status Indicator */}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-500" />
                Pending
              </span>
            )}

            {/* Version Badge */}
            {question.routerOSVersion && (
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 font-mono-code">
                v{question.routerOSVersion}
              </span>
            )}
          </div>

          {/* Question Title */}
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
            {question.title}
          </h3>

          {/* Description */}
          {question.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {question.description}
            </p>
          )}

          {/* Last Config Preview / Verification Result Preview */}
          {question.configText && (
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 font-mono-code bg-slate-50 p-1.5 rounded border border-slate-100 max-w-xl truncate">
              <Terminal className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{question.configText.split("\n")[0]}</span>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Quick Management Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicate(question)}
              title="Duplicate question"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(question)}
              title="Edit question details"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(question.id)}
              title="Delete question"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Complete Button:
              - Desktop: shown on hover (opacity-0 group-hover:opacity-100)
              - Mobile: always accessible
              - Disabled if completed
          */}
          <button
            onClick={() => onOpenAudit(question)}
            disabled={isCompleted}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
              isCompleted
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 active:scale-95 cursor-pointer"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified</span>
              </>
            ) : (
              <>
                <span>Complete</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
