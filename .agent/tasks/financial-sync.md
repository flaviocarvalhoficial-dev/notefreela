# Task: Financial Sync Implementation

## Status
- [x] Completed

## Context
Implement the synchronization between project financial registration and the main financial dashboard.

## Implementation Steps
- [x] Create project task tracking file
- [x] Analyze existing project creation and financial logic
- [x] Define new data model (BillingAgreement, Installment, Transaction)
- [x] Create SQL migration for new tables and RLS
- [x] Implement billing generation utility (`src/utils/billing.ts`)
- [x] Create billing synchronization hook (`src/hooks/use-billing-sync.ts`)
- [x] Refactor `EditProjectDialog.tsx` to use the new billing sync logic
- [x] Refactor `NewProjectDialog.tsx` to use the new billing sync logic
- [x] Update `useFinancialData.ts` to source data from the new tables
- [x] Update `FinancialReportsModal.tsx` to use the new data model
- [x] Final UI refinements and polish

## Key Changes
- **New Tables**: `billing_agreements`, `installments`, `transactions`.
- **Hybrid Hub**: `useFinancialData.ts` now fetches from both legacy (`project_costs`) and new tables to ensure continuity.
- **Smart Generation**: Recalculates only `provisionado` (pending) installments, preserving historical `recebido` (paid) records.
- **Reports**: Updated to accurately reflect both realized income and future projections.
