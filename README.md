# MikroTik Configuration Auditor

A production-grade, local-first web application designed for networking students, network administrators, and MikroTik engineers to organize configuration exercises, paste RouterOS export configurations, verify syntax and parameters against version-aware rules, pinpoint configuration errors, and track progress towards certification and deployment readiness.

## Key Features

- **Version-Aware Verification**: Supports both MikroTik RouterOS 6.x and RouterOS 7.x syntax distinctions.
- **Custom RouterOS Export Parser**: High-accuracy JavaScript AST generator that parses commands, sections, key-value pairs, quoted strings, and comments without `eval()`.
- **Intelligent Verification Engine**: Evaluates required vs optional rules, parameter values, alternative values, cross-section relationships, and gives clear diagnostic messages and suggested fixes.
- **Tesseract.js OCR System**: Allows uploading lab assignments, exam sheets, or screenshot images (JPG, PNG) with confidence scores, review screen, and question extraction.
- **Manual Task Management**: Create, edit, delete, and duplicate custom networking tasks.
- **Local-First & Offline**: Browser LocalStorage persistence with safe hydration, schema versioning, and zero cloud/backend dependencies.
- **Reports & Portability**: Export comprehensive PDF audit reports (jsPDF) and download/restore encrypted or plain JSON project backups.
- **Clean SaaS Dashboard**: Modern light theme interface inspired by enterprise network operations centers (NOC).

## Tech Stack

- **Framework**: Next.js (App Router) + React
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **OCR Engine**: Tesseract.js
- **Report Generation**: jsPDF
- **Testing**: Vitest
- **Persistence**: Browser LocalStorage with schema versioning

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation

```bash
cd mikrotik-config-auditor
npm install
```

### Running Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm run start
```

## Security & Privacy Notice
- All configuration parsing and validation runs 100% locally in your browser.
- No network configuration, export, or lab task is transmitted to external servers.
- No command execution or `eval()` is performed. All RouterOS configurations are evaluated strictly as text tokens.
