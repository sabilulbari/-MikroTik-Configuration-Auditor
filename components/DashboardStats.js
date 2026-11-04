"use client";

import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  TrendingUp, 
  Layers, 
  History,
  AlertCircle
} from "lucide-react";

export default function DashboardStats({
  questions = [],
  recentActivities = [],
  activeFilter = "all",
  onFilterChange = () => {}
}) {
  const total = questions.length;
  const completed = questions.filter((q) => q.status === "completed").length;
  const due = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Category breakdown for insights
  const categoryCounts = questions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + (q.status === "completed" ? 1 : 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Audit Progress</span>
          <span className="text-blue-600 font-bold">{percentage}%</span>
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Questions */}
          <div
            onClick={() => onFilterChange("all")}
            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
              activeFilter === "all"
                ? "bg-blue-50/60 border-blue-200"
                : "bg-slate-50/60 border-slate-200/60 hover:bg-slate-100/60"
            }`}
          >
            <div className="flex items-center justify-center text-slate-600 mb-1">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-slate-800">{total}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total</div>
          </div>

          {/* Completed */}
          <div
            onClick={() => onFilterChange("completed")}
            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
              activeFilter === "completed"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50/60 border-slate-200/60 hover:bg-slate-100/60"
            }`}
          >
            <div className="flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-emerald-700">{completed}</div>
            <div className="text-[11px] text-slate-500 font-medium">Completed</div>
          </div>

          {/* Due / Pending */}
          <div
            onClick={() => onFilterChange("pending")}
            className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
              activeFilter === "pending"
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50/60 border-slate-200/60 hover:bg-slate-100/60"
            }`}
          >
            <div className="flex items-center justify-center text-amber-500 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-amber-700">{due}</div>
            <div className="text-[11px] text-slate-500 font-medium">Due</div>
          </div>
        </div>
      </div>

      {/* Completion Status Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Status Highlights</span>
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Verified & Passing:</span>
            <span className="font-semibold text-emerald-600">{completed} tasks</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Pending Audit:</span>
            <span className="font-semibold text-amber-600">{due} tasks</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Engine Ready Rules:</span>
            <span className="font-semibold text-slate-800">
              {questions.filter((q) => q.rules && q.rules.length > 0).length} / {total}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Recent Activity</span>
        </h3>
        {recentActivities.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No activity recorded yet.
            <div className="mt-1 text-[11px] text-slate-400">
              Audit tasks or add questions to see logs here.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800 font-medium leading-snug">
                    {act.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {act.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
