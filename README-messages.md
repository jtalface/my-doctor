# Patient-Doctor Messaging System

This document describes the messaging system that allows patients to communicate with healthcare providers.

## Overview

The messaging system supports:
- One-to-one conversations between patients and healthcare providers
- Separate conversations for the user themselves and each dependent
- File attachments (images, documents, PDFs)
- Read receipts and unread message counts
- Real-time polling for new messages

## Data Models

### Provider

Healthcare providers who can receive messages from patients.

```typescript
{
  name: string;
  email: string;
  specialty: string;        // e.g., "General Practice", "Pediatrics"
  title?: string;           // e.g., "Dr.", "Nurse"
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  isActive: boolean;
  isAvailable: boolean;
  lastActiveAt?: Date;      // Used to determine online status
  languages?: string[];
  workingHours?: {...};
}
```

### Conversation

A messaging thread between a patient and a provider.

```typescript
{
  patientId: ObjectId;      // The user who owns the conversation
  providerId: ObjectId;     // The healthcare provider
  dependentId?: ObjectId;   // Optional: if conversation is about a dependent
  
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageSenderType: 'patient' | 'provider';
  
  unreadByPatient: number;
  unreadByProvider: number;
  
  status: 'active' | 'archived' | 'closed';
  subject?: string;
}
```

#### Unique Constraint

Conversations have a unique index on `{ patientId, providerId, dependentId }`. This allows:

- **One conversation** between a user and a provider for themselves (no dependentId)
- **One conversation per dependent** between the same user and provider (with dependentId)

Example: A parent can have:
- A conversation with Dr. Smith about their own health
- A separate conversation with Dr. Smith about Child A
- A separate conversation with Dr. Smith about Child B

### Message

Individual messages within a conversation.

```typescript
{
  conversationId: ObjectId;
  senderType: 'patient' | 'provider';
  senderId: ObjectId;
  content: string;
  attachments: [{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }];
  readAt?: Date;
  deletedAt?: Date;         // Soft delete
}
```

## API Endpoints

All endpoints require authentication via the `authenticate` middleware.

### Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/providers` | List all active providers |
| GET | `/api/messages/providers/:providerId` | Get provider details |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | List user's conversations |
| POST | `/api/messages/conversations` | Create or get existing conversation |
| GET | `/api/messages/conversations/:id` | Get conversation details |
| PATCH | `/api/messages/conversations/:id` | Update conversation (archive, close) |
| POST | `/api/messages/conversations/:id/read` | Mark all messages as read |

#### Creating a Conversation

```typescript
POST /api/messages/conversations
{
  providerId: string;       // Required
  subject?: string;         // Optional subject line
  dependentId?: string;     // Optional: for dependent conversations
}
```

**Behavior:**
1. If a conversation already exists for this patient-provider-dependent combination, it returns the existing one
2. If the existing conversation was archived, it reactivates it
3. Otherwise, creates a new conversation

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations/:id/messages` | Get messages (paginated) |
| POST | `/api/messages/conversations/:id/messages` | Send a message |
| DELETE | `/api/messages/messages/:id` | Delete a message (soft delete) |

#### Sending a Message

```typescript
// Text only
POST /api/messages/conversations/:id/messages
Content-Type: application/json
{ "content": "Hello doctor" }

// With attachments
POST /api/messages/conversations/:id/messages
Content-Type: multipart/form-data
- content: "Here are the test results"
- attachments: [file1, file2, ...]
```

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/files/:filename` | Download attachment |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/stats` | Get unread counts |

## File Uploads

Attachments are stored in `uploads/messages/` with the following constraints:

- **Max file size:** 10MB
- **Max files per message:** 5
- **Allowed types:** Images (JPEG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX, TXT)

Files are named with a UUID prefix to prevent collisions.

## Frontend Components

### MessagesPage

Main page that displays:
- Conversation list (sidebar on desktop, full screen on mobile)
- Chat window with selected conversation
- New conversation modal

### ConversationList

Displays all conversations with:
- Provider avatar and name
- Last message preview
- Timestamp
- Unread badge
- Online/offline indicator

### ChatWindow

Displays messages in a conversation with:
- Provider header with online status
- Message bubbles (own messages on right, provider on left)
- File attachment previews
- Message input with file upload

### NewConversationModal

Modal for starting a new conversation:
- Provider list with search
- Subject field
- Creates conversation and navigates to it

## Query Logic for Conversations

When searching for an existing conversation:

```typescript
// With dependentId: find conversation for that specific dependent
{ patientId, providerId, dependentId: "abc123" }

// Without dependentId: find conversation for user themselves (not a dependent)
{ patientId, providerId, dependentId: { $in: [null, undefined] } }
```

This ensures that:
1. A user's own conversation doesn't match when looking for a dependent's conversation
2. A dependent's conversation doesn't match when looking for the user's own conversation

## Seeding Providers

To add sample providers to the database:

```bash
cd packages/webapp-backend
pnpm tsx src/scripts/seed-providers.ts
```

This creates sample healthcare providers for testing the messaging system.

