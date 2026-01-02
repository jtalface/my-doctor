/**
 * Auth Module - Barrel Export
 */

export * from './authService';
export { AuthProvider, useAuth, useUser } from './AuthContext';
export type { User, PatientProfile } from './AuthContext';
export { ProtectedRoute } from './ProtectedRoute';
