"use client";

import React, { useState } from "react";
import { AuditorProvider, useAuditor } from "@/context/AuditorContext";
import Navbar from "@/components/Navbar";
import QuestionList from "@/components/QuestionList";
import DashboardStats from "@/components/DashboardStats";
import ManualQuestionModal from "@/components/ManualQuestionModal";
import OcrUploadModal from "@/components/OcrUploadModal";
import ConfigAuditModal from "@/components/ConfigAuditModal";
import BackupModal from "@/components/BackupModal";
import { generateAuditPdf } from "@/lib/reports/pdfGenerator";

function DashboardInner() {
  const {
    isHydrated,
    project,
    questions,
    recentActivities,
    addQuestion,
    updateQuestion,
    saveProgress,
    completeTask,
    deleteQuestion,
    duplicateQuestion,
    importQuestions,
    restoreState,
    resetToDefaults,
  } = useAuditor();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState("all");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditingQuestion, setAuditingQuestion] = useState(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Open Edit Modal
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsManualModalOpen(true);
  };

  // Open Audit Configuration Modal
  const handleOpenAudit = (question) => {
    setAuditingQuestion(question);
    setIsAuditModalOpen(true);
  };

  // Save question from Manual Modal
  const handleSaveQuestion = (questionData) => {
    if (editingQuestion) {
      updateQuestion(questionData.id, questionData);
    } else {
      addQuestion(questionData);
    }
  };

  // Generate PDF Audit Report
  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateAuditPdf({
        project,
        questions,
      });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error generating PDF report. Please check the browser console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Prevent SSR hydration flicker
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Loading MikroTik Auditor Workspace...
          </p>
        </div>
      </div>
    );
  }

  const completedCount = questions.filter((q) => q.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Application Navbar */}
      <Navbar
        onOpenAddModal={() => {
          setEditingQuestion(null);
          setIsManualModalOpen(true);
        }}
        onOpenOcrModal={() => setIsOcrModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={isGeneratingPdf}
        totalCount={questions.length}
        completedCount={completedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Content: Questions & Controls (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            <QuestionList
              questions={questions}
              onOpenAudit={handleOpenAudit}
              onOpenAddModal={() => {
                setEditingQuestion(null);
                setIsManualModalOpen(true);
              }}
              onOpenOcrModal={() => setIsOcrModalOpen(true)}
              onEditQuestion={handleEditQuestion}
              onDuplicateQuestion={duplicateQuestion}
              onDeleteQuestion={deleteQuestion}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          {/* Right Sidebar: Statistics, Progress & Recent Activity (4 cols on lg) */}
          <div className="lg:col-span-4 sticky top-22">
            <DashboardStats
              questions={questions}
              recentActivities={recentActivities}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
          </div>
        </div>
      </main>

      {/* Manual Question Modal */}
      <ManualQuestionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSaveQuestion}
        initialQuestion={editingQuestion}
        nextNumber={
          questions.length > 0
            ? Math.max(...questions.map((q) => q.number || 0)) + 1
            : 1
        }
      />

      {/* OCR Image Upload Modal */}
      <OcrUploadModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onImportQuestions={importQuestions}
        startingNumber={
          questions.length > 0
            ? Math.max(...questions.map((q) => q.number || 0)) + 1
            : 1
        }
      />

      {/* Configuration Audit & Verification Modal */}
      <ConfigAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setAuditingQuestion(null);
        }}
        question={auditingQuestion}
        onSaveProgress={saveProgress}
        onCompleteTask={completeTask}
      />

      {/* JSON Backup, Restore & Reset Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        state={{
          project,
          questions,
          recentActivities,
        }}
        onRestoreState={restoreState}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuditorProvider>
      <DashboardInner />
    </AuditorProvider>
  );
}
