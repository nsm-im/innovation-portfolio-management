import { theme, type ThemeConfig } from "antd";

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#e67e22",
    colorBgBase: "#141414",
    colorBgContainer: "#1a1a1a",
    colorBgElevated: "#1f1f1f",
    colorBgLayout: "#0d0d0d",
    colorBorder: "rgba(255,255,255,0.08)",
    colorBorderSecondary: "rgba(255,255,255,0.06)",
    colorText: "#e0e0e0",
    colorTextSecondary: "#999999",
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: "#111111",
      headerBg: "#111111",
      bodyBg: "#0d0d0d",
      triggerBg: "#1a1a1a",
    },
    Menu: {
      darkItemBg: "#111111",
      darkItemSelectedBg: "rgba(230, 126, 34, 0.15)",
      darkItemSelectedColor: "#e67e22",
      darkItemHoverBg: "rgba(255,255,255,0.04)",
    },
    Card: {
      colorBgContainer: "rgba(255,255,255,0.03)",
      colorBorder: "rgba(255,255,255,0.08)",
    },
    Table: {
      colorBgContainer: "transparent",
      headerBg: "rgba(255,255,255,0.04)",
      rowHoverBg: "rgba(230, 126, 34, 0.06)",
      borderColor: "rgba(255,255,255,0.06)",
    },
    Select: {
      colorBgContainer: "#1a1a1a",
      colorBgElevated: "#1f1f1f",
    },
    Segmented: {
      itemSelectedBg: "#e67e22",
      itemSelectedColor: "#ffffff",
    },
  },
};

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#e67e22",
    colorBgBase: "#ffffff",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBgLayout: "#f4f6f8",
    colorBorder: "rgba(0,0,0,0.08)",
    colorBorderSecondary: "rgba(0,0,0,0.05)",
    colorText: "#1f2937",
    colorTextSecondary: "#6b7280",
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: "#ffffff",
      headerBg: "#ffffff",
      bodyBg: "#f4f6f8",
      triggerBg: "#f0f2f5",
    },
    Menu: {
      itemBg: "#ffffff",
      itemSelectedBg: "rgba(230, 126, 34, 0.12)",
      itemSelectedColor: "#e67e22",
      itemHoverBg: "rgba(0,0,0,0.03)",
    },
    Card: {
      colorBgContainer: "#ffffff",
      colorBorder: "rgba(0,0,0,0.08)",
    },
    Table: {
      colorBgContainer: "transparent",
      headerBg: "#f9fafb",
      rowHoverBg: "rgba(230, 126, 34, 0.05)",
      borderColor: "rgba(0,0,0,0.06)",
    },
    Select: {
      colorBgContainer: "#ffffff",
      colorBgElevated: "#ffffff",
    },
    Segmented: {
      itemSelectedBg: "#e67e22",
      itemSelectedColor: "#ffffff",
    },
  },
};
