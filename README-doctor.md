# MyDoctor - Healthcare Provider Portal

## Overview

This document describes the **Doctor Application** architecture - a standalone application that allows healthcare providers (doctors) to:

1. **Authenticate** with their own credentials
2. **View and respond** to patient messages
3. **Access patient health profiles** (read-only)
4. **Manage their availability** and professional profile

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MyDoctor Platform                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │   Patient App    │              │   Doctor App     │            │
│  │   (webapp)       │              │   (doctor-ui)    │            │
│  │   Port: 3000     │              │   Port: 3005     │            │
│  └────────┬─────────┘              └────────┬─────────┘            │
│           │                                  │                      │
│  ┌────────▼─────────┐              ┌────────▼─────────┐            │
│  │ webapp-backend   │              │ doctor-backend   │            │
│  │   Port: 3003     │              │   Port: 3004     │            │
│  └────────┬─────────┘              └────────┬─────────┘            │
│           │                                  │                      │
│           └───────────────┬─────────────────┘                      │
│                           │                                         │
│                   ┌───────▼───────┐                                │
│                   │    MongoDB    │                                │
│                   │   (Shared)    │                                │
│                   └───────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Shared Database Design

Both applications connect to the **same MongoDB database**, sharing certain collections while maintaining security isolation.

### Shared Collections

| Collection | Owner | Doctor Access | Patient Access |
|------------|-------|---------------|----------------|
| `providers` | Doctor Backend | Read/Write | Read-only |
| `conversations` | Both | Read/Write | Read/Write |
| `messages` | Both | Read/Write | Read/Write |
| `users` | Patient Backend | Read-only | Read/Write |
| `patientprofiles` | Patient Backend | Read-only | Read/Write |

### Doctor-Specific Collections

| Collection | Purpose |
|------------|---------|
| `doctorrefreshtokens` | Auth sessions for doctors (separate from patient tokens) |

## Package Structure

```
packages/
├── doctor-backend/          # Express.js API server
│   ├── src/
│   │   ├── api/             # Route handlers
│   │   ├── auth/            # Authentication logic
│   │   ├── config/          # Configuration
│   │   ├── models/          # Mongoose models
│   │   ├── scripts/         # Seed scripts
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── doctor-ui/               # React + Vite frontend
│   ├── src/
│   │   ├── auth/            # Auth context & types
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── styles/          # Global CSS
│   └── package.json
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new doctor |
| POST | `/login` | Login with credentials |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (revoke token) |
| GET | `/me` | Get current doctor info |

### Profile (`/api/profile`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get full doctor profile |
| PATCH | `/` | Update profile details |
| POST | `/availability` | Update availability status |

### Conversations (`/api/conversations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List doctor's conversations |
| GET | `/:id` | Get conversation details |
| PATCH | `/:id` | Update conversation status |
| POST | `/:id/read` | Mark as read |

### Messages (`/api/messages`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/messages` | Send message |
| GET | `/files/:filename` | Download file attachment |

### Patients (`/api/patients`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List patients with conversations |
| GET | `/:id` | Get patient basic info |
| GET | `/:id/profile` | Get patient health profile |
| GET | `/:id/history` | Get conversation history |

## Provider Model

The `Provider` model was updated to include authentication fields:

```typescript
interface IProvider {
  // Basic info
  name: string;
  email: string;
  passwordHash?: string;       // For doctor authentication
  
  // Professional info
  specialty: string;
  title?: string;              // "Dr.", "Nurse", etc.
  licenseNumber?: string;
  
  // Profile
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  languages: string[];
  
  // Status
  isActive: boolean;           // Can receive conversations
  isAvailable: boolean;        // Currently online
  isVerified: boolean;         // Credentials verified
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  
  // Working hours
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
    daysOfWeek: number[];
  };
  
  // Preferences
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
  };
}
```

## Running the Application

### Prerequisites

- Node.js 18+
- MongoDB (same instance as webapp-backend)
- pnpm

### Environment Setup

Create `.env.local` in `packages/doctor-backend/`:

```env
# MongoDB (same URI as webapp-backend)
MONGODB_URI=mongodb://username:password@localhost:27017/mydoctor

# JWT (can use same secret for development)
JWT_SECRET=your-secure-jwt-secret

# Server
DOCTOR_PORT=3004
DOCTOR_CORS_ORIGIN=http://localhost:3005
```

### Development

```bash
# Install dependencies
pnpm install

# Seed test doctors (requires MongoDB connection)
cd packages/doctor-backend && pnpm seed

# Start doctor backend
cd packages/doctor-backend && pnpm dev

# Start doctor frontend (in another terminal)
cd packages/doctor-ui && pnpm dev
```

### Test Credentials

After running the seed script:

| Email | Password | Specialty |
|-------|----------|-----------|
| doctor@mydoctor.com | Doctor123! | General Medicine |
| pediatrician@mydoctor.com | Doctor123! | Pediatrics |

## Security Considerations

1. **Separate Token Stores**: Doctor and patient refresh tokens are stored in separate collections to prevent token reuse attacks.

2. **Read-Only Patient Access**: Doctors can view patient data but cannot modify it - this is enforced at the API level.

3. **Conversation Access Control**: Doctors can only access conversations where they are the provider.

4. **Password Security**: Passwords are hashed with bcrypt (12 rounds).

5. **Token Rotation**: Refresh tokens are single-use with rotation support.

## UI Features

### Dashboard
- Welcome message with doctor's name
- Unread message count
- Active patient count
- Recent conversations list
- Quick action shortcuts

### Messages
- Conversation list with filters (active/archived/closed)
- Chat interface with message history
- File attachments support
- Real-time polling for new messages

### Patients
- Searchable patient list
- Patient health profile viewer
- Conversation history per patient

### Profile
- Availability toggle
- Profile editing
- Working hours display

## Integration with Patient App

When a patient sends a message to a provider:

1. Patient app creates a `Conversation` with the `providerId`
2. Patient sends `Message` to the conversation
3. Conversation's `unreadByProvider` counter increments
4. Doctor's app polls for conversations and sees the new message
5. Doctor responds, incrementing `unreadByPatient`
6. Patient app polls and sees the response

Both apps share the same `conversations` and `messages` collections, enabling seamless communication.

## Future Enhancements

1. **Real-time Updates**: Replace polling with WebSocket/SSE
2. **Push Notifications**: Notify doctors of new messages
3. **Appointment Scheduling**: Add calendar integration
4. **Video Consultations**: Integrate telemedicine features
5. **Prescription Management**: Digital prescription creation
6. **Analytics Dashboard**: Practice insights and metrics

