# Cacao Flavor Profiling App - Technical Guide

This document outlines the technical architecture, component relationships, and data flow of the application. It is designed to help AI agents and developers understand the codebase structure.

## 1. Core Architecture
*   **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS.
*   **Routing**: `react-router-dom` (HashRouter) for static hosting compatibility (GitHub Pages).
*   **State Management**: React Context (`LanguageContext`) + Local Component State.
*   **Persistence**: IndexedDB via `idb` library (Offline-first architecture).

## 2. Page Structure & Component Tech Map

### A. App Entry (`App.tsx`)
*   **Role**: Main entry point, handles routing and global context providers.
*   **Key Dependencies**: `LanguageProvider`, `HashRouter`.

### B. Evaluate Page (`src/pages/EvaluatePage.tsx`)
*   **Route**: `/evaluate`
*   **Role**: The primary data entry form for new evaluations.
*   **Key Functions**:
    *   `saveSession()`: Validates form data (Code + Evaluator + Date) and calls `dbService.transact()` to save.
    *   `handleQualitySelect()`: Updates the `selectedQualityId` state.
*   **Child Components**:
    *   `ScoreSlider.tsx`: Renders individual attribute sliders with accordion logic.
    *   `MobileNav.tsx`: Floating action button for quick scrolling on mobile.
    *   `GuidelinesModal.tsx`: Displays reference info for specific attributes.

### C. Samples Library (`src/pages/SamplesPage.tsx`)
*   **Route**: `/samples`
*   **Role**: Dashboard to view, filter, and manage saved evaluations.
*   **Key Functions**:
    *   `loadSamples()`: Fetches all records via `dbService.getAllSamples()`.
    *   `handleExport()`: Generates a CSV blob using `csvService.ts`.
    *   `handleImportClick()`: Triggers file input to parse CSVs via `PapaParse`.
    *   `handleCompare()`: Navigates to comparison page with selected IDs.
*   **Child Components**:
    *   `SampleLibraryCard.tsx`: Individual card display with Mini-Charts (`IndividualBarChart`).

### D. Compare Page (`src/pages/ComparePage.tsx`)
*   **Route**: `/compare`
*   **Role**: Visualization dashboard for side-by-side sample comparison.
*   **Key Components**:
    *   `SpiderChart.tsx`: Recharts-based radar chart overlaying multiple sample profiles.
    *   `ComparisonBarChart.tsx`: Grouped bar chart for direct attribute comparison.

### E. References Page (`src/pages/ReferencesPage.tsx`)
*   **Route**: `/references`
*   **Role**: Static page for external links and guides.

## 3. Core Services (`src/services/`)

### A. Database Service (`dbService.ts`)
*   **Technology**: `idb` (IndexedDB wrapper).
*   **Store Name**: `samples`.
*   **Key Methods**:
    *   `saveSample(sample)`: Upserts a sample record.
    *   `getAllSamples()`: Returns all records sorted by date.
    *   `deleteSample(id)`: Removes a record by key.
    *   `importSamples(samples)`: Bulk upsert transaction.

### B. CSV Service (`csvService.ts`)
*   **Role**: Handles data transformation for Import/Export.
*   **Key Methods**:
    *   `generateCSVRow(sample)`: Flattens a nested `StoredSample` object into a single CSV row array.
    *   `parseSamplesFromCSV(data)`: Reconstructs `StoredSample` objects from flat CSV rows.

### C. PDF Service (`pdfService.ts`)
*   **Library**: `jspdf` + `jspdf-autotable`.
*   **Role**: Generates print-ready PDFs.
*   **Key Methods**:
    *   `generatePdf(sessions)`: Creates a report with header info, attribute tables, and vector-drawn charts.

## 4. Data Models (`src/types.ts`)

### `FlavorAttribute`
*   **id**: string (e.g., 'attr_cocoa')
*   **score**: number (0-10)
*   **subAttributes**: Array of `SubAttribute`

### `StoredSample`
*   **id**: UUID (string)
*   **sampleCode**: string
*   **evaluator**: string
*   **date**: string (YYYY-MM-DD)
*   **attributes**: `FlavorAttribute[]`
*   **globalQuality**: number

## 5. UI/UX Considerations
*   **Touch Optimization**: Sliders use `touch-action: pan-y` to prevent scroll interference.
*   **Responsiveness**:
    *   `MobileNav` handles deep linking on small screens.
    *   Charts are responsive via `ResponsiveContainer`.
*   **Navigation**: Uses `useNavigate` hook for SPA routing consistent with HashRouter.
