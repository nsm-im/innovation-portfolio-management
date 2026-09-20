import React, { useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import {
  Card,
  Typography,
  Space,
  Segmented,
  Select,
  Tag,
  Modal,
  Table,
  Tooltip,
  theme,
} from "antd";
import type { Innovation } from "../../types";
import {
  STATUS_COLORS,
} from "../../types";
import { useColorMode } from "../../contexts/ThemeContext";

const { Title, Text } = Typography;

// Y-Axis: Degree of Innovation / Portfolio (Top to Bottom: Radical/Transformation -> Adjacent -> Incremental/Core)
const PORTFOLIO_ROWS = [
  {
    key: "Transformation",
    aliases: ["Transformation", "Tranformation", "Transformational", "Radical"],
    title: "Transformation",
    subtitle: "Radical / New Frontier",
    color: "#05a4faff",
  },
  {
    key: "Adjacent",
    aliases: ["Adjacent", "Substantial"],
    title: "Adjacent",
    subtitle: "Substantial / Expanding",
    color: "#255dd7ff",
  },
  {
    key: "Core",
    aliases: ["Core", "Incremental"],
    title: "Core",
    subtitle: "Incremental / Optimizing",
    color: "#0b358eff",
  },
];

// X-Axis: Type of Innovation / Category
const CATEGORY_COLS = [
  {
    key: "Product",
    aliases: ["Product", "Product Service", "Product/Service"],
    title: "Product",
    subtitle: "New Product & New Business",
    color: "#F1C40F",
    textColor: "#1f1f1f",
  },
  {
    key: "Process",
    aliases: ["Process"],
    title: "Process",
    subtitle: "Process Improvement & Smart Workforce",
    color: "#9B59B6",
    textColor: "#ffffff",
  },
  {
    key: "Service",
    aliases: ["Service", "Business Model"],
    title: "Service",
    subtitle: "Customer Experience",
    color: "#E6C7C2",
    textColor: "#2b2b2b",
  },
];

export const MatrixPage: React.FC = () => {
  const { mode } = useColorMode();
  const { token } = theme.useToken();

  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Selected cell for drill-down modal
  const [selectedCell, setSelectedCell] = useState<{
    portfolio: typeof PORTFOLIO_ROWS[number];
    category: typeof CATEGORY_COLS[number];
    items: Innovation[];
  } | null>(null);

  const { result } = useList<Innovation>({
    resource: "innovations",
    pagination: { mode: "off" },
  });

  const rawRecords = useMemo(
    () => (result?.data ?? []) as Innovation[],
    [result]
  );

  // Filter records by source, year, and status
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((record) => {
      if (selectedSource === "topdown" && record.source !== "top-down") {
        return false;
      }
      if (selectedSource === "bottomup" && record.source !== "bottom-up") {
        return false;
      }
      if (selectedYear !== "all" && String(record.year) !== selectedYear) {
        return false;
      }
      if (selectedStatus !== "all" && record.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [rawRecords, selectedSource, selectedYear, selectedStatus]);

  // Available years
  const availableYears = useMemo(
    () => [...new Set(rawRecords.map((r) => r.year))].filter(Boolean).sort(),
    [rawRecords]
  );

  // Group items by Matrix cell: [portfolioKey][categoryKey]
  const matrixData = useMemo(() => {
    const data: Record<string, Record<string, Innovation[]>> = {};

    PORTFOLIO_ROWS.forEach((p) => {
      data[p.key] = {};
      CATEGORY_COLS.forEach((c) => {
        data[p.key][c.key] = [];
      });
    });

    filteredRecords.forEach((item) => {
      // Find matching portfolio row
      const portfolioMatch = PORTFOLIO_ROWS.find((p) =>
        p.aliases.some(
          (alias) =>
            alias.toLowerCase() ===
            (item.innovation_management_portfolio || "").toLowerCase()
        )
      ) || PORTFOLIO_ROWS[2]; // Default to Core if unknown

      // Find matching category col
      const categoryMatch = CATEGORY_COLS.find((c) =>
        c.aliases.some(
          (alias) =>
            alias.toLowerCase() ===
            (item.innovation_category || "").toLowerCase()
        )
      ) || CATEGORY_COLS[0]; // Default to Product if unknown

      if (data[portfolioMatch.key]?.[categoryMatch.key]) {
        data[portfolioMatch.key][categoryMatch.key].push(item);
      }
    });

    return data;
  }, [filteredRecords]);

  // Modal Table columns
  const tableColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name: string, record: Innovation) => (
        <div>
          <Text strong style={{ color: token.colorText }}>
            {name}
          </Text>
          {record.description && (
            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 130,
      render: (src: string) => (
        <Tag
          color={src === "top-down" ? "#e67e22" : "#3b82f6"}
          style={{ borderRadius: 12, padding: "2px 10px" }}
        >
          {src === "top-down" ? "🏛️ Top-Down" : "💡 Bottom-Up"}
        </Tag>
      ),
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: 90,
      render: (year: number) => <Tag>{year}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag
          color={STATUS_COLORS[status] || "#999"}
          style={{ borderRadius: 12, fontWeight: 600, padding: "2px 10px" }}
        >
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 8px 32px" }}>
      {/* Top Header Card */}
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          🎯 Innovation Portfolio Matrix
        </Title>
      </div>

      {/* Filter Bar */}
      <Card
        size="small"
        style={{
          marginBottom: 24,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Space>
            <Text style={{ color: "#aaa", fontWeight: 600, fontSize: 13 }}>
              Source:
            </Text>
            <Segmented
              value={selectedSource}
              onChange={(val) => setSelectedSource(String(val))}
              options={[
                { label: "🌐 All Innovations", value: "all" },
                { label: "🏛️ Top-Down", value: "topdown" },
                { label: "💡 Bottom-Up", value: "bottomup" },
              ]}
              style={{
                background: "rgba(255,255,255,0.06)",
                fontWeight: 500,
              }}
            />
          </Space>

          <Space wrap size="middle">
            <Space>
              <Text style={{ color: "#999", fontSize: 13 }}>Year</Text>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 120 }}
                options={[
                  { label: "All Years", value: "all" },
                  ...availableYears.map((y) => ({
                    label: String(y),
                    value: String(y),
                  })),
                ]}
              />
            </Space>
            <Space>
              <Text style={{ color: "#999", fontSize: 13 }}>Status</Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 130 }}
                options={[
                  { label: "All Statuses", value: "all" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Done", value: "Done" },
                  { label: "Terminated", value: "Terminated" },
                ]}
              />
            </Space>
          </Space>
        </div>
      </Card>

      {/* Matrix Board */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "190px repeat(3, 1fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Top-Left Corner Cell */}
        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 16,
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                fontSize: 10,
                color: token.colorTextSecondary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Y: Degree of Innovation
            </span>
            <span
              style={{
                fontSize: 10,
                color: token.colorTextSecondary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              X: Type of Innovation
            </span>
          </div>

          {/* Status color legend */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: token.colorTextSecondary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Status Label:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["In Progress"],
                  boxShadow: `0 0 6px rgba(61, 136, 198, 0.5)`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: token.colorText }}>
                In Progress
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["Done"],
                  boxShadow: `0 0 6px rgba(86, 177, 141, 0.5)`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: token.colorText }}>
                Done
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["Terminated"],
                  boxShadow: `0 0 6px rgba(217, 100, 121, 0.5)`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: token.colorText }}>
                Terminated
              </span>
            </div>
          </div>
        </div>

        {/* X-Axis Column Headers */}
        {CATEGORY_COLS.map((col) => (
          <div
            key={col.key}
            style={{
              background: col.color,
              borderRadius: 16,
              padding: "16px 14px",
              color: col.textColor || "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              minHeight: 88,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
              {col.title}
            </span>
            <span style={{ fontSize: 12, opacity: 0.85, marginTop: 4, lineHeight: 1.3 }}>
              {col.subtitle}
            </span>
          </div>
        ))}

        {/* Y-Axis Rows and Intersecting Cells */}
        {PORTFOLIO_ROWS.map((row) => (
          <React.Fragment key={row.key}>
            {/* Row Header (Y-Axis) */}
            <div
              style={{
                background: row.color,
                borderRadius: 16,
                padding: "18px 14px",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                {row.title}
              </span>
              <span style={{ fontSize: 12, opacity: 0.85, marginTop: 4, lineHeight: 1.3 }}>
                {row.subtitle}
              </span>
            </div>

            {/* 3 Cells for this Row */}
            {CATEGORY_COLS.map((col) => {
              const items = matrixData[row.key]?.[col.key] || [];
              const cellBg =
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.03)"
                  : "#f9fafb";
              const cellBorder =
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)";

              return (
                <div
                  key={`${row.key}-${col.key}`}
                  onClick={() => {
                    if (items.length > 0) {
                      setSelectedCell({
                        portfolio: row,
                        category: col,
                        items,
                      });
                    }
                  }}
                  style={{
                    background: cellBg,
                    border: `1.5px solid ${cellBorder}`,
                    borderRadius: 16,
                    minHeight: 140,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: items.length > 0 ? "pointer" : "default",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (items.length > 0) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = row.color;
                      e.currentTarget.style.boxShadow = `0 6px 20px ${row.color}25`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = cellBorder;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Cell Top Details */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background:
                          items.length > 0
                            ? `${row.color}20`
                            : "transparent",
                        color: items.length > 0 ? token.colorText : token.colorTextSecondary,
                      }}
                    >
                      {items.length} {items.length === 1 ? "project" : "projects"}
                    </span>
                  </div>

                  {/* Dot Visualization matching reference image */}
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      flexWrap: "wrap",
                      gap: 8,
                      margin: "12px 0",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 60,
                    }}
                  >
                    {items.length === 0 ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                            fontStyle: "italic",
                            opacity: 0.7,
                          }}
                        >
                          No innovations
                        </span>
                      </div>
                    ) : (
                      items.slice(0, 18).map((item, idx) => {
                        const dotColor =
                          STATUS_COLORS[item.status] || row.color;
                        return (
                          <Tooltip
                            key={item.id || idx}
                            title={`${item.name} (${item.year}) - ${item.status}`}
                          >
                            <div
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                backgroundColor: dotColor,
                                boxShadow: dotColor.startsWith("rgb")
                                  ? dotColor.replace("rgb", "rgba").replace(")", ", 0.5)")
                                  : `0 0 8px ${dotColor}80`,
                                transition: "transform 0.15s ease",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.transform = "scale(1.4)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                              }
                            />
                          </Tooltip>
                        );
                      })
                    )}
                    {items.length > 18 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: token.colorTextSecondary,
                        }}
                      >
                        +{items.length - 18} more
                      </span>
                    )}
                  </div>

                  {/* Footer Prompt */}
                  {items.length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: row.color,
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      View list →
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Detail Drilldown Modal */}
      <Modal
        open={Boolean(selectedCell)}
        onCancel={() => setSelectedCell(null)}
        footer={null}
        width={850}
        title={
          selectedCell && (
            <div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {selectedCell.portfolio.title} × {selectedCell.category.title}
              </span>
              <div style={{ fontSize: 13, color: token.colorTextSecondary, marginTop: 2 }}>
                {selectedCell.items.length} Innovation projects
              </div>
            </div>
          )
        }
      >
        {selectedCell && (
          <div style={{ marginTop: 16 }}>
            <Table
              dataSource={selectedCell.items}
              columns={tableColumns}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              size="middle"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
