export interface Innovation {
  id: number;
  name: string;
  year: number;
  status: "In Progress" | "Done" | "Rejected";
  innovation_management_portfolio: "Core" | "Adjacent";
  innovation_category: "Service" | "Product" | "Process";
}

export const STATUS_ORDER = [
  "In Progress",
  "Done",
  "Rejected",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "In Progress": "#3b82f6",
  Done: "#10b981",
  Rejected: "#ef4444",
};

export const PORTFOLIO_COLORS: Record<string, string> = {
  Core: "#06b6d4",
  Adjacent: "#f97316",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Service: "#ec4899",
  Product: "#8b5cf6",
  Process: "#14b8a6",
};
