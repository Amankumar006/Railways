/**
 * Types for the inspection data model
 * Extracted from trips/index.tsx to improve reusability
 */

export interface InspectionSection {
  id: string;
  section_number: string;
  name: string;
  description?: string;
  display_order: number;
  expanded: boolean;
  categories: InspectionCategory[];
}

export interface InspectionCategory {
  id: string;
  category_number: string;
  name: string;
  description?: string;
  applicable_coaches: string[];
  display_order: number;
  activities: InspectionActivity[];
}

export interface InspectionActivity {
  id: string;
  activity_number: string;
  activity_text: string;
  is_compulsory: boolean;
  display_order: number;
  checkStatus: 'pending' | 'checked-okay' | 'checked-not-okay';
  remarks: string;
}

export interface TripReport {
  id: string;
  inspector_id: string;
  train_number: string;
  train_name?: string;
  location: string;
  date: string;
  red_on_time?: string;
  red_off_time?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  approved_by?: string | null;
  rejected_by?: string | null;
  inspector?: {
    id: string;
    name: string;
    email: string;
  } | null;
  sections?: Array<{
    id: string;
    section_number: string;
    name: string;
    categories: Array<{
      id: string;
      category_number: string;
      name: string;
      activities: Array<{
        id: string;
        activity_number: string;
        activity_text: string;
        is_compulsory: boolean;
        check_status: 'pending' | 'checked-okay' | 'checked-not-okay';
        remarks?: string;
      }>;
    }>;
  }>;
  stats?: {
    total_activities: number;
    checked_okay: number;
    checked_not_okay: number;
    unchecked: number;
  };
}
