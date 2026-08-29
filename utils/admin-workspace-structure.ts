export type AdminWorkspaceDraftRole = "admin" | "shelter_admin";

export type AdminWorkspaceSection = {
  description: string;
  globalOnly?: boolean;
  label: string;
  path: string;
  status: "current" | "move" | "new";
};

export type AdminWorkspaceDraft = {
  defaultPath: string;
  primarySections: AdminWorkspaceSection[];
  subtitle: string;
  title: string;
};

export type AdminDraftField = {
  label: string;
  options?: string[];
  required?: boolean;
  type: "checkbox" | "choice" | "file" | "number" | "select" | "text" | "textarea";
};

export type AdminDogWorkflowStep = {
  description: string;
  fields: AdminDraftField[];
  title: string;
};

export type AdminDogDraftWorkflow = {
  bookingActions: string[];
  createActions: string[];
  editActions: string[];
  listingFilters: string[];
  mediaControls: string[];
  uploadSources: string[];
  workflow: AdminDogWorkflowStep[];
};

const pawjaiHqDraft: AdminWorkspaceDraft = {
  defaultPath: "/admin",
  subtitle: "umbrella admin",
  title: "PawJai HQ",
  primarySections: [
    {
      description: "Platform-level snapshot across shelters, listings, visits, and launch readiness.",
      label: "Overview",
      path: "/admin",
      status: "new",
    },
    {
      description: "Directory of partner shelters, each opening into its own workspace.",
      label: "Shelters",
      path: "/admin",
      status: "new",
    },
    {
      description: "All dog listings across every shelter, reusing the current listings surface.",
      label: "Dogs",
      path: "/admin?view=dogs",
      status: "move",
    },
    {
      description: "Visit requests, QR check-in, follow-ups, and adopter communication.",
      label: "Bookings",
      path: "/admin?view=bookings",
      status: "current",
    },
    {
      description: "Donation attempts, transfer slips, shelter review, and verified totals across every shelter.",
      label: "Donations",
      path: "/admin?view=donations",
      status: "current",
    },
    {
      description: "PawJai-managed brand placements. This stays internal for now.",
      globalOnly: true,
      label: "Ads",
      path: "/admin?view=ads",
      status: "current",
    },
    {
      description: "Public PawJai About page copy, contact links, and partner shelter content.",
      globalOnly: true,
      label: "About content",
      path: "/admin/aboutcontent",
      status: "current",
    },
    {
      description: "PawJai admins and shelter workspace accounts.",
      globalOnly: true,
      label: "Accounts",
      path: "/admin/accounts",
      status: "current",
    },
    {
      description: "Privileged activity across shelter workspaces and platform tools.",
      globalOnly: true,
      label: "Audit",
      path: "/admin/audit",
      status: "current",
    },
    {
      description: "Launch traffic, adopter accounts, dog profile interest, verification, and booking funnel health.",
      globalOnly: true,
      label: "User analytics",
      path: "/admin/analytics",
      status: "new",
    },
    {
      description: "Read-only overview of appointment conversations across every partner shelter.",
      globalOnly: true,
      label: "Messages",
      path: "/admin?view=messages",
      status: "new",
    },
  ],
};

const shelterWorkspaceDraft: AdminWorkspaceDraft = {
  defaultPath: "/shelter",
  subtitle: "powered by PAWJAI",
  title: "My Shelter Workspace",
  primarySections: [
    {
      description: "Contact, location, branding, and direct donation payment details for this shelter.",
      label: "Shelter profile",
      path: "/shelter/[slug]?view=profile",
      status: "current",
    },
    {
      description: "Create, edit, preview, and manage the shelter dog database.",
      label: "Dogs",
      path: "/shelter/[slug]?view=dogs",
      status: "current",
    },
    {
      description: "Create a complete dog profile with photos, matching data, and searchable personality tags.",
      label: "Create dog",
      path: "/shelter/[slug]/dogs/new",
      status: "current",
    },
    {
      description: "Visit requests, QR check-in, follow-ups, and the shelter operating calendar.",
      label: "Bookings",
      path: "/shelter/[slug]?view=bookings",
      status: "current",
    },
    {
      description: "Donor details, transfer slips, review status, and verified donation totals for this shelter.",
      label: "Donations",
      path: "/shelter/[slug]?view=donations",
      status: "current",
    },
    {
      description: "Appointment-linked conversations between shelter staff and adopters.",
      label: "Messaging",
      path: "/shelter/[slug]?view=messages",
      status: "current",
    },
  ],
};

export function getAdminWorkspaceDraft(role: AdminWorkspaceDraftRole) {
  return role === "admin" ? pawjaiHqDraft : shelterWorkspaceDraft;
}

export function getDraftStatusLabel(status: AdminWorkspaceSection["status"]) {
  switch (status) {
    case "current":
      return "Existing";
    case "move":
      return "Rehome";
    case "new":
      return "New";
  }
}

export const adminDogDraftWorkflow: AdminDogDraftWorkflow = {
  bookingActions: [
    "Filter by date",
    "Filter by status",
    "Search booking code",
    "Accept booking",
    "Deny booking",
    "Ask to change date/time",
    "Mark visit completed",
    "Visitor did not show",
    "Mark dog adopted",
    "Send shelter reply",
    "Open booking",
    "QR check-in",
  ],
  createActions: [
    "Create dog listing",
    "Open the new dog profile",
    "View in Manage listings",
    "Fix listed fields",
  ],
  editActions: [
    "Save changes",
    "Open public profile",
    "Back to listings",
    "Delete this dog profile",
  ],
  listingFilters: [
    "Search by dog name",
    "Shelter",
    "Adoption status",
    "Draft",
    "Available",
    "Reserved",
    "Adopted",
    "Unavailable",
    "Needs info",
    "Has media",
    "No cover media",
    "Gender",
    "Size",
    "Energy level",
  ],
  mediaControls: [
    "Choose cover",
    "Move media up",
    "Move media down",
    "Add photo slot",
    "Remove last slot",
    "Append new photos on edit",
    "Reorder current media",
  ],
  uploadSources: [
    "Local folder inside pawjaidogs",
    "Upload photos and videos",
    "Photo URL slots",
    "Add new photos while editing",
  ],
  workflow: [
    {
      description: "The same public profile facts the current PawJai admin form already collects.",
      title: "Core Listing",
      fields: [
        { label: "Dog name", required: true, type: "text" },
        { label: "Shelter", required: true, type: "select" },
        { label: "Breed", type: "text" },
        {
          label: "Adoption status",
          options: ["Draft", "Available", "Reserved", "Adopted", "Unavailable"],
          type: "select",
        },
        { label: "Gender", options: ["Unknown", "Male", "Female"], type: "select" },
        { label: "Size", options: ["Small", "Medium", "Large"], type: "choice" },
        { label: "Age in months", type: "number" },
        { label: "Weight in kg", type: "number" },
        { label: "My Story", type: "textarea" },
        { label: "Medical needs shown on profile", type: "textarea" },
      ],
    },
    {
      description: "The matching and browsing metadata that feeds swipe cards and dog profiles.",
      title: "Matching Template",
      fields: [
        { label: "Energy level", options: ["Low", "Medium", "High"], type: "choice" },
        { label: "Protectiveness", options: ["Chill", "Alert barker", "Protective"], type: "choice" },
        { label: "Affection style", options: ["Cuddly", "Subtle", "Independent"], type: "choice" },
        { label: "Training status", options: ["Well-trained", "Still training", "Needs basics"], type: "choice" },
        { label: "People friendliness", options: ["Social", "Slow warm-up", "Owner-focused"], type: "choice" },
        { label: "Friendliness to other dogs", options: ["Friendly", "Selective", "Solo dog"], type: "choice" },
        { label: "Good with dogs?", options: ["Not sure", "Yes", "No / solo preferred"], type: "select" },
        { label: "Good with cats?", options: ["Not sure", "Yes", "No / unknown"], type: "select" },
        { label: "Good with kids?", options: ["Not sure", "Yes", "No / unknown"], type: "select" },
        { label: "House training", options: ["Not sure", "House trained", "Not house trained yet"], type: "select" },
        { label: "Search, select, or add personality tags", type: "choice" },
        { label: "Care and medical tags", type: "choice" },
        { label: "Sterilized", type: "checkbox" },
        { label: "Leash trained", type: "checkbox" },
        { label: "Animal friendly", type: "checkbox" },
      ],
    },
    {
      description: "The current admin upload flow supports bulk media, URL rows, local folders, cover choice, and ordering.",
      title: "Photos and Videos",
      fields: [
        { label: "Local folder inside pawjaidogs", type: "text" },
        { label: "Upload photos and videos", type: "file" },
        { label: "Cover and display order", type: "choice" },
        { label: "Photo URL 1", type: "text" },
        { label: "Photo URL 2", type: "text" },
      ],
    },
    {
      description: "The sticky submit area, error summary, success links, and edit/delete actions stay visible and predictable.",
      title: "Review and Manage",
      fields: [
        { label: "Please fix these fields first", type: "textarea" },
        { label: "Create dog listing", type: "choice" },
        { label: "Save changes", type: "choice" },
        { label: "Delete this dog profile", type: "choice" },
      ],
    },
  ],
};
