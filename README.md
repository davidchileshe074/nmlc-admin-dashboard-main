# Nurse Learning Corner (NLC) Admin Dashboard

A premium, high-performance administration dashboard for the Nurse Learning Corner platform. Built with **Next.js 15**, **TypeScript**, and **Appwrite Cloud**.

## 🚀 Performance Optimizations Implemented
To ensure a snappy user experience, the following optimizations have been applied:
- **Server-Side Caching:** Dashboard statistics are cached on the server for 60 seconds to reduce Appwrite API overhead.
- **Parallel Data Fetching:** All primary metrics and recent activities are fetched concurrently using `Promise.all`.
- **Query Optimization:** Database queries use `Query.select([])` when only counts are needed, significantly reducing data transfer and latency.
- **Background Session Sync:** Implemented a silent `AuthCheck` component that refreshes JWTs in the background to prevent session expiration logouts.

## ✨ Key Features
- **Real-time Overview:** Live metrics for students, subscriptions, and content library.
- **Dynamic Trend Charts:** Visual representation of student registrations over the last 7 days.
- **Library Management:** Complete CRUD operations for educational materials (PDFs, Audio, Past Papers).
- **Student Directory:** Searchable database of all registered students with subscription status tracking.
- **Access Code System:** Manage and track platform enrollment codes.
- **Role-Based Security:** 
  - Strict Admin-only access enforced at both API and UI levels.
  - Granular access control (e.g., Settings visible only to the Root Administrator).

## 🛠️ Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Backend-as-a-Service:** Appwrite Cloud (Auth, Database, Storage)
- **Styling:** Tailwind CSS 4.0
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** Sonner

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- An Appwrite Cloud account

### 2. Environment Variables
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_db_id
APPWRITE_API_KEY=your_secret_api_key
# Collection IDs
COL_ADMINS=admins
COL_PROFILES=profiles
COL_CONTENT=content
COL_SUBSCRIPTIONS=subscriptions
COL_ACCESS_CODES=accessCodes
```

### 3. Installation
```bash
npm install
npm run dev
```

## 🔒 Security Policy
This dashboard enforces a multi-layered security model:
1. **Appwrite Session:** Standard browser-based auth.
2. **Server-Side JWT:** Short-lived tokens for secure API communication.
3. **Database Guard:** Every request verifies the user's presence in the `admins` collection.

---
Developed for **Nurse Learning Corner** © 2026.
