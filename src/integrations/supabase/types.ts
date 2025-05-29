export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_licenses: {
        Row: {
          aantal_cilinders: number | null
          aantal_zitplaatsen: number | null
          added_at: string
          added_by: string | null
          apk_vervaldatum: string | null
          catalogusprijs: string | null
          cilinderinhoud: number | null
          datum_eerste_toelating: string | null
          datum_tenaamstelling: string | null
          eerste_kleur: string | null
          geluidsniveau_rijdend: number | null
          geluidsniveau_stationair: number | null
          geschorst: string | null
          handelsbenaming: string | null
          handelsbenaming_uitgebreid: string | null
          id: string
          inrichting: string | null
          kenteken: string
          massa_ledig_voertuig: number | null
          massa_rijklaar: number | null
          maximum_massa_trekken_geremd: number | null
          maximum_massa_trekken_ongeremd: number | null
          merk: string | null
          milieuklasse_eg_goedkeuring_licht: string | null
          toegestane_maximum_massa_voertuig: number | null
          tweede_kleur: string | null
          uitstoot_co2_gecombineerd: number | null
          vermogen_massaverhouding: number | null
          voertuigsoort: string | null
          wam_verzekerd: string | null
        }
        Insert: {
          aantal_cilinders?: number | null
          aantal_zitplaatsen?: number | null
          added_at?: string
          added_by?: string | null
          apk_vervaldatum?: string | null
          catalogusprijs?: string | null
          cilinderinhoud?: number | null
          datum_eerste_toelating?: string | null
          datum_tenaamstelling?: string | null
          eerste_kleur?: string | null
          geluidsniveau_rijdend?: number | null
          geluidsniveau_stationair?: number | null
          geschorst?: string | null
          handelsbenaming?: string | null
          handelsbenaming_uitgebreid?: string | null
          id?: string
          inrichting?: string | null
          kenteken: string
          massa_ledig_voertuig?: number | null
          massa_rijklaar?: number | null
          maximum_massa_trekken_geremd?: number | null
          maximum_massa_trekken_ongeremd?: number | null
          merk?: string | null
          milieuklasse_eg_goedkeuring_licht?: string | null
          toegestane_maximum_massa_voertuig?: number | null
          tweede_kleur?: string | null
          uitstoot_co2_gecombineerd?: number | null
          vermogen_massaverhouding?: number | null
          voertuigsoort?: string | null
          wam_verzekerd?: string | null
        }
        Update: {
          aantal_cilinders?: number | null
          aantal_zitplaatsen?: number | null
          added_at?: string
          added_by?: string | null
          apk_vervaldatum?: string | null
          catalogusprijs?: string | null
          cilinderinhoud?: number | null
          datum_eerste_toelating?: string | null
          datum_tenaamstelling?: string | null
          eerste_kleur?: string | null
          geluidsniveau_rijdend?: number | null
          geluidsniveau_stationair?: number | null
          geschorst?: string | null
          handelsbenaming?: string | null
          handelsbenaming_uitgebreid?: string | null
          id?: string
          inrichting?: string | null
          kenteken?: string
          massa_ledig_voertuig?: number | null
          massa_rijklaar?: number | null
          maximum_massa_trekken_geremd?: number | null
          maximum_massa_trekken_ongeremd?: number | null
          merk?: string | null
          milieuklasse_eg_goedkeuring_licht?: string | null
          toegestane_maximum_massa_voertuig?: number | null
          tweede_kleur?: string | null
          uitstoot_co2_gecombineerd?: number | null
          vermogen_massaverhouding?: number | null
          voertuigsoort?: string | null
          wam_verzekerd?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
