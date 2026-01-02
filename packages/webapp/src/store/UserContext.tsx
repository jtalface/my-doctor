/**
 * UserContext
 * 
 * @deprecated Use the new auth module instead: import { useAuth } from '../auth'
 * 
 * This file re-exports from the new auth module for backward compatibility.
 */

// Re-export from auth module
export { AuthProvider as UserProvider, useAuth as useUser, useAuth } from '../auth/AuthContext';
export type { User, PatientProfile } from '../auth/AuthContext';
