import { Refine } from "@refinedev/core";
import { ThemedLayout, ThemedTitle, useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import { DashboardPage } from "./pages/dashboard";
import { StatusListPage } from "./pages/status";
import { csvDataProvider } from "./providers/csvDataProvider";
import { ThemeProvider, useColorMode } from "./contexts/ThemeContext";
import { darkTheme, lightTheme } from "./theme/themeConfig";
import { AppHeader } from "./components/Header";

import "@refinedev/antd/dist/reset.css";

const ThemedAppContent: React.FC = () => {
  const { mode } = useColorMode();
  const currentTheme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ConfigProvider theme={currentTheme}>
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
                  Header={AppHeader}
                  Title={(props: { collapsed?: boolean }) => (
                    <ThemedTitle
                      collapsed={props.collapsed ?? false}
                      text="Innovation IM"
                      icon={<span style={{ fontSize: 22 }}>🚀</span>}
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
  );
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemedAppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

