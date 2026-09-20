import { Refine } from "@refinedev/core";
import { ThemedLayout, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import { DashboardPage } from "./pages/dashboard";
import { StatusListPage } from "./pages/status";
import { csvDataProvider } from "./providers/csvDataProvider";

import "@refinedev/antd/dist/reset.css";

const darkTheme = {
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
    colorTextSecondary: "#999",
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
      itemSelectedColor: "#fff",
    },
  },
};

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={darkTheme}>
        <AntdApp>
          <Refine
            dataProvider={csvDataProvider}
            notificationProvider={useNotificationProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: "innovations",
                list: "/",
                meta: {
                  label: " All Innovations",
                  icon: "🌐",
                },
              },
              {
                name: "topdown-innovations",
                list: "/?source=topdown",
                meta: {
                  label: " Top-Down",
                  icon: "🏛️",
                },
              },
              {
                name: "bottomup-innovations",
                list: "/?source=bottomup",
                meta: {
                  label: " Bottom-Up",
                  icon: "💡",
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              disableTelemetry: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <ThemedLayout
                    Title={(props: { collapsed?: boolean }) => (
                      <ThemedTitle
                        collapsed={props.collapsed ?? false}
                        text="Innovation IM"
                        icon={
                          <span style={{ fontSize: 22 }}>🚀</span>
                        }
                      />
                    )}
                  >
                    <Outlet />
                  </ThemedLayout>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/status/:status" element={<StatusListPage />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
