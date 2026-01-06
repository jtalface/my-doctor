/**
 * Models Index
 * 
 * Export all models used by doctor-backend.
 * Some models are shared with webapp-backend (same MongoDB collections).
 */

// Doctor-specific models
export { Provider } from './provider.model.js';
export type { IProvider } from './provider.model.js';

export { DoctorRefreshToken } from './doctor-refresh-token.model.js';
export type { IDoctorRefreshToken } from './doctor-refresh-token.model.js';

// Shared models (read from webapp-backend collections)
export { Conversation } from './conversation.model.js';
export type { IConversation } from './conversation.model.js';

export { Message } from './message.model.js';
export type { IMessage, IAttachment } from './message.model.js';

export { User } from './user.model.js';
export type { IUser } from './user.model.js';

export { PatientProfile } from './patient-profile.model.js';
export type { IPatientProfile } from './patient-profile.model.js';
