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
  Input,
  Button,
  theme,
  Row,
  Col,
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import type { Innovation } from "../../types";
import { STATUS_COLORS } from "../../types";
import { useColorMode } from "../../contexts/ThemeContext";

const { Title, Text, Paragraph } = Typography;

interface ZoneDefinition {
  key: string;
  aliases: string[];
  title: string;
  subtitle: string;
  description: string;
  benchmark: string;
  fillColor: string;
  borderColor: string;
  badgeBg: string;
}

const ZONES: ZoneDefinition[] = [
  {
    key: "Core",
    aliases: ["Core", "Incremental"],
    title: "CORE",
    subtitle: "Incremental Innovations",
    description: "Optimizing existing products for existing customers & markets",
    benchmark: "70%",
    fillColor: "#2ab7f7",
    borderColor: "#1d6fc2",
    badgeBg: "rgba(11, 78, 148, 0.35)",
  },
  {
    key: "Adjacent",
    aliases: ["Adjacent", "Substantial"],
    title: "ADJACENT",
    subtitle: "Expanding Innovations",
    description: "Expanding from existing business into new to the company",
    benchmark: "20%",
    fillColor: "#2ab7f7",
    borderColor: "#389cf7",
    badgeBg: "rgba(29, 123, 209, 0.35)",
  },
  {
    key: "Transformation",
    aliases: ["Transformation", "Tranformation", "Transformational", "Radical"],
    title: "TRANSFORMATIONAL",
    subtitle: "Breakthrough Innovations",
    description: "Developing breakthroughs and inventing things for new markets",
    benchmark: "10%",
    fillColor: "#2ab7f7",
    borderColor: "#6bd2ff",
    badgeBg: "rgba(42, 183, 247, 0.35)",
  },
];

// Helper to calculate pseudo-random reproducible polar coordinates inside annular sector [rMin, rMax]
// reserving the central corridor (theta ~ 0.22*pi to 0.27*pi) for labels if needed, or spreading smoothly
function getRadialPosition(
  index: number,
  total: number,
  rMin: number,
  rMax: number,
  _width: number,
  _height: number,
  offsetX: number,
  offsetY: number
) {
  // Use arc range from 0.07*pi (near products axis) to 0.43*pi (near markets axis)
  const angleSpanMin = 0.07 * Math.PI;
  const angleSpanMax = 0.43 * Math.PI;

  if (total === 1) {
    const r = (rMin + rMax) / 2;
    const theta = 0.15 * Math.PI;
    return {
      x: offsetX + r * Math.cos(theta),
      y: offsetY - r * Math.sin(theta),
    };
  }

  // Multi-tier radial rings so bubbles are well-dispersed
  const numRings = Math.max(2, Math.min(5, Math.ceil(total / 6)));
  const ringIndex = index % numRings;
  const rStep = (rMax - rMin - 36) / Math.max(1, numRings - 1);
  const r = Math.min(Math.max(rMin + 18 + ringIndex * rStep, rMin + 14), rMax - 18);

  // Even angular dispersion along the arc
  const thetaStep = (angleSpanMax - angleSpanMin) / (total + 1);
  const thetaBase = angleSpanMin + (index + 1) * thetaStep;
  // Subtle deterministic wobble
  const thetaWobble = Math.sin(index * 2.3) * 0.02;
  const theta = Math.max(angleSpanMin + 0.01, Math.min(angleSpanMax - 0.01, thetaBase + thetaWobble));

  const x = offsetX + r * Math.cos(theta);
  const y = offsetY - r * Math.sin(theta);

  return { x, y };
}

export const LandscapePage: React.FC = () => {
  const { mode } = useColorMode();
  const { token } = theme.useToken();
  const isDark = mode === "dark";

  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal inspection state
  const [inspectedZone, setInspectedZone] = useState<ZoneDefinition | null>(null);
  const [inspectedInnovation, setInspectedInnovation] = useState<Innovation | null>(null);

  const { result } = useList<Innovation>({
    resource: "innovations",
    pagination: { mode: "off" },
  });

  const rawRecords = useMemo(
    () => (result?.data ?? []) as Innovation[],
    [result]
  );

  // Available years
  const availableYears = useMemo(
    () => [...new Set(rawRecords.map((r) => r.year))].filter(Boolean).sort(),
    [rawRecords]
  );

  // Filtered records
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((record) => {
      if (selectedSource === "topdown" && record.source !== "top-down") return false;
      if (selectedSource === "bottomup" && record.source !== "bottom-up") return false;
      if (selectedYear !== "all" && String(record.year) !== selectedYear) return false;
      if (selectedStatus !== "all" && record.status !== selectedStatus) return false;
      if (
        searchQuery.trim() &&
        !record.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !record.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rawRecords, selectedSource, selectedYear, selectedStatus, searchQuery]);

  // Group records into Core, Adjacent, Transformation
  const groupedData = useMemo(() => {
    const map: Record<string, Innovation[]> = {
      Core: [],
      Adjacent: [],
      Transformation: [],
    };

    filteredRecords.forEach((item) => {
      const pStr = (item.innovation_management_portfolio || "").toLowerCase();
      if (pStr.includes("trans") || pStr.includes("radic")) {
        map.Transformation.push(item);
      } else if (pStr.includes("adjac") || pStr.includes("subst")) {
        map.Adjacent.push(item);
      } else {
        map.Core.push(item);
      }
    });

    return map;
  }, [filteredRecords]);

  // Diagram Dimensions
  // Coordinate origin is bottom-left (offsetX, offsetY)
  const svgWidth = 840;
  const svgHeight = 720;
  const offsetX = 110; // margin for Y-axis labels
  const offsetY = 620; // margin for X-axis labels

  const rCore = 220;
  const rAdjacent = 390;
  const rTransform = 570;

  const tableColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Innovation) => (
        <div>
          <Text strong style={{ color: token.colorText }}>
            {name}
          </Text>
          {record.description && (
            <div
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                marginTop: 2,
                maxHeight: 48,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
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
      width: 125,
      render: (src: string) => (
        <Tag
          color={src === "top-down" ? "#e67e22" : "#3b82f6"}
          style={{ borderRadius: 12, padding: "2px 8px" }}
        >
          {src === "top-down" ? "🏛️ Top-Down" : "💡 Bottom-Up"}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "innovation_category",
      key: "innovation_category",
      width: 110,
      render: (cat: string) => <Tag>{cat || "N/A"}</Tag>,
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: 80,
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

  const totalCount = filteredRecords.length || 1;

  return (
    <div style={{ padding: "0 12px 40px" }}>
      {/* Title & Introduction Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
              <span>🗺️</span> Innovation Portfolio Landscape
            </Title>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {ZONES.map((zone) => {
          const count = groupedData[zone.key]?.length || 0;
          const pct = Math.round((count / totalCount) * 100);
          return (
            <Col xs={24} sm={8} key={zone.key}>
              <Card
                size="small"
                hoverable
                onClick={() => setInspectedZone(zone)}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                  borderLeft: `5px solid ${zone.fillColor}`,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: zone.fillColor,
                      }}
                    >
                      {zone.title} (PRESENT)
                    </span>
                    <div style={{ fontSize: 13, color: token.colorTextSecondary, marginTop: 2 }}>
                      {zone.subtitle}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: token.colorText }}>
                    {count}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: token.colorTextSecondary }}>
                    ({pct}% of total)
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: token.colorPrimary, display: "flex", alignItems: "center", gap: 4 }}>
                    <EyeOutlined /> View list
                  </span>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Control Filter Bar */}
      <Card
        size="small"
        style={{
          marginBottom: 20,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 12,
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
          <Space wrap>
            <Text style={{ color: "#888", fontWeight: 600, fontSize: 13 }}>Source:</Text>
            <Segmented
              value={selectedSource}
              onChange={(val) => setSelectedSource(String(val))}
              options={[
                { label: "🌐 All Innovations", value: "all" },
                { label: "🏛️ Top-Down", value: "topdown" },
                { label: "💡 Bottom-Up", value: "bottomup" },
              ]}
              style={{ fontWeight: 500 }}
            />
          </Space>

          <Space wrap size="middle">
            <Input
              placeholder="Search innovation name..."
              prefix={<SearchOutlined style={{ color: "#aaa" }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />

            <Space>
              <Text style={{ color: "#888", fontSize: 13 }}>Year</Text>
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
              <Text style={{ color: "#888", fontSize: 13 }}>Status</Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 130 }}
                options={[
                  { label: "All Statuses", value: "all" },
                  { label: "Done", value: "Done" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Terminated", value: "Terminated" },
                ]}
              />
            </Space>
          </Space>
        </div>
      </Card>

      {/* Main Diagram Area */}
      <div
        style={{
          background: isDark ? "#0f172a" : "#f8fafc",
          border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
          borderRadius: 16,
          padding: "24px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflowX: "auto",
          position: "relative",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ position: "relative", width: svgWidth, height: svgHeight, minWidth: svgWidth }}>
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Radial and Linear gradients */}
              <linearGradient id="gradTransform" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#25aff3" stopOpacity={isDark ? "0.9" : "0.85"} />
                <stop offset="100%" stopColor="#38b6ff" stopOpacity={isDark ? "0.95" : "0.9"} />
              </linearGradient>

              <linearGradient id="gradAdjacent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1976d2" stopOpacity={isDark ? "0.92" : "0.88"} />
                <stop offset="100%" stopColor="#1e88e5" stopOpacity={isDark ? "0.95" : "0.9"} />
              </linearGradient>

              <linearGradient id="gradCore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b488a" stopOpacity={isDark ? "0.95" : "0.92"} />
                <stop offset="100%" stopColor="#0d5c9e" stopOpacity={isDark ? "0.98" : "0.95"} />
              </linearGradient>

              {/* Arrow Marker Definition */}
              <marker
                id="arrowHead"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#a0c8f0" opacity="0.85" />
              </marker>

              {/* Drop Shadow Filter for nodes */}
              <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Background quadrant sectors */}
            {/* 1. Transformational Outer Area (Rectangle clipped or full quad) */}
            <path
              d={`M ${offsetX} ${offsetY} L ${offsetX} ${offsetY - rTransform} L ${offsetX + rTransform} ${offsetY - rTransform} L ${offsetX + rTransform} ${offsetY} Z`}
              fill="url(#gradTransform)"
              stroke="#60c0ff"
              strokeWidth="2"
            />

            {/* 2. Adjacent Middle Sector Arc */}
            <path
              d={`M ${offsetX} ${offsetY} L ${offsetX} ${offsetY - rAdjacent} A ${rAdjacent} ${rAdjacent} 0 0 1 ${offsetX + rAdjacent} ${offsetY} Z`}
              fill="url(#gradAdjacent)"
              stroke="#4ba3f5"
              strokeWidth="2"
            />

            {/* 3. Core Inner Sector Arc */}
            <path
              d={`M ${offsetX} ${offsetY} L ${offsetX} ${offsetY - rCore} A ${rCore} ${rCore} 0 0 1 ${offsetX + rCore} ${offsetY} Z`}
              fill="url(#gradCore)"
              stroke="#2e85dc"
              strokeWidth="2"
            />

            {/* Outward transition arrows matching reference diagram */}
            {/* Arrows along Core -> Adjacent arc */}
            {[0.14, 0.25, 0.36].map((frac, idx) => {
              const ang = frac * Math.PI;
              const rStart = rCore - 14;
              const rEnd = rCore + 28;
              const x1 = offsetX + rStart * Math.cos(ang);
              const y1 = offsetY - rStart * Math.sin(ang);
              const x2 = offsetX + rEnd * Math.cos(ang);
              const y2 = offsetY - rEnd * Math.sin(ang);
              return (
                <line
                  key={`arr-core-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#a3d5ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowHead)"
                  opacity="0.85"
                />
              );
            })}

            {/* Arrows along Adjacent -> Transformational arc */}
            {[0.12, 0.22, 0.32, 0.42].map((frac, idx) => {
              const ang = frac * Math.PI;
              const rStart = rAdjacent - 14;
              const rEnd = rAdjacent + 28;
              const x1 = offsetX + rStart * Math.cos(ang);
              const y1 = offsetY - rStart * Math.sin(ang);
              const x2 = offsetX + rEnd * Math.cos(ang);
              const y2 = offsetY - rEnd * Math.sin(ang);
              return (
                <line
                  key={`arr-adj-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#c5e6ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowHead)"
                  opacity="0.9"
                />
              );
            })}

            {/* Outward transition arrows matching reference diagram */}

            {/* Axis Lines */}
            {/* Y Axis line */}
            <line
              x1={offsetX}
              y1={offsetY}
              x2={offsetX}
              y2={offsetY - rTransform - 20}
              stroke={isDark ? "#94a3b8" : "#475569"}
              strokeWidth="2.5"
            />
            {/* X Axis line */}
            <line
              x1={offsetX}
              y1={offsetY}
              x2={offsetX + rTransform + 20}
              y2={offsetY}
              stroke={isDark ? "#94a3b8" : "#475569"}
              strokeWidth="2.5"
            />

            {/* --- Y AXIS (MARKETS) LABELS & TICKS --- */}
            {/* Arrow on top of Y-axis */}
            <polygon
              points={`${offsetX - 5},${offsetY - rTransform - 20} ${offsetX + 5},${offsetY - rTransform - 20} ${offsetX},${offsetY - rTransform - 32}`}
              fill={isDark ? "#94a3b8" : "#475569"}
            />

            {/* "MARKETS" rotated text on the far left */}
            <g transform={`translate(${offsetX - 50}, ${offsetY - rTransform / 2}) rotate(-90)`}>
              <text
                x="10"
                y="-80"
                fill={isDark ? "#60a5fa" : "#1e40af"}
                fontSize="18"
                fontWeight="900"
                letterSpacing="0.15em"
                textAnchor="middle"
              >
                CUSTOMERS & MARKETS ➔
              </text>
            </g>

            {/* Y Axis Ticks (Existing, Adjustment, New) */}
            <g transform={`translate(${offsetX - 16}, 0)`}>
              {/* Existing */}
              <text
                x="0"
                y={offsetY - 45}
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="end"
              >
                Existing
              </text>
              {/* Adjustment */}
              <text
                x="0"
                y={offsetY - 280}
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="end"
              >
                Adjustment
              </text>
              {/* New */}
              <text
                x="0"
                y={offsetY - 510}
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="end"
              >
                New
              </text>
            </g>

            {/* --- X AXIS (PRODUCTS) LABELS & TICKS --- */}
            {/* Arrow on right of X-axis */}
            <polygon
              points={`${offsetX + rTransform + 20},${offsetY - 5} ${offsetX + rTransform + 20},${offsetY + 5} ${offsetX + rTransform + 32},${offsetY}`}
              fill={isDark ? "#94a3b8" : "#475569"}
            />

            {/* X Axis Ticks (Existing, Incremental, New) */}
            <g transform={`translate(0, ${offsetY + 28})`}>
              {/* Existing */}
              <text
                x={offsetX + 45}
                y="0"
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="middle"
              >
                Existing
              </text>
              {/* Incremental */}
              <text
                x={offsetX + 280}
                y="0"
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="middle"
              >
                Incremental
              </text>
              {/* New */}
              <text
                x={offsetX + 510}
                y="0"
                fill={isDark ? "#cbd5e1" : "#334155"}
                fontSize="13"
                fontWeight="600"
                textAnchor="middle"
              >
                New
              </text>
            </g>

            {/* "PRODUCTS" horizontal text at bottom */}
            <g transform={`translate(${offsetX + rTransform / 2}, ${offsetY + 68})`}>
              <text
                x="0"
                y="0"
                fill={isDark ? "#60a5fa" : "#1e40af"}
                fontSize="18"
                fontWeight="900"
                letterSpacing="0.15em"
                textAnchor="middle"
              >
                TECHNOLOGIES ➔

              </text>
            </g>

            {/* --- PLOTTED INNOVATION BUBBLES --- */}
            {/* 1. Core items */}
            {groupedData.Core.map((item, idx) => {
              const pos = getRadialPosition(
                idx,
                groupedData.Core.length,
                30,
                rCore - 30,
                svgWidth,
                svgHeight,
                offsetX,
                offsetY
              );
              const nodeColor = STATUS_COLORS[item.status] || "#94a3b8";

              return (
                <Tooltip
                  key={`core-${item.id}-${idx}`}
                  title={
                    <div style={{ maxWidth: 260, padding: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        📂 Portfolio: <strong>Core</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🏷️ Category: <strong>{item.innovation_category || "N/A"}</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🎯 Status: <Tag color={nodeColor} style={{ margin: 0, padding: "0 6px" }}>{item.status}</Tag>
                      </div>
                      <div style={{ fontSize: 11 }}>📅 Year: {item.year}</div>
                      {item.description && (
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>
                          {item.description.slice(0, 90)}...
                        </div>
                      )}
                    </div>
                  }
                >
                  <g
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: "pointer", transition: "transform 0.2s" }}
                    onClick={() => setInspectedInnovation(item)}
                  >
                    <circle
                      r="8"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#nodeGlow)"
                    />
                  </g>
                </Tooltip>
              );
            })}

            {/* 2. Adjacent items */}
            {groupedData.Adjacent.map((item, idx) => {
              const pos = getRadialPosition(
                idx,
                groupedData.Adjacent.length,
                rCore + 30,
                rAdjacent - 30,
                svgWidth,
                svgHeight,
                offsetX,
                offsetY
              );
              const nodeColor = STATUS_COLORS[item.status] || "#94a3b8";

              return (
                <Tooltip
                  key={`adj-${item.id}-${idx}`}
                  title={
                    <div style={{ maxWidth: 260, padding: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        📂 Portfolio: <strong>Adjacent</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🏷️ Category: <strong>{item.innovation_category || "N/A"}</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🎯 Status: <Tag color={nodeColor} style={{ margin: 0, padding: "0 6px" }}>{item.status}</Tag>
                      </div>
                      <div style={{ fontSize: 11 }}>📅 Year: {item.year}</div>
                      {item.description && (
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>
                          {item.description.slice(0, 90)}...
                        </div>
                      )}
                    </div>
                  }
                >
                  <g
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: "pointer", transition: "transform 0.2s" }}
                    onClick={() => setInspectedInnovation(item)}
                  >
                    <circle
                      r="8"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#nodeGlow)"
                    />
                  </g>
                </Tooltip>
              );
            })}

            {/* 3. Transformational items */}
            {groupedData.Transformation.map((item, idx) => {
              const pos = getRadialPosition(
                idx,
                groupedData.Transformation.length,
                rAdjacent + 30,
                rTransform - 35,
                svgWidth,
                svgHeight,
                offsetX,
                offsetY
              );
              const nodeColor = STATUS_COLORS[item.status] || "#94a3b8";

              return (
                <Tooltip
                  key={`trans-${item.id}-${idx}`}
                  title={
                    <div style={{ maxWidth: 260, padding: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        📂 Portfolio: <strong>Transformational</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🏷️ Category: <strong>{item.innovation_category || "N/A"}</strong>
                      </div>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>
                        🎯 Status: <Tag color={nodeColor} style={{ margin: 0, padding: "0 6px" }}>{item.status}</Tag>
                      </div>
                      <div style={{ fontSize: 11 }}>📅 Year: {item.year}</div>
                      {item.description && (
                        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>
                          {item.description.slice(0, 90)}...
                        </div>
                      )}
                    </div>
                  }
                >
                  <g
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: "pointer", transition: "transform 0.2s" }}
                    onClick={() => setInspectedInnovation(item)}
                  >
                    <circle
                      r="8"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#nodeGlow)"
                    />
                  </g>
                </Tooltip>
              );
            })}

            {/* --- TOP-LAYER SECTOR LABELS (Clean, high-contrast, clickable) --- */}
            {/* 1. TRANSFORMATIONAL Badge */}
            <g
              transform={`translate(${offsetX + 330}, ${offsetY - 495})`}
              style={{ cursor: "pointer" }}
              onClick={() => setInspectedZone(ZONES[2])}
            >
              {/* Frosted / solid dark-blue pill backdrop to guarantee readability over bubbles and gradients */}
              <rect
                x="-12"
                y="-24"
                width="290"
                height="56"
                rx="14"
                fill="rgba(8, 30, 58, 0.78)"
                stroke="#6bd2ff"
                strokeWidth="1.5"
                filter="url(#nodeGlow)"
              />
              <text
                x="0"
                y="0"
                fill="#ffffff"
                fontSize="18"
                fontWeight="800"
                letterSpacing="0.06em"
              >
                TRANSFORMATIONAL
              </text>
              <text
                x="0"
                y="19"
                fill="#bfe9ff"
                fontSize="11.5"
                fontWeight="500"
              >
                Breakthroughs & new markets ({groupedData.Transformation.length} items)
              </text>
            </g>

            {/* 2. ADJACENT Badge */}
            <g
              transform={`translate(${offsetX + 215}, ${offsetY - 295})`}
              style={{ cursor: "pointer" }}
              onClick={() => setInspectedZone(ZONES[1])}
            >
              <rect
                x="-12"
                y="-24"
                width="240"
                height="56"
                rx="14"
                fill="rgba(6, 26, 52, 0.82)"
                stroke="#389cf7"
                strokeWidth="1.5"
                filter="url(#nodeGlow)"
              />
              <text
                x="0"
                y="0"
                fill="#ffffff"
                fontSize="18"
                fontWeight="800"
                letterSpacing="0.06em"
              >
                ADJACENT
              </text>
              <text
                x="0"
                y="19"
                fill="#bfe9ff"
                fontSize="11.5"
                fontWeight="500"
              >
                Expanding business ({groupedData.Adjacent.length} items)
              </text>
            </g>

            {/* 3. CORE Badge */}
            <g
              transform={`translate(${offsetX + 40}, ${offsetY - 75})`}
              style={{ cursor: "pointer" }}
              onClick={() => setInspectedZone(ZONES[0])}
            >
              <rect
                x="-10"
                y="-22"
                width="225"
                height="54"
                rx="14"
                fill="rgba(4, 18, 38, 0.86)"
                stroke="#1d6fc2"
                strokeWidth="1.5"
                filter="url(#nodeGlow)"
              />
              <text
                x="0"
                y="0"
                fill="#ffffff"
                fontSize="17"
                fontWeight="800"
                letterSpacing="0.06em"
              >
                CORE
              </text>
              <text
                x="0"
                y="18"
                fill="#bfe9ff"
                fontSize="11.5"
                fontWeight="500"
              >
                Optimizing existing ({groupedData.Core.length} items)
              </text>
            </g>
          </svg>

          {/* Status Color Legend on Top Right */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: -120,
              background: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(8px)",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: token.colorTextSecondary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Innovation Status
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["Done"],
                  border: "2px solid #fff",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                Done
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["In Progress"],
                  border: "2px solid #fff",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                In Progress
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS["Terminated"],
                  border: "2px solid #fff",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
                Terminated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Modal for a Zone / Portfolio */}
      <Modal
        open={!!inspectedZone}
        onCancel={() => setInspectedZone(null)}
        footer={null}
        width={900}
        title={
          inspectedZone && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: inspectedZone.fillColor,
                }}
              />
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {inspectedZone.title} Portfolio ({groupedData[inspectedZone.key]?.length || 0} Innovations)
              </span>
            </div>
          )
        }
      >
        {inspectedZone && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                borderRadius: 8,
                fontSize: 13,
                color: token.colorTextSecondary,
              }}
            >
              {inspectedZone.description} • Target recommended allocation: <strong>{inspectedZone.benchmark}</strong>
            </div>
            <Table
              dataSource={groupedData[inspectedZone.key] || []}
              columns={tableColumns}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setInspectedZone(null);
                  setInspectedInnovation(record);
                },
                style: { cursor: "pointer" },
              })}
            />
          </div>
        )}
      </Modal>

      {/* Detail Modal for an Individual Innovation */}
      <Modal
        open={!!inspectedInnovation}
        onCancel={() => setInspectedInnovation(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setInspectedInnovation(null)}>
            Close
          </Button>,
        ]}
        width={650}
        title={
          inspectedInnovation && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>💡</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Innovation Details</span>
            </div>
          )
        }
      >
        {inspectedInnovation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            <div>
              <Title level={4} style={{ margin: 0, color: token.colorText }}>
                {inspectedInnovation.name}
              </Title>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <Tag color={STATUS_COLORS[inspectedInnovation.status] || "#999"}>
                  {inspectedInnovation.status}
                </Tag>
                <Tag color={inspectedInnovation.source === "top-down" ? "#e67e22" : "#3b82f6"}>
                  {inspectedInnovation.source === "top-down" ? "🏛️ Top-Down" : "💡 Bottom-Up"}
                </Tag>
                <Tag color="blue">{inspectedInnovation.innovation_management_portfolio}</Tag>
                <Tag color="cyan">{inspectedInnovation.innovation_category}</Tag>
                <Tag>{inspectedInnovation.year}</Tag>
              </div>
            </div>

            {inspectedInnovation.description && (
              <div
                style={{
                  padding: "12px 16px",
                  background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                  borderRadius: 8,
                  border: `1px solid ${token.colorBorder}`,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: token.colorTextSecondary, marginBottom: 4 }}>
                  Description:
                </div>
                <Paragraph style={{ margin: 0, whiteSpace: "pre-line", color: token.colorText }}>
                  {inspectedInnovation.description}
                </Paragraph>
              </div>
            )}

            {inspectedInnovation.responsible_department && (
              <div>
                <Text strong style={{ fontSize: 13 }}>
                  Responsible Department / Organization:
                </Text>
                <div style={{ color: token.colorTextSecondary, marginTop: 4, whiteSpace: "pre-line" }}>
                  {inspectedInnovation.responsible_department}
                </div>
              </div>
            )}

            {inspectedInnovation.submitter_info && (
              <div>
                <Text strong style={{ fontSize: 13 }}>
                  Submitter Info:
                </Text>
                <div style={{ color: token.colorTextSecondary, marginTop: 4 }}>
                  {inspectedInnovation.submitter_info}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
export default LandscapePage;
