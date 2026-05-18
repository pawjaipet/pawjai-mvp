export type EditDogProfileState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialEditDogProfileState: EditDogProfileState = {
  status: "idle",
};
