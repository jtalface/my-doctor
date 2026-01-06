# Audio Call Feature

This document describes the WebRTC audio call feature for real-time communication between patients and healthcare providers in the MyDoctor application.

## Overview

The audio call feature enables real-time voice communication using WebRTC peer-to-peer connections. The system:

- Allows patients and doctors to initiate audio calls within conversations
- Uses HTTP polling for signaling (no WebSocket server required)
- Provides fallback to phone number if WebRTC fails
- Tracks call status, duration, and history
- Shows incoming call notifications app-wide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBAPP-BACKEND / DOCTOR-BACKEND              │
├─────────────────────────────────────────────────────────────────┤
│  models/                                                         │
│  └── call.model.ts          (Call state + signaling data)       │
│                                                                  │
│  api/                                                            │
│  └── call.routes.ts         (Signaling REST endpoints)          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Signaling Flow (via HTTP polling)                          │ │
│  │                                                             │ │
│  │  Caller                    Server                  Callee   │ │
│  │    │                         │                        │     │ │
│  │    ├── POST /initiate ──────►│                        │     │ │
│  │    ├── POST /offer ─────────►│                        │     │ │
│  │    │                         │◄── GET /incoming ──────┤     │ │
│  │    │                         │◄── POST /answer ───────┤     │ │
│  │    │◄── GET /:id (poll) ─────│                        │     │ │
│  │    │       (ICE candidates exchanged via polling)     │     │ │
│  │    │◄────────────────────────┼────────────────────────►│     │ │
│  └────┴─────────────────────────┴────────────────────────┴────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WEBAPP / DOCTOR-UI                           │
├─────────────────────────────────────────────────────────────────┤
│  services/                                                       │
│  ├── webrtc.ts              (WebRTCCall class + polling)        │
│  └── api.ts                 (Call API client methods)           │
│                                                                  │
│  contexts/                                                       │
│  └── CallContext.tsx        (App-level incoming call handling)  │
│                                                                  │
│  components/                                                     │
│  ├── CallModal/             (Active call UI with controls)      │
│  └── IncomingCall/          (Incoming call notification)        │
│                                                                  │
│  components/messaging/                                           │
│  └── ChatWindow.tsx         (Call button in conversation)       │
│                                                                  │
│  pages/                                                          │
│  └── ConversationPage.tsx   (Doctor: call button in header)     │
└─────────────────────────────────────────────────────────────────┘
```

## WebRTC Flow

### Call Initiation (Caller)

```
1. User clicks "Call" button
2. Request microphone permission
3. POST /calls/initiate → creates call record (status: pending)
4. Create RTCPeerConnection with STUN servers
5. Add local audio track
6. Create SDP offer
7. POST /calls/:id/offer → store offer on server
8. Start polling GET /calls/:id for answer
```

### Call Reception (Callee)

```
1. CallContext polls GET /calls/incoming every 3 seconds
2. Incoming call detected → show IncomingCall notification
3. User clicks "Accept"
4. Request microphone permission
5. Fetch call status to get SDP offer (poll if not ready)
6. Create RTCPeerConnection with STUN servers
7. Set remote description (offer)
8. Add local audio track
9. Create SDP answer
10. POST /calls/:id/answer → store answer on server
11. Start polling for ICE candidates
```

### ICE Candidate Exchange

```
Both parties:
1. onicecandidate event → POST /calls/:id/ice
2. Poll GET /calls/:id → receive other party's candidates
3. Add candidates to peer connection
4. Connection established when ICE completes
```

## Data Model

### Call (MongoDB Schema)

```typescript
interface ICall {
  conversationId: ObjectId;    // Parent conversation
  callerId: ObjectId;          // Who initiated
  callerType: 'patient' | 'provider';
  calleeId: ObjectId;          // Who receives
  calleeType: 'patient' | 'provider';
  
  status: 'pending' | 'ringing' | 'active' | 'ended' | 'missed' | 'declined' | 'failed';
  endReason?: 'completed' | 'missed' | 'declined' | 'busy' | 'failed' | 'cancelled';
  
  // WebRTC Signaling
  offer?: { sdp: string; type: string };
  answer?: { sdp: string; type: string };
  iceCandidates: Array<{
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
    from: 'caller' | 'callee';
  }>;
  
  // Timing
  initiatedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;           // Seconds
  
  // Fallback tracking
  fallbackUsed: boolean;
}
```

### Call States

| Status | Description |
|--------|-------------|
| `pending` | Call created, waiting for callee to see it |
| `ringing` | Callee has seen the incoming call |
| `active` | WebRTC connection established |
| `ended` | Call completed normally |
| `missed` | Callee never answered (timeout) |
| `declined` | Callee explicitly declined |
| `failed` | Technical failure |

## API Endpoints

All endpoints require authentication.

### Initiate Call

```http
POST /api/calls/initiate

Body: {
  "conversationId": "64a..."
}

Response: {
  "callId": "64b...",
  "status": "pending"
}
```

### Check for Incoming Calls

```http
GET /api/calls/incoming

Response: {
  "hasIncomingCall": true,
  "call": {
    "callId": "64b...",
    "conversationId": "64a...",
    "callerName": "Dr. Smith",
    "callerPhone": "+258841234567",
    "callerType": "provider",
    "status": "ringing",
    "initiatedAt": "2024-01-15T10:30:00Z",
    "offer": { "sdp": "...", "type": "offer" }
  }
}
```

### Get Call Status (with ICE candidates)

```http
GET /api/calls/:id?lastIceIndex=5

Response: {
  "callId": "64b...",
  "status": "active",
  "offer": { ... },
  "answer": { ... },
  "iceCandidates": [...],      // Only NEW candidates since lastIceIndex
  "iceIndex": 8,               // Total candidates, for next request
  "duration": 45
}
```

### Send Offer (Caller)

```http
POST /api/calls/:id/offer

Body: {
  "offer": { "sdp": "...", "type": "offer" }
}
```

### Send Answer (Callee)

```http
POST /api/calls/:id/answer

Body: {
  "answer": { "sdp": "...", "type": "answer" }
}
```

### Send ICE Candidate

```http
POST /api/calls/:id/ice

Body: {
  "candidate": "...",
  "sdpMid": "0",
  "sdpMLineIndex": 0
}
```

### Decline Call

```http
POST /api/calls/:id/decline
```

### End Call

```http
POST /api/calls/:id/end

Body: {
  "reason": "completed"  // or "cancelled", "failed"
}

Response: {
  "success": true,
  "duration": 120
}
```

### Mark Fallback Used

```http
POST /api/calls/:id/fallback
```

## Frontend Components

### WebRTCCall Class (`services/webrtc.ts`)

Core WebRTC functionality:

```typescript
class WebRTCCall {
  // Initiate outgoing call
  async initiateCall(conversationId: string): Promise<void>
  
  // Answer incoming call
  async answerCall(callInfo: IncomingCallInfo): Promise<void>
  
  // End the call
  async endCall(reason?: string): Promise<void>
  
  // Decline incoming call
  async declineCall(): Promise<void>
  
  // Toggle microphone mute
  toggleMute(): boolean
  
  // Use phone fallback
  async useFallback(): Promise<void>
  
  // Get current state
  getState(): CallState
}

type CallState = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'active' | 'ended' | 'failed';
```

### CallContext (`contexts/CallContext.tsx`)

App-level provider for incoming call handling:

- Polls for incoming calls every 3 seconds when authenticated
- Shows IncomingCall notification overlay
- Manages accept/decline actions
- Displays CallModal for active calls

### CallModal

Full-screen modal during active call:

- Shows remote party name and avatar
- Call duration timer
- Mute/unmute button
- Speaker toggle (where supported)
- End call button
- Fallback option when connection fails

### IncomingCall

Notification overlay for incoming calls:

- Animated ringing effect
- Caller name and type
- Accept/Decline buttons

## STUN Servers

Free Google STUN servers for NAT traversal:

```typescript
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];
```

> **Note:** For production, consider adding TURN servers for networks with restrictive firewalls.

## Fallback Mechanism

If WebRTC connection fails:

1. Error is detected (ICE failed, connection timeout)
2. CallModal shows "Having trouble connecting?"
3. User can click to call phone number directly
4. System tracks that fallback was used (for analytics)

## Connection Timeouts

- **Caller (ringing):** 30 seconds to receive answer
- **Callee (connecting):** 60 seconds to establish connection
- **Polling for offer:** 5 seconds (10 attempts × 500ms)

## Translations

Call-related UI strings are available in 4 languages:

| Key | EN | PT |
|-----|----|----|
| `call_starting` | Starting call... | A iniciar chamada... |
| `call_incoming_audio` | Incoming audio call | Chamada de áudio recebida |
| `call_accept` | Accept | Aceitar |
| `call_decline` | Decline | Recusar |
| `call_end` | End call | Terminar chamada |
| `call_mute` | Mute | Silenciar |
| `call_connecting` | Connecting... | A ligar... |
| `call_fallback_message` | Connection failed. Try calling directly. | Falha na ligação. Tente ligar diretamente. |

## Security

- All call endpoints require JWT authentication
- Only conversation participants can initiate/answer calls
- Call records are scoped to conversation
- Rate limiting on auth endpoints
- No call recording (privacy by default)

## Testing

To test the feature:

1. **Setup:** Ensure both `webapp` and `doctor-ui` are running
2. **Login:** Log in as patient in webapp (port 3000), doctor in doctor-ui (port 3005)
3. **Open conversation:** Both parties open the same conversation
4. **Initiate call:** Click the 📞 button
5. **Accept:** Other party should see incoming call notification
6. **Verify audio:** Speak and verify audio is received
7. **End call:** Click "End" button

### Browser Requirements

- Chrome 56+ / Firefox 44+ / Safari 11+ / Edge 79+
- Microphone permission required
- HTTPS required in production (localhost exempt)

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No incoming call shown | Polling not started | Check CallProvider is in component tree |
| "PeerConnection cannot create answer" | Offer not received | Wait for offer polling |
| "ICE connection failed" | NAT/firewall blocking | Try different network, consider TURN |
| 429 Too Many Requests | Rate limiter triggered | Restart backend to reset |

## Future Enhancements

- [ ] WebSocket signaling for faster call setup
- [ ] TURN server for restrictive networks
- [ ] Video call support
- [ ] Call recording (opt-in)
- [ ] Call history view
- [ ] Push notifications for incoming calls
- [ ] Call quality metrics
- [ ] Group calls
- [ ] Screen sharing
- [ ] In-call messaging

