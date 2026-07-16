# Clear All Applications — Design Spec

## Purpose

Allow users to start a fresh application cycle by permanently deleting all existing applications and related data from a single button in Settings.

## Scope

**Deleted:** All applications + cascaded notes, interviews, status changes, tag associations.
**Preserved:** Tags, resume, API keys, account.

## Backend

### New Service Method

`clearAllApplications(clerkUserId: string)` in `application.service.ts`:
- `prisma.application.deleteMany({ where: { clerkUserId } })`
- Prisma cascade deletes handle related records (notes, interviews, statusChanges, applicationTags)
- Returns the count of deleted applications

### New Route

`DELETE /api/applications/clear-all` in `applications.ts`:
- Place **before** the `/:id` route to avoid route conflict
- Protected by `requireAuth()` middleware
- Returns `{ deleted: number }`

### Count

Reuse `GET /api/dashboard/stats` (already returns total application count) for the confirmation modal.

## Frontend

### Settings Page (`SettingsPage.tsx`)

Add to the existing "Data" section:
- "Clear All Applications" button with destructive (red) styling
- On click: fetch application count from dashboard stats, then open confirmation modal

### Confirmation Modal

- Displays: "This will permanently delete **{count} applications** and all related notes, interviews, and status history. This cannot be undone."
- Cancel button (default focus) and "Delete All" button (red/destructive)
- Loading state on Delete All button during API call
- On success: close modal, invalidate React Query cache (`applications`, `dashboard`), show success toast
- On error: show error message in modal

## UX Flow

1. User navigates to Settings
2. Clicks "Clear All Applications" in Data section
3. Modal shows count + warning
4. User confirms with "Delete All"
5. All applications deleted, cache refreshed, success feedback shown
