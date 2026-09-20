export type InnovationSource = "top-down" | "bottom-up";

export interface Innovation {
  id: number;
  name: string;
  year: number;
  status: "In Progress" | "Done" | "Terminated";
  innovation_management_portfolio: "Core" | "Adjacent" | "Transformation" | string;
  innovation_category: "Service" | "Product" | "Process" | string;
  source?: InnovationSource;
  description?: string;
  responsible_department?: string;
  submitter_info?: string;
}

export const STATUS_ORDER = [
  "In Progress",
  "Done",
  "Terminated",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "In Progress": "rgb(61, 136, 198)",
  Done: "rgb(86, 177, 141)",
  Terminated: "rgb(217, 100, 121)",
};

export const PORTFOLIO_COLORS: Record<string, string> = {
  Core: "#06b6d4",
  Adjacent: "#f97316",
  Transformation: "#a855f7",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Service: "#ec4899",
  Product: "#8b5cf6",
  Process: "#14b8a6",
};
