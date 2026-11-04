"use client";

import React from "react";
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Image as ImageIcon,
  Activity
} from "lucide-react";

export default function Navbar({
  onOpenAddModal,
  onOpenOcrModal,
  onOpenBackupModal,
  onGeneratePdf,
  isGeneratingPdf = false,
  totalCount = 0,
  completedCount = 0
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  MikroTik Configuration Auditor
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  RouterOS 6.x / 7.x
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Professional lab verification, rule auditing & progress tracking
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backup & Restore */}
            <button
              onClick={onOpenBackupModal}
              title="Backup or restore questions and audits"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Backup / Restore</span>
            </button>

            {/* Export PDF Report */}
            <button
              onClick={onGeneratePdf}
              disabled={isGeneratingPdf}
              title="Export complete audit report as PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">
                {isGeneratingPdf ? "Generating..." : "PDF Report"}
              </span>
            </button>

            {/* OCR Upload */}
            <button
              onClick={onOpenOcrModal}
              title="Upload question sheet or screenshot for OCR extraction"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/70"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Upload Image (OCR)</span>
            </button>

            {/* Add Question Button */}
            <button
              onClick={onOpenAddModal}
              title="Create a new manual configuration question"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
