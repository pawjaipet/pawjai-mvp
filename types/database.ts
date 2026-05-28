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
      ads: {
        Row: {
          id: string
          company_name: string
          contact_info: string | null
          image_url: string
          click_url: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_info?: string | null
          image_url: string
          click_url: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ads"]["Insert"]>
        Relationships: []
      }
      adopters: {
        Row: {
          address_line: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          email: string | null
          first_name: string | null
          government_id_number: string | null
          id: string
          id_passport_url: string | null
          last_name: string | null
          occupation: string | null
          phone_number: string | null
          postal_code: string | null
          profile_id: string
          province: string | null
          subdistrict: string | null
          verification_reviewed_at: string | null
          verification_status: Database["public"]["Enums"]["adopter_verification_status"]
          verification_submitted_at: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          email?: string | null
          first_name?: string | null
          government_id_number?: string | null
          id?: string
          id_passport_url?: string | null
          last_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          postal_code?: string | null
          profile_id: string
          province?: string | null
          subdistrict?: string | null
          verification_reviewed_at?: string | null
          verification_status?: Database["public"]["Enums"]["adopter_verification_status"]
          verification_submitted_at?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["adopters"]["Insert"]>
        Relationships: []
      }
      adopter_documents: {
        Row: {
          adopter_id: string
          bucket_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["adopter_document_type"]
          id: string
          mime_type: string | null
          original_file_name: string | null
          storage_path: string
        }
        Insert: {
          adopter_id: string
          bucket_id?: string
          created_at?: string
          document_type: Database["public"]["Enums"]["adopter_document_type"]
          id?: string
          mime_type?: string | null
          original_file_name?: string | null
          storage_path: string
        }
        Update: Partial<Database["public"]["Tables"]["adopter_documents"]["Insert"]>
        Relationships: []
      }
      adopter_preferences: {
        Row: {
          adopter_id: string
          created_at: string
          filter_answers: Json
          filter_summary: string | null
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          good_with_kids: boolean | null
          notes: string | null
          preferred_affection_styles: string[]
          preferred_age_max_months: number | null
          preferred_age_min_months: number | null
          preferred_breeds: string[]
          preferred_energy_level: Database["public"]["Enums"]["dog_energy_level"] | null
          preferred_people_friendliness: string[]
          preferred_protectiveness: string[]
          preferred_size: Database["public"]["Enums"]["dog_size"] | null
          preferred_special_needs: string[]
          preferred_training_preferences: string[]
          updated_at: string
        }
        Insert: {
          adopter_id: string
          created_at?: string
          filter_answers?: Json
          filter_summary?: string | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          notes?: string | null
          preferred_affection_styles?: string[]
          preferred_age_max_months?: number | null
          preferred_age_min_months?: number | null
          preferred_breeds?: string[]
          preferred_energy_level?: Database["public"]["Enums"]["dog_energy_level"] | null
          preferred_people_friendliness?: string[]
          preferred_protectiveness?: string[]
          preferred_size?: Database["public"]["Enums"]["dog_size"] | null
          preferred_special_needs?: string[]
          preferred_training_preferences?: string[]
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["adopter_preferences"]["Insert"]>
        Relationships: []
      }
      adopter_profiles: {
        Row: {
          adopter_id: string
          adoption_reason: string | null
          agreement_accepted: boolean
          behavior_response: string | null
          bonding_plan: Json
          completed_at: string | null
          created_at: string
          current_pets: string | null
          daily_time_available: string | null
          dog_experience: string | null
          emergency_plan: string | null
          financial_preparedness: string | null
          had_pets_before: boolean | null
          home_ownership: string | null
          household_allergies: string | null
          household_member_count: number | null
          housing_type: string | null
          landlord_permission: string | null
          other_pets: Json
          patience_awareness: string | null
          rescue_dog_experience: string | null
          trauma_response: string | null
          travel_plan: string | null
          updated_at: string
          yard_space: string | null
        }
        Insert: {
          adopter_id: string
          adoption_reason?: string | null
          agreement_accepted?: boolean
          behavior_response?: string | null
          bonding_plan?: Json
          completed_at?: string | null
          created_at?: string
          current_pets?: string | null
          daily_time_available?: string | null
          dog_experience?: string | null
          emergency_plan?: string | null
          financial_preparedness?: string | null
          had_pets_before?: boolean | null
          home_ownership?: string | null
          household_allergies?: string | null
          household_member_count?: number | null
          housing_type?: string | null
          landlord_permission?: string | null
          other_pets?: Json
          patience_awareness?: string | null
          rescue_dog_experience?: string | null
          trauma_response?: string | null
          travel_plan?: string | null
          updated_at?: string
          yard_space?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["adopter_profiles"]["Insert"]>
        Relationships: []
      }
      appointments: {
        Row: {
          adopter_id: string
          application_id: string | null
          appointment_date: string
          appointment_time: string
          booking_code: string
          check_in_note: string | null
          check_in_token_hash: string | null
          checked_in_at: string | null
          checked_in_by: string | null
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
          booking_code: string
          check_in_note?: string | null
          check_in_token_hash?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
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
      appointment_messages: {
        Row: {
          adopter_id: string
          appointment_id: string
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          read_by_adopter_at: string | null
          read_by_shelter_at: string | null
          sender_label: string | null
          sender_role: "adopter" | "shelter" | "system"
          shelter_id: string
        }
        Insert: {
          adopter_id: string
          appointment_id: string
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          read_by_adopter_at?: string | null
          read_by_shelter_at?: string | null
          sender_label?: string | null
          sender_role: "adopter" | "shelter" | "system"
          shelter_id: string
        }
        Update: Partial<Database["public"]["Tables"]["appointment_messages"]["Insert"]>
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
          cover_photo_id: string | null
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
          cover_photo_id?: string | null
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
      pawjai_profile: {
        Row: {
          contact_items: Json
          created_at: string
          hero_slogan: string
          id: string
          mission_body: string
          mission_title: string
          partner_shelters: Json
          updated_at: string
        }
        Insert: {
          contact_items?: Json
          created_at?: string
          hero_slogan?: string
          id?: string
          mission_body?: string
          mission_title?: string
          partner_shelters?: Json
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["pawjai_profile"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          cover_photo_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone_number: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          cover_photo_url?: string | null
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
          google_maps_url: string | null
          hygiene_rating: number | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          meeting_instructions: string | null
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
          google_maps_url?: string | null
          hygiene_rating?: number | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          meeting_instructions?: string | null
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
      shelter_regular_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          opens_at: string | null
          shelter_id: string
          slot_duration_minutes: number
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          shelter_id: string
          slot_duration_minutes?: number
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["shelter_regular_hours"]["Insert"]>
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
      adopter_document_type: "id_copy" | "house_image" | "income_statement" | "other"
      adopter_verification_status: "not_started" | "submitted" | "approved" | "needs_updates"
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
export type PawjaiProfile = Database["public"]["Tables"]["pawjai_profile"]["Row"]
export type Shelter = Database["public"]["Tables"]["shelters"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Adopter = Database["public"]["Tables"]["adopters"]["Row"]
export type AdopterDocument = Database["public"]["Tables"]["adopter_documents"]["Row"]
export type AdopterPreference = Database["public"]["Tables"]["adopter_preferences"]["Row"]
export type AdopterProfile = Database["public"]["Tables"]["adopter_profiles"]["Row"]
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
