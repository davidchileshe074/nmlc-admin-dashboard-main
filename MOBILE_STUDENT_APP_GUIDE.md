# NLC Mobile App: Student Integration Guide

This document provides full technical documentation for implementing the Student Mobile App, ensuring it remains perfectly synced with the **NLC Admin Dashboard** data models and business logic.

---

## 1. Backend Configuration (Appwrite)
The mobile app must use the same Appwrite project and database as the dashboard.

- **Endpoint:** `https://cloud.appwrite.io/v1`
- **Project ID:** (See `.env.local`)
- **Database ID:** (See `.env.local`)

### Collections Reference:
| Feature | Collection Name | key Fields |
| :--- | :--- | :--- |
| User Profiles | `profiles` | `userId`, `fullName`, `email`, `whatsappNumber`, `program`, `yearOfStudy` |
| Subscriptions | `subscriptions` | `userId`, `status` (ACTIVE/EXPIRED), `expiryDate`, `planId` |
| Content Library | `content` | `title`, `description`, `type` (PDF/AUDIO/VIDEO), `program`, `yearOfStudy`, `storageFileId` |
| Access Codes | `accessCodes` | `code`, `durationDays`, `isUsed`, `usedByUserId` |

---

## 2. Authentication & Onboarding
Students must register using Email and Password. Upon successful registration, a **Profile Document** must be created.

### Registration Flow:
1. **Appwrite Account:** Create user via `account.create()`.
2. **Session:** Log in via `account.createEmailPasswordSession()`.
3. **Profile Creation:** Immediately create a document in the `profiles` collection:
   - `userId`: Use `$id` from the account.
   - `program`: (e.g., G-NURSING, MIDWIFERY).
   - `yearOfStudy`: (e.g., YEAR 1, YEAR 2).
   - `fullName`: Display name.

---

## 3. Library & Content Discovery
To ensure students only see relevant material, all queries to the `content` collection **must** be filtered by the student's profile settings.

### Query Logic:
```javascript
// Example Appwrite Query for Content
const queries = [
    Query.equal('program', studentProfile.program),
    Query.equal('yearOfStudy', studentProfile.yearOfStudy),
    Query.orderDesc('$createdAt')
];

// If searching
if (searchText) queries.push(Query.search('title', searchText));

const content = await databases.listDocuments(DB_ID, CONTENT_COL_ID, queries);
```

### Media Handling:
- **PDFs:** Use the `storageFileId` to generate a preview/download URL using `storage.getFileView()`.
- **Audio:** Stream directly from the storage URL.
- **Videos:** If hosted on Appwrite, stream or use the file URL.

---

## 4. Subscription Management (Access Codes)
The dashboard uses an **Access Code** system for monetization. Students "unlock" the app by entering a unique code.

### Code Redemption Flow:
1. **Input:** Student enters code (e.g., `NLC-AB12XY`).
2. **Verification:** Query `accessCodes` where `code` matches AND `isUsed` is `false`.
3. **Transaction (Atomic):**
   - Update `accessCodes` document: `isUsed = true`, `usedByUserId = currentUserId`.
   - Update/Create `subscriptions` document:
     - `status = "ACTIVE"`
     - `expiryDate = currentTime + (durationDays * 24 * 60 * 60 * 1000)`
4. **App Access:** The app should check the `subscriptions` document on every launch. If `status !== "ACTIVE"`, redirect to the "Redeem Code" screen.

---

## 5. Security & Device Binding
The Admin Dashboard includes a **"Reset Device"** feature. To support this:
- **Device ID:** On the first login, store the student's `deviceId` in their `profiles` document.
- **Verification:** On every subsequent login/refresh, compare the current device ID with the one in the database.
- **Lockout:** If they don't match, prevent access and show a message: *"Contact Admin to reset your device link."*

---

## 6. Offline Data Protocol
For offline learning, the app should:
- **Cache Content:** Download files to the device's local storage.
- **Expiry Logic:** Even if offline, the app must store the `expiryDate` locally and deny access to files if the current local time exceeds the expiry date.
- **Re-Sync:** Attempt a background sync with the `subscriptions` collection whenever internet is available.

---

## 7. API Consistency
Always ensure that the `program` and `yearOfStudy` strings match the dashboard constants:
- **Programs:** `G-NURSING`, `MIDWIFERY`, `PUBLIC-HEALTH`, `METAL-HEALTH`.
- **Years:** `YEAR1`, `YEAR2`, `YEAR3`. (Convert to lowercase/consistent format as done in the dashboard API).

---
**NLC Mobile Integration Documentation** | Last Updated: January 2026
