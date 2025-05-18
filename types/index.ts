// User roles
export type UserRole = 'inspector' | 'supervisor';

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Coach inspection status
export type InspectionStatus = 'pending' | 'in-progress' | 'completed' | 'canceled';

// Coach details
export interface Coach {
  id: string;
  number: string;
  type: string;
  division: string;
  lastInspection?: string;
  nextScheduledInspection?: string;
  image?: string;
}

// Schedule item
export interface Schedule {
  id: string;
  coach: Coach;
  assignedTo: User;
  supervisedBy?: User;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  inspectionType: 'gear' | 'interior' | 'exterior' | 'comprehensive';
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'schedule' | 'assignment' | 'reminder' | 'system';
  relatedId?: string;
}

// Environment variables type
export interface Env {
  EXPO_PUBLIC_API_URL: string;
}