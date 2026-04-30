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
      adopters: {
        Row: {
          address_line: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          first_name: string | null
          id: string
          id_passport_url: string | null
          last_name: string | null
          occupation: string | null
          phone_number: string | null
          postal_code: string | null
          profile_id: string
          province: string | null
          subdistrict: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_passport_url?: string | null
          last_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          postal_code?: string | null
          profile_id: string
          province?: string | null
          subdistrict?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["adopters"]["Insert"]>
        Relationships: []
      }
      adopter_preferences: {
        Row: {
          adopter_id: string
          created_at: string
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          good_with_kids: boolean | null
          notes: string | null
          preferred_energy_level: Database["public"]["Enums"]["dog_energy_level"] | null
          preferred_size: Database["public"]["Enums"]["dog_size"] | null
          updated_at: string
        }
        Insert: {
          adopter_id: string
          created_at?: string
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          notes?: string | null
          preferred_energy_level?: Database["public"]["Enums"]["dog_energy_level"] | null
          preferred_size?: Database["public"]["Enums"]["dog_size"] | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["adopter_preferences"]["Insert"]>
        Relationships: []
      }
      appointments: {
        Row: {
          adopter_id: string
          application_id: string | null
          appointment_date: string
          appointment_time: string
          created_at: string
          dog_id: string | null
          id: string
          shelter_id: string
          shelter_note: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          visitor_note: string | null
        }
        Insert: {
          adopter_id: string
          application_id?: string | null
          appointment_date: string
          appointment_time: string
          created_at?: string
          dog_id?: string | null
          id?: string
          shelter_id: string
          shelter_note?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          visitor_note?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>
        Relationships: []
      }
      dog_photos: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          is_cover: boolean
          public_url: string | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          is_cover?: boolean
          public_url?: string | null
          sort_order?: number
          storage_path: string
        }
        Update: Partial<Database["public"]["Tables"]["dog_photos"]["Insert"]>
        Relationships: []
      }
      dog_traits: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          trait_type: string
          trait_value: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          trait_type: string
          trait_value: string
        }
        Update: Partial<Database["public"]["Tables"]["dog_traits"]["Insert"]>
        Relationships: []
      }
      dogs: {
        Row: {
          adoption_status: Database["public"]["Enums"]["dog_adoption_status"]
          age_months: number | null
          animal_friendly: boolean | null
          background: string | null
          breed: string | null
          created_at: string
          dog_friendly: boolean | null
          energy_level: Database["public"]["Enums"]["dog_energy_level"] | null
          gender: Database["public"]["Enums"]["dog_gender"]
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          good_with_kids: boolean | null
          house_trained: boolean | null
          human_friendly: boolean | null
          id: string
          leash_trained: boolean | null
          name: string
          shelter_id: string
          size: Database["public"]["Enums"]["dog_size"] | null
          special_needs: string | null
          sterilized: boolean
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          adoption_status?: Database["public"]["Enums"]["dog_adoption_status"]
          age_months?: number | null
          animal_friendly?: boolean | null
          background?: string | null
          breed?: string | null
          created_at?: string
          dog_friendly?: boolean | null
          energy_level?: Database["public"]["Enums"]["dog_energy_level"] | null
          gender?: Database["public"]["Enums"]["dog_gender"]
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          house_trained?: boolean | null
          human_friendly?: boolean | null
          id?: string
          leash_trained?: boolean | null
          name: string
          shelter_id: string
          size?: Database["public"]["Enums"]["dog_size"] | null
          special_needs?: string | null
          sterilized?: boolean
          updated_at?: string
          weight_kg?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["dogs"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone_number: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      shelters: {
        Row: {
          address_line: string | null
          country: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          facebook_url: string | null
          hygiene_rating: number | null
          id: string
          instagram_url: string | null
          name: string
          phone_number: string | null
          postal_code: string | null
          professionalism_rating: number | null
          province: string | null
          shelter_size: number | null
          shelter_type: string | null
          subdistrict: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          facebook_url?: string | null
          hygiene_rating?: number | null
          id?: string
          instagram_url?: string | null
          name: string
          phone_number?: string | null
          postal_code?: string | null
          professionalism_rating?: number | null
          province?: string | null
          shelter_size?: number | null
          shelter_type?: string | null
          subdistrict?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["shelters"]["Insert"]>
        Relationships: []
      }
      wishlists: {
        Row: {
          adopter_id: string
          created_at: string
          dog_id: string
        }
        Insert: {
          adopter_id: string
          created_at?: string
          dog_id: string
        }
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      app_role: "adopter" | "shelter_admin" | "admin"
      dog_adoption_status: "draft" | "available" | "reserved" | "adopted" | "unavailable"
      dog_energy_level: "low" | "medium" | "high"
      dog_gender: "male" | "female" | "unknown"
      dog_size: "small" | "medium" | "large" | "extra_large"
      shelter_membership_role: "owner" | "staff" | "viewer"
      application_status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "withdrawn"
      appointment_status: "requested" | "confirmed" | "completed" | "cancelled" | "no_show"
      availability_type: "available" | "unavailable"
      application_document_type: "house_image" | "income_statement" | "id_copy" | "other"
      question_type: "short_text" | "long_text" | "single_choice" | "multiple_choice" | "boolean" | "number" | "date"
    }
    CompositeTypes: Record<never, never>
  }
}

export type Dog = Database["public"]["Tables"]["dogs"]["Row"]
export type DogPhoto = Database["public"]["Tables"]["dog_photos"]["Row"]
export type DogTrait = Database["public"]["Tables"]["dog_traits"]["Row"]
export type Shelter = Database["public"]["Tables"]["shelters"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Adopter = Database["public"]["Tables"]["adopters"]["Row"]
export type AdopterPreference = Database["public"]["Tables"]["adopter_preferences"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"]

export type DogWithCover = Dog & { cover_photo: string | null }

export type DogFilter = {
  gender?: Database["public"]["Enums"]["dog_gender"]
  size?: Database["public"]["Enums"]["dog_size"]
  energy_level?: Database["public"]["Enums"]["dog_energy_level"]
  sterilized?: boolean
  good_with_kids?: boolean
  good_with_dogs?: boolean
  good_with_cats?: boolean
}
