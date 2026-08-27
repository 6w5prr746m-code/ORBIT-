/**
 * Hand-written types mirroring supabase/migrations/0001_schema.sql.
 * (No network access in this environment to run `supabase gen types` —
 * keep this in sync with the migration files by hand.)
 */

type SkillCategoryDb = 'Technology' | 'Business' | 'Language' | 'Design' | 'Operations' | 'Leadership'
type SkillLevelDb = 'familiar' | 'proficient' | 'expert'
type SkillSourceDb = 'self-reported' | 'inferred' | 'verified'
type ConnectionTypeDb = 'collaborates-with' | 'reports-to' | 'peer'
type SourceTypeDb =
  | 'core-hr'
  | 'microsoft-365'
  | 'google-workspace'
  | 'slack'
  | 'teams'
  | 'notion'
  | 'jira'
  | 'csv-import'
type SourceStatusDb = 'connected' | 'coming-soon' | 'syncing' | 'error'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          logo: string | null
          industry: string
          size: number
          is_demo: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['organizations']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['organizations']['Row']>
        Relationships: []
      }
      memberships: {
        Row: {
          user_id: string
          organization_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['memberships']['Row']> & {
          user_id: string
          organization_id: string
        }
        Update: Partial<Database['public']['Tables']['memberships']['Row']>
        Relationships: []
      }
      people: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          avatar: string | null
          job_title: string
          department: string
          location: string
          country: string
          bio: string
          manager_id: string | null
          start_date: string
          status: 'active' | 'inactive'
          email: string
          claimed_by_user_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['people']['Row']> & {
          organization_id: string
          first_name: string
          last_name: string
          job_title: string
          department: string
          location: string
          country: string
          email: string
        }
        Update: Partial<Database['public']['Tables']['people']['Row']>
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          organization_id: string
          name: string
          category: SkillCategoryDb
          description: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['skills']['Row']> & {
          organization_id: string
          name: string
          category: SkillCategoryDb
        }
        Update: Partial<Database['public']['Tables']['skills']['Row']>
        Relationships: []
      }
      person_skills: {
        Row: {
          organization_id: string
          person_id: string
          skill_id: string
          level: SkillLevelDb
          years_experience: number
          source: SkillSourceDb
        }
        Insert: Database['public']['Tables']['person_skills']['Row']
        Update: Partial<Database['public']['Tables']['person_skills']['Row']>
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string
          manager_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['teams']['Row']> & {
          organization_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['teams']['Row']>
        Relationships: []
      }
      person_teams: {
        Row: {
          organization_id: string
          person_id: string
          team_id: string
        }
        Insert: Database['public']['Tables']['person_teams']['Row']
        Update: Partial<Database['public']['Tables']['person_teams']['Row']>
        Relationships: []
      }
      connections: {
        Row: {
          id: string
          organization_id: string
          person_a_id: string
          person_b_id: string
          type: ConnectionTypeDb
          strength: number
          source: SkillSourceDb
        }
        Insert: Partial<Database['public']['Tables']['connections']['Row']> & {
          organization_id: string
          person_a_id: string
          person_b_id: string
          type: ConnectionTypeDb
          source: SkillSourceDb
        }
        Update: Partial<Database['public']['Tables']['connections']['Row']>
        Relationships: []
      }
      sources: {
        Row: {
          id: string
          organization_id: string
          type: SourceTypeDb
          name: string
          last_sync_at: string | null
          status: SourceStatusDb
        }
        Insert: Partial<Database['public']['Tables']['sources']['Row']> & {
          organization_id: string
          type: SourceTypeDb
          name: string
          status: SourceStatusDb
        }
        Update: Partial<Database['public']['Tables']['sources']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_organization: {
        Args: { org_name: string; org_industry: string; org_size: number }
        Returns: string
      }
    }
  }
}
