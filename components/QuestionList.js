"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Filter, 
  Plus, 
  Image as ImageIcon,
  FolderOpen,
  ArrowUpDown
} from "lucide-react";
import QuestionCard from "./QuestionCard";
import { QUESTION_CATEGORIES } from "@/lib/data/defaultQuestions";

export default function QuestionList({
  questions = [],
  onOpenAudit,
  onOpenAddModal,
  onOpenOcrModal,
  onEditQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  statusFilter = "all",
  setStatusFilter,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("number-asc");

  // Counts for tabs
  const totalCount = questions.length;
  const completedCount = questions.filter((q) => q.status === "completed").length;
  const pendingCount = totalCount - completedCount;

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        // Status filter
        if (statusFilter === "completed" && q.status !== "completed") return false;
        if (statusFilter === "pending" && q.status !== "pending") return false;

        // Category filter
        if (selectedCategory !== "All" && q.category !== selectedCategory) return false;

        // Search query (number, title, category, description)
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const matchTitle = q.title.toLowerCase().includes(query);
          const matchCategory = q.category.toLowerCase().includes(query);
          const matchNumber = String(q.number).includes(query);
          const matchDesc = (q.description || "").toLowerCase().includes(query);
          return matchTitle || matchCategory || matchNumber || matchDesc;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "number-asc") return a.number - b.number;
        if (sortBy === "number-desc") return b.number - a.number;
        if (sortBy === "title-asc") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [questions, statusFilter, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Main Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, category, #number, or keyword..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons for Mobile / Compact Header */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenOcrModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Image Upload</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Tabs: All, Pending, Completed */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === "all"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === "pending"
                  ? "bg-white text-amber-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === "completed"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Category Selector & Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {QUESTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="number-asc">Sort: # Ascending</option>
                <option value="number-desc">Sort: # Descending</option>
                <option value="title-asc">Sort: Title A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Listing */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No configuration questions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search query, clearing active filters, or adding new questions.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || selectedCategory !== "All" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setStatusFilter("all");
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create New Question
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onOpenAudit={onOpenAudit}
              onEdit={onEditQuestion}
              onDuplicate={onDuplicateQuestion}
              onDelete={onDeleteQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
