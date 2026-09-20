import React from "react";
import { Layout, Button, Tooltip, theme } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useColorMode } from "../contexts/ThemeContext";

const { Header } = Layout;

export const AppHeader: React.FC = () => {
  const { mode, toggleTheme } = useColorMode();
  const { token } = theme.useToken();

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Tooltip title={mode === "dark" ? "Switch to Light theme" : "Switch to Dark theme"}>
        <Button
          type="text"
          shape="circle"
          onClick={toggleTheme}
          icon={
            mode === "dark" ? (
              <SunOutlined style={{ fontSize: 18, color: "#f39c12" }} />
            ) : (
              <MoonOutlined style={{ fontSize: 18, color: "#4b5563" }} />
            )
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
          }}
        />
      </Tooltip>
    </Header>
  );
};
