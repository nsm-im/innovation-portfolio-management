export interface Innovation {
  id: number;
  name: string;
  finished_year: number;
  status: "Strategic Direction" | "Development" | "Test/Implement" | "Launch";
  innovation_management_portfolio: "Core" | "Adjacent";
  innovation_category: "Service" | "Product" | "Process";
}

export const STATUS_ORDER = [
  "Strategic Direction",
  "Development",
  "Test/Implement",
  "Launch",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "Strategic Direction": "#8b5cf6",
  Development: "#3b82f6",
  "Test/Implement": "#f59e0b",
  Launch: "#10b981",
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
