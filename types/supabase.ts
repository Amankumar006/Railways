/**
 * This is a temporary type definition file for Supabase.
 * To generate proper types, replace "your-project-id" in the package.json 
 * generate:types script with your actual Supabase project ID and run:
 * npm run generate:types
 * or
 * yarn generate:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'inspector' | 'supervisor'
          department: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'inspector' | 'supervisor'
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'inspector' | 'supervisor'
          department?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaches: {
        Row: {
          id: string
          number: string
          type: string
          division: string
          last_inspection: string | null
          next_scheduled_inspection: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: string
          type: string
          division: string
          last_inspection?: string | null
          next_scheduled_inspection?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: string
          type?: string
          division?: string
          last_inspection?: string | null
          next_scheduled_inspection?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          coach_id: string
          assigned_to_id: string
          supervised_by_id: string | null
          status: 'pending' | 'in-progress' | 'completed' | 'canceled'
          scheduled_date: string
          completed_date: string | null
          notes: string | null
          location: string
          priority: 'low' | 'medium' | 'high'
          inspection_type: 'gear' | 'interior' | 'exterior' | 'comprehensive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          assigned_to_id: string
          supervised_by_id?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'canceled'
          scheduled_date: string
          completed_date?: string | null
          notes?: string | null
          location: string
          priority?: 'low' | 'medium' | 'high'
          inspection_type: 'gear' | 'interior' | 'exterior' | 'comprehensive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          assigned_to_id?: string
          supervised_by_id?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'canceled'
          scheduled_date?: string
          completed_date?: string | null
          notes?: string | null
          location?: string
          priority?: 'low' | 'medium' | 'high'
          inspection_type?: 'gear' | 'interior' | 'exterior' | 'comprehensive'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          related_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'inspector' | 'supervisor'
      inspection_status: 'pending' | 'in-progress' | 'completed' | 'canceled'
      inspection_type: 'gear' | 'interior' | 'exterior' | 'comprehensive'
      priority_level: 'low' | 'medium' | 'high'
    }
  }
}