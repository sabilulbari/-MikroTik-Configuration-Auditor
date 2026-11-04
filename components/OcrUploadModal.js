"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles,
  RefreshCw,
  Eye
} from "lucide-react";
import { createWorker } from "tesseract.js";
import { parseOcrTextToQuestions, inferCategory } from "@/lib/ocr/ocrParser";
import { QUESTION_CATEGORIES } from "@/lib/data/defaultQuestions";

export default function OcrUploadModal({
  isOpen,
  onClose,
  onImportQuestions,
  startingNumber = 1,
}) {
  const [step, setStep] = useState("upload"); // 'upload' | 'processing' | 'review'
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [progressStatus, setProgressStatus] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const availableCategories = QUESTION_CATEGORIES.filter((c) => c !== "All");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    setErrorMessage("");

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid JPG, JPEG, or PNG image file.");
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleProcessOcr = async () => {
    if (!selectedFile) return;

    setStep("processing");
    setProgressPercent(0);
    setProgressStatus("Initializing Tesseract OCR engine...");
    setErrorMessage("");

    let worker = null;
    try {
      worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const pct = Math.round((m.progress || 0) * 100);
            setProgressPercent(pct);
            setProgressStatus(`Recognizing text... ${pct}%`);
          } else {
            setProgressStatus(m.status || "Analyzing image...");
          }
        },
      });

      const ret = await worker.recognize(selectedFile);
      const text = ret.data.text || "";
      const confidence = ret.data.confidence || 0;

      setOcrConfidence(Math.round(confidence));

      // Parse the recognized text into question items
      const questions = parseOcrTextToQuestions(text, startingNumber);

      if (questions.length === 0) {
        // Fallback: create at least one manual editable item with the raw text
        questions.push({
          id: `ocr-${Date.now()}-1`,
          number: startingNumber,
          title: "Extracted Configuration Question",
          category: inferCategory(text),
          description: text.trim().slice(0, 300),
          status: "pending",
          configText: "",
          routerOSVersion: "7.x",
          verificationResult: null,
          rules: null,
        });
      }

      setExtractedQuestions(questions);
      setStep("review");
    } catch (err) {
      console.error("OCR error:", err);
      setErrorMessage(
        "Failed to extract text from the image. Please verify the image is readable or enter tasks manually."
      );
      setStep("upload");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Modify individual question in review screen
  const handleUpdateItem = (index, field, value) => {
    setExtractedQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Delete item from review screen
  const handleDeleteItem = (index) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Add missing question
  const handleAddMissingItem = () => {
    const nextNum =
      extractedQuestions.length > 0
        ? Math.max(...extractedQuestions.map((q) => q.number || 0)) + 1
        : startingNumber;

    setExtractedQuestions((prev) => [
      ...prev,
      {
        id: `ocr-${Date.now()}-${prev.length + 1}`,
        number: nextNum,
        title: "New Extracted Task",
        category: "IP Addressing",
        description: "",
        status: "pending",
        configText: "",
        routerOSVersion: "7.x",
        verificationResult: null,
        rules: null,
      },
    ]);
  };

  // Approve & Import
  const handleConfirmImport = () => {
    if (extractedQuestions.length === 0) {
      setErrorMessage("No questions available to import.");
      return;
    }

    // Filter out any without title
    const validQuestions = extractedQuestions
      .filter((q) => q.title && q.title.trim().length > 0)
      .map((q, idx) => ({
        ...q,
        number: startingNumber + idx,
      }));

    onImportQuestions(validQuestions);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setExtractedQuestions([]);
    setProgressPercent(0);
    setProgressStatus("");
    setOcrConfidence(null);
    setErrorMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === "review" ? "Review OCR Extracted Questions" : "Upload Question Image (OCR)"}
              </h2>
              <p className="text-xs text-slate-500">
                {step === "review"
                  ? "Verify, correct, and edit detected questions before importing to your dashboard"
                  : "Upload a photo or screenshot of MikroTik questions (JPG or PNG)"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD & PREVIEW */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Click to select or drag and drop an image
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, or JPEG up to 10MB
                </p>
              </div>

              {/* Image Preview if selected */}
              {imagePreviewUrl && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="font-medium truncate max-w-xs">{selectedFile?.name}</span>
                    <span className="text-slate-400 font-mono">
                      {(selectedFile?.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-black/5 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded preview"
                      className="max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1.5: PROCESSING */}
          {step === "processing" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {progressStatus}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Using local Tesseract.js engine. No files are uploaded to any server.
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW SCREEN (BEFORE IMPORT) */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Review summary header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-900">
                    Detected {extractedQuestions.length} Questions
                  </span>
                  {ocrConfidence !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold border ${
                        ocrConfidence >= 80
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : ocrConfidence >= 60
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}
                    >
                      OCR Confidence: {ocrConfidence}%
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAddMissingItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Missing Question</span>
                </button>
              </div>

              {/* Extracted items list */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {extractedQuestions.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(idx, "title", e.target.value)}
                          placeholder="Question Title"
                          className="flex-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                        className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700"
                      >
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        title="Remove false detection"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                      placeholder="Extracted details or constraints (editable)"
                      className="w-full px-2.5 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {step === "review" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Upload</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Import {extractedQuestions.length} Questions</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || step === "processing"}
                onClick={handleProcessOcr}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Process with OCR</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
