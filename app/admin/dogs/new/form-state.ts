export type ActionStatus = "idle" | "success" | "error";

export type CreateDogListingState = {
  dogId?: string;
  fieldErrors?: Record<string, string>;
  message: string;
  status: ActionStatus;
};

export const initialCreateDogListingState: CreateDogListingState = {
  message: "",
  status: "idle",
};

export type AdminGateState = {
  message: string;
  status: ActionStatus;
};

export const initialAdminGateState: AdminGateState = {
  message: "",
  status: "idle",
};
