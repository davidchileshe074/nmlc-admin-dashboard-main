# Notification System Documentation

## Overview
The Nurse Learning Corner Admin Dashboard includes a comprehensive real-time notification system that keeps administrators informed about important events and actions.

## Features

### ✅ Implemented Features

1. **Real-time Notifications**
   - Automatic polling every 30 seconds for new notifications
   - Instant updates without page refresh
   - Unread count badge on notification bell icon

2. **Notification Filtering**
   - Filter by type: All, Info, Warning, Success
   - Visual color coding for each type
   - Easy-to-use filter tabs

3. **Mark as Read**
   - Click individual notifications to mark as read
   - "Mark all as read" button for bulk actions
   - Visual indicators for unread notifications

4. **Click-to-Navigate**
   - Notifications can include target URLs
   - Click notification to navigate to relevant page
   - Automatic mark as read on click

5. **Backend API**
   - RESTful API for CRUD operations
   - Filtering and querying support
   - Secure admin-only access

## Database Schema

### Notifications Collection

Create this collection in your Appwrite database:

```
Collection Name: notifications

Attributes:
- type (string, required) - Enum: 'info', 'warning', 'success'
- title (string, required) - Notification title
- message (string, required) - Notification message
- targetUrl (string, nullable) - URL to navigate when clicked
- read (boolean, default: false) - Read status
- readAt (datetime, nullable) - When notification was read
- createdAt (datetime, required) - Creation timestamp

Indexes:
- type (key)
- read (key)
- createdAt (key, desc)
```

## API Endpoints

### GET /api/admin/notifications
Fetch notifications with optional filtering

**Query Parameters:**
- `type` - Filter by type ('all', 'info', 'warning', 'success')
- `unreadOnly` - Show only unread notifications ('true'/'false')

**Response:**
```json
{
  "documents": [
    {
      "$id": "...",
      "type": "info",
      "title": "New Student Registration",
      "message": "5 new students registered today",
      "targetUrl": "/dashboard/students",
      "read": false,
      "$createdAt": "2026-01-16T18:00:00.000Z"
    }
  ],
  "total": 10
}
```

### POST /api/admin/notifications
Create a new notification

**Request Body:**
```json
{
  "type": "success",
  "title": "Content Uploaded",
  "message": "New content added to RN Year 2",
  "targetUrl": "/dashboard/content"
}
```

### PATCH /api/admin/notifications
Mark a notification as read

**Request Body:**
```json
{
  "notificationId": "...",
  "read": true
}
```

### POST /api/admin/notifications/mark-all-read
Mark all notifications as read

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

## Usage Examples

### Creating Notifications Programmatically

```typescript
import { createNotification, NotificationTemplates } from '@/server/notifications';

// Using a template
await createNotification(
  NotificationTemplates.newStudentRegistration('John Doe', 1)
);

// Custom notification
await createNotification({
  type: 'warning',
  title: 'Low Storage',
  message: 'Storage is 85% full',
  targetUrl: '/dashboard/settings'
});
```

### Available Templates

```typescript
// Student registration
NotificationTemplates.newStudentRegistration(studentName, count)

// Subscription expiring
NotificationTemplates.subscriptionExpiring(count, days)

// Subscription expired
NotificationTemplates.subscriptionExpired(studentName)

// Content uploaded
NotificationTemplates.contentUploaded(title, program, year)

// Access code generated
NotificationTemplates.accessCodeGenerated(studentName)

// Access code redeemed
NotificationTemplates.accessCodeRedeemed(studentName, code)

// Student approval pending
NotificationTemplates.studentApprovalPending(count)

// Low storage space
NotificationTemplates.lowStorageSpace(percentUsed)
```

## Integration Guide

### Adding Notifications to Your API Routes

1. Import the notification utilities:
```typescript
import { createNotification, NotificationTemplates } from '@/server/notifications';
```

2. Create notification after successful operation:
```typescript
try {
  // Your operation here
  await someOperation();
  
  // Create notification
  await createNotification(
    NotificationTemplates.yourTemplate(params)
  );
} catch (error) {
  // Handle error
}
```

### Example: Content Upload Notification

```typescript
// In /api/admin/content/route.ts
import { createNotification, NotificationTemplates } from '@/server/notifications';

export async function POST(request: Request) {
  try {
    // ... upload logic ...
    
    // Create notification
    await createNotification(
      NotificationTemplates.contentUploaded(
        title,
        program,
        yearOfStudy
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // ...
  }
}
```

## UI Components

### Header Component
The notification center is integrated into the Header component:

**Features:**
- Bell icon with unread count badge
- Dropdown panel with notifications list
- Filter tabs (All, Info, Warning, Success)
- Mark all as read button
- Click to navigate functionality
- Auto-refresh every 30 seconds

### Notification Display
Each notification shows:
- Color-coded icon (blue=info, amber=warning, green=success)
- Title and message
- Timestamp (e.g., "5m ago", "2h ago")
- Unread indicator (blue dot)
- Hover effects

## Best Practices

1. **Don't Fail on Notification Errors**
   ```typescript
   try {
     await createNotification(...);
   } catch (notifError) {
     console.error('Failed to create notification:', notifError);
     // Don't fail the main operation
   }
   ```

2. **Use Templates for Consistency**
   - Prefer predefined templates over custom notifications
   - Add new templates to `NotificationTemplates` for reusability

3. **Include Target URLs**
   - Always provide a `targetUrl` when possible
   - Helps users navigate to relevant context

4. **Appropriate Notification Types**
   - `info` - General information, new events
   - `warning` - Important alerts, expiring items
   - `success` - Successful operations, completions

5. **Meaningful Messages**
   - Keep titles short and descriptive
   - Include relevant details in message
   - Use proper grammar and formatting

## Future Enhancements

Potential improvements:
- [ ] Email notifications for critical events
- [ ] Push notifications (browser/mobile)
- [ ] Notification preferences per admin
- [ ] Notification history/archive
- [ ] Notification categories/grouping
- [ ] Sound alerts for new notifications
- [ ] Desktop notifications API
- [ ] Notification scheduling

## Troubleshooting

### Notifications Not Appearing
1. Check Appwrite collection exists and has correct schema
2. Verify `COL_NOTIFICATIONS` in `.env.local`
3. Check browser console for API errors
4. Ensure admin permissions are set correctly

### Unread Count Not Updating
1. Check if polling is working (30s interval)
2. Verify PATCH endpoint is working
3. Check network tab for failed requests

### Notifications Not Creating
1. Verify import path: `@/server/notifications`
2. Check Appwrite API key permissions
3. Review server logs for errors
4. Ensure required fields are provided

## Support

For issues or questions:
1. Check this documentation
2. Review `APPWRITE_SETUP.md` for schema
3. Check server logs for errors
4. Verify API endpoints are working
