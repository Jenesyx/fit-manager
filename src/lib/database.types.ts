/**
 * Hand-maintained types mirroring supabase/migrations.
 * Regenerate from the live DB once it exists:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type UserRole = "kunde" | "trainer" | "admin";
export type CourseStatus = "regulaer" | "vertreten" | "abgesagt";

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: { id: string; name: string; city: string; created_at: string };
        Insert: { id?: string; name: string; city?: string; created_at?: string };
        Update: { id?: string; name?: string; city?: string; created_at?: string };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          location_id: string;
          name: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          name: string;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          name?: string;
          capacity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          role: UserRole;
          can_create_courses: boolean;
          home_location_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string | null;
          role?: UserRole;
          can_create_courses?: boolean;
          home_location_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          role?: UserRole;
          can_create_courses?: boolean;
          home_location_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          date: string;
          start_time: string;
          end_time: string;
          room_id: string | null;
          trainer_id: string | null;
          max_participants: number;
          status: CourseStatus;
          original_trainer_id: string | null;
          substitute_trainer_id: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          room_id?: string | null;
          trainer_id?: string | null;
          max_participants?: number;
          status?: CourseStatus;
          original_trainer_id?: string | null;
          substitute_trainer_id?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      sick_leaves: {
        Row: {
          id: string;
          trainer_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sick_leaves"]["Insert"]>;
        Relationships: [];
      };
      course_registrations: {
        Row: {
          id: string;
          course_id: string;
          kunde_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          kunde_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["course_registrations"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      can_manage_courses: { Args: Record<string, never>; Returns: boolean };
      handle_sick_leave: {
        Args: { p_trainer: string; p_start: string; p_end: string };
        Returns: undefined;
      };
      get_sick_leave_result: {
        Args: { p_trainer: string; p_start: string; p_end: string };
        Returns: {
          course_id: string;
          course_name: string;
          course_date: string;
          start_time: string;
          end_time: string;
          status: CourseStatus;
          substitute_name: string | null;
          cancel_reason: string | null;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      course_status: CourseStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
