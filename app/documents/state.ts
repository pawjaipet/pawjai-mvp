export type DocumentSubmissionState = {
  completed?: boolean;
  message: string | null;
  status: "idle" | "error" | "success";
};

export const initialDocumentSubmissionState: DocumentSubmissionState = {
  completed: false,
  message: null,
  status: "idle",
};
