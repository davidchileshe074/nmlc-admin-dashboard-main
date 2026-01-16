# Appwrite Setup Checklist for Nurse Learning Corner Admin Dashboard

Follow these steps to configure your Appwrite project for the Admin Dashboard.

### 1. Project Creation
- **Endpoint**: https://fra.cloud.appwrite.io/v1
- **Project ID**: `691d352300367a9ca3ac`

### 2. API Key
- Go to **Overview > API Keys**.
- Create a new Key named `AdminDashboardKey`.
- Grant the following scopes:
  - `sessions.write`
  - `users.read`
  - `users.write`
  - `databases.read`
  - `databases.write`
  - `collections.read`
  - `collections.write`
  - `documents.read`
  - `documents.write`
  - `files.read`
  - `files.write`

### 3. Database & Collections
Create a database (get the ID and put it in `.env.local` as `APPWRITE_DATABASE_ID`).
Create the following collections with these attributes:

#### `profiles`
- `userId` (string, required, unique)
- `fullName` (string, required)
- `email` (string, required)
- `whatsappNumber` (string, required)
- `yearOfStudy` (string, required): Enum `YEAR_1`, `YEAR_2`, `YEAR_3`
- `program` (string, required): Enum `RN`, `MIDWIFERY`, `PUBLIC_HEALTH`, `MENTAL_HEALTH`, `ONCOLOGY`, `PAEDIATRIC`
- `verified` (boolean, default false)
- `adminApproved` (boolean, default true)
- `deviceId` (string, nullable)
- `createdAt` (datetime, required)
- **Indexes**: `userId` (unique), `yearOfStudy` (key), `program` (key), `createdAt` (key)

#### `subscriptions`
- `userId` (string, required, unique)
- `status` (string, required): Enum `ACTIVE`, `EXPIRED`
- `startDate` (datetime, required)
- `endDate` (datetime, required)
- `updatedAt` (datetime, required)
- **Indexes**: `userId` (unique), `status` (key), `endDate` (key)

#### `content`
- `title` (string, required)
- `description` (string, nullable)
- `type` (string, required): Enum `PDF`, `AUDIO`, `PAST_PAPER`, `MARKING_KEY`
- `yearOfStudy` (string, required)
- `program` (string, required)
- `subject` (string, nullable) - **NEW: Course/Subject name**
- `storageFileId` (string, required)
- `durationSeconds` (integer, nullable)
- `createdAt` (datetime, required)
- **Indexes**: `title` (fulltext/key), `type` (key), `yearOfStudy` (key), `program` (key)

#### `accessCodes`
- `code` (string, required, unique)
- `durationDays` (integer, required)
- `isUsed` (boolean, default false)
- `usedByUserId` (string, nullable)
- `usedAt` (datetime, nullable)
- `createdAt` (datetime, required)
- **Indexes**: `code` (unique), `isUsed` (key)

#### `admins`
- `userId` (string, required, unique)
- `email` (string, nullable)
- `createdAt` (datetime, required)
- **Indexes**: `userId` (unique)
- **Initial Setup**: Manually add your own Appwrite User ID to this collection to gain access.

#### `notifications`
- `type` (string, required): Enum `info`, `warning`, `success`
- `title` (string, required)
- `message` (string, required)
- `targetUrl` (string, nullable) - URL to navigate when clicked
- `read` (boolean, default false)
- `readAt` (datetime, nullable)
- `createdAt` (datetime, required)
- **Indexes**: `type` (key), `read` (key), `createdAt` (key)

### 4. Storage Bucket
- Create a bucket for content (get the ID and put it in `.env.local` as `APPWRITE_BUCKET_ID`).
- Set permissions to `role:all` (Read) if content is public, or strictly manage via server routes.
- **Allowed Extensions**: `pdf`, `mp3`, `wav`, `zip`, `doc`.

### 5. Permissions (CRITICAL)
For all collections, set technical permissions as:
- **Admin Role**: Grant full CRUD to the API key created in Step 2.
- **Client Access**: The dashboard uses server routes (`/api/*`) for most operations, so you don't need to expose collection permissions to `role:all` in the Appwrite Console.
