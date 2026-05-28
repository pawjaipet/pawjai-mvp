export type PawjaiAdminGateState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialPawjaiAdminGateState: PawjaiAdminGateState = {
  message: "",
  status: "idle",
};
