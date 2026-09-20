import React, { useMemo, useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useNavigate, useSearchParams } from "react-router";
import { Card, Col, Row, Select, Table, Tag, Typography, Space, Segmented, theme } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Innovation } from "../../types";
import {
  STATUS_ORDER,
  STATUS_COLORS,
  PORTFOLIO_COLORS,
  CATEGORY_COLORS,
} from "../../types";
import { useColorMode } from "../../contexts/ThemeContext";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { mode } = useColorMode();
  const { token } = theme.useToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedSource, setSelectedSource] = useState<string>(
    searchParams.get("source") || "all"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get("year") || "all"
  );
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>(
    searchParams.get("portfolio") || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [chartMode, setChartMode] = useState<string>("Projects");

  // Keep state synced when searchParams change (e.g. back button navigation)
  useEffect(() => {
    setSelectedSource(searchParams.get("source") || "all");
    setSelectedYear(searchParams.get("year") || "all");
    setSelectedPortfolio(searchParams.get("portfolio") || "all");
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    const newParams = new URLSearchParams(searchParams);
    if (source !== "all") newParams.set("source", source);
    else newParams.delete("source");
    setSearchParams(newParams, { replace: true });
  };

  // Update search params when user changes filters
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const newParams = new URLSearchParams(searchParams);
    if (year !== "all") newParams.set("year", year);
    else newParams.delete("year");
    setSearchParams(newParams, { replace: true });
  };

  const handlePortfolioChange = (portfolio: string) => {
    setSelectedPortfolio(portfolio);
    const newParams = new URLSearchParams(searchParams);
    if (portfolio !== "all") newParams.set("portfolio", portfolio);
    else newParams.delete("portfolio");
    setSearchParams(newParams, { replace: true });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category !== "all") newParams.set("category", category);
    else newParams.delete("category");
    setSearchParams(newParams, { replace: true });
  };

  const { result, query } = useList<Innovation>({
    resource: "innovations",
    pagination: { mode: "off" },
  });

  const rawRecords = useMemo(() => (result?.data ?? []) as Innovation[], [result]);
  const isLoading = query?.isLoading ?? false;

  // Filter records by selected overview source first
  const allRecords = useMemo(() => {
    if (selectedSource === "topdown") {
      return rawRecords.filter((r) => r.source === "top-down");
    }
    if (selectedSource === "bottomup") {
      return rawRecords.filter((r) => r.source === "bottom-up");
    }
    return rawRecords;
  }, [rawRecords, selectedSource]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      if (selectedYear !== "all" && String(record.year) !== selectedYear)
        return false;
      if (
        selectedPortfolio !== "all" &&
        record.innovation_management_portfolio !== selectedPortfolio
      )
        return false;
      if (
        selectedCategory !== "all" &&
        record.innovation_category !== selectedCategory
      )
        return false;
      return true;
    });
  }, [allRecords, selectedYear, selectedPortfolio, selectedCategory]);

  // Summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ORDER.forEach((s) => (counts[s] = 0));
    filteredRecords.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [filteredRecords]);

  // Chart data: group by year, stack by status
  const chartData = useMemo(() => {
    const years = [...new Set(allRecords.map((r) => r.year))].sort();
    return years.map((year) => {
      const yearRecords = filteredRecords.filter(
        (r) => r.year === year
      );
      const row: Record<string, number | string> = {
        year: String(year),
      };
      const total = yearRecords.length;
      STATUS_ORDER.forEach((status) => {
        const count = yearRecords.filter((r) => r.status === status).length;
        row[status] = chartMode === "%" && total > 0 ? Math.round((count / total) * 100) : count;
      });
      return row;
    });
  }, [allRecords, filteredRecords, chartMode]);

  // Available years for current source
  const years = useMemo(
    () => [...new Set(allRecords.map((r) => r.year))].sort(),
    [allRecords]
  );

  // Available portfolios for current source
  const availablePortfolios = useMemo(
    () => [...new Set(allRecords.map((r) => r.innovation_management_portfolio).filter(Boolean))].sort(),
    [allRecords]
  );

  // Available categories for current source
  const availableCategories = useMemo(
    () => [...new Set(allRecords.map((r) => r.innovation_category).filter(Boolean))].sort(),
    [allRecords]
  );

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: selectedSource === "all" ? "30%" : "35%",
    },
    ...(selectedSource === "all"
      ? [
        {
          title: "Source",
          dataIndex: "source",
          key: "source",
          width: "12%",
          render: (src: string) => (
            <Tag
              style={{
                background: mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                border: `1px solid ${token.colorBorder}`,
                color: token.colorText,
              }}
            >
              {src === "top-down" ? "🏛️ Top-Down" : "💡 Bottom-Up"}
            </Tag>
          ),
        },
      ]
      : []),
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: "10%",
      sorter: (a: Innovation, b: Innovation) =>
        a.year - b.year,
      render: (year: number) => (
        <Tag
          style={{
            background: mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6",
            border: `1px solid ${token.colorBorder}`,
            color: token.colorText,
          }}
        >
          {year}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      filters: STATUS_ORDER.map((s) => ({ text: s, value: s })),
      onFilter: (value: unknown, record: Innovation) =>
        record.status === value,
      render: (status: string) => (
        <Tag
          color={STATUS_COLORS[status]}
          style={{
            fontWeight: 600,
            borderRadius: 12,
            padding: "2px 12px",
          }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Portfolio",
      dataIndex: "innovation_management_portfolio",
      key: "portfolio",
      width: "15%",
      render: (portfolio: string) => (
        <Tag
          color={PORTFOLIO_COLORS[portfolio] || "#888"}
          style={{ borderRadius: 12, padding: "2px 12px" }}
        >
          {portfolio}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "innovation_category",
      key: "category",
      width: "15%",
      render: (category: string) => (
        <Tag
          color={CATEGORY_COLORS[category] || "#888"}
          style={{ borderRadius: 12, padding: "2px 12px" }}
        >
          {category}
        </Tag>
      ),
    },
  ];

  // Helper to build URL with query params
  const buildStatusUrl = (slug: string) => {
    const params = new URLSearchParams();
    if (selectedSource !== "all") params.set("source", selectedSource);
    if (selectedYear !== "all") params.set("year", selectedYear);
    if (selectedPortfolio !== "all") params.set("portfolio", selectedPortfolio);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    const queryString = params.toString();
    return `/status/${slug}${queryString ? `?${queryString}` : ""}`;
  };

  const summaryCards = [
    {
      title: "Total Innovations",
      slug: "all",
      count: filteredRecords.length,
      color: token.colorPrimary,
      icon: "📊",
      isTotal: true,
    },
    {
      title: "In Progress",
      slug: "in-progress",
      count: statusCounts["In Progress"] || 0,
      color: STATUS_COLORS["In Progress"],
      icon: "⚙️",
      isTotal: false,
    },
    {
      title: "Done",
      slug: "done",
      count: statusCounts["Done"] || 0,
      color: STATUS_COLORS["Done"],
      icon: "🚀",
      isTotal: false,
    },
    {
      title: "Terminated",
      slug: "terminated",
      count: statusCounts["Terminated"] || 0,
      color: STATUS_COLORS["Terminated"],
      icon: "❌",
      isTotal: false,
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Top Source Mode & Filter Bar */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
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
          {/* Source Overview Segmented Controls */}
          <Space>
            <Text style={{ color: token.colorTextSecondary, fontWeight: 600, fontSize: 13 }}>
              Overview:
            </Text>
            <Segmented
              value={selectedSource}
              onChange={(val) => handleSourceChange(String(val))}
              options={[
                { label: "🌐 All Innovations", value: "all" },
                { label: "🏛️ Top-Down", value: "topdown" },
                { label: "💡 Bottom-Up", value: "bottomup" },
              ]}
              style={{
                background: mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                fontWeight: 500,
              }}
            />
          </Space>

          {/* Slicing Filters */}
          <Space wrap size="middle">
            <Space>
              <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>Year</Text>
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                style={{ width: 120 }}
                options={[
                  { label: "All Years", value: "all" },
                  ...years.map((y) => ({ label: String(y), value: String(y) })),
                ]}
              />
            </Space>
            <Space>
              <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>Portfolio</Text>
              <Select
                value={selectedPortfolio}
                onChange={handlePortfolioChange}
                style={{ width: 130 }}
                options={[
                  { label: "All", value: "all" },
                  ...availablePortfolios.map((p) => ({ label: p, value: p })),
                ]}
              />
            </Space>
            <Space>
              <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>Category</Text>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ width: 130 }}
                options={[
                  { label: "All", value: "all" },
                  ...availableCategories.map((c) => ({ label: c, value: c })),
                ]}
              />
            </Space>
          </Space>
        </div>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {summaryCards.map((card) => (
          <Col xs={24} sm={12} md={6} key={card.title}>
            <Card
              hoverable
              onClick={() => {
                if (!card.isTotal) {
                  navigate(buildStatusUrl(card.slug));
                }
              }}
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderLeft: `4px solid ${card.color}`,
                transition: "all 0.3s ease",
                cursor: card.isTotal ? "default" : "pointer",
              }}
              styles={{
                body: { padding: "16px 20px" },
              }}
            >
              <Text
                style={{
                  color: token.colorTextSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {card.icon} {card.title}
              </Text>
              <Title
                level={2}
                style={{
                  color: card.color,
                  margin: "4px 0 0",
                  fontWeight: 700,
                  fontSize: 36,
                }}
              >
                {card.count}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart */}
      <Card
        title={
          <span style={{ color: token.colorText, fontWeight: 600 }}>
            Innovation Projects by Year
          </span>
        }
        extra={
          <Segmented
            options={["Projects", "%"]}
            value={chartMode}
            onChange={(val) => setChartMode(val as string)}
            size="small"
          />
        }
        style={{
          marginBottom: 20,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
        }}
        styles={{
          body: { padding: "16px 16px 8px" },
        }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: token.colorTextSecondary, fontSize: 13 }}
              axisLine={{ stroke: token.colorBorder }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                background: token.colorBgElevated,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                color: token.colorText,
                boxShadow: mode === "dark" ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.1)",
              }}
              itemStyle={{ color: token.colorText }}
              labelStyle={{ color: token.colorText, fontWeight: 600 }}
              formatter={(value: unknown) =>
                chartMode === "%" ? `${value}%` : String(value)
              }
            />
            <Legend
              wrapperStyle={{ color: "#999", paddingTop: 8 }}
              iconType="circle"
              iconSize={10}
            />
            {STATUS_ORDER.map((status, idx) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="stack"
                fill={STATUS_COLORS[status]}
                radius={
                  idx === STATUS_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card
        title={
          <span style={{ color: token.colorText, fontWeight: 600 }}>
            All Innovation Projects
          </span>
        }
        extra={
          <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
            {filteredRecords.length} projects
          </Text>
        }
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
        }}
      >
        <Table
          dataSource={filteredRecords}
          columns={columns as any}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
          style={{ marginTop: -8 }}
        />
      </Card>
    </div>
  );
};
