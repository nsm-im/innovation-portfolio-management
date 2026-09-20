import React, { useMemo, useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useNavigate, useSearchParams } from "react-router";
import { Card, Col, Row, Select, Table, Tag, Typography, Space, Segmented } from "antd";
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

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
    setSelectedYear(searchParams.get("year") || "all");
    setSelectedPortfolio(searchParams.get("portfolio") || "all");
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

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

  const allRecords = useMemo(() => (result?.data ?? []) as Innovation[], [result]);
  const isLoading = query?.isLoading ?? false;

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

  // Available years
  const years = useMemo(
    () => [...new Set(allRecords.map((r) => r.year))].sort(),
    [allRecords]
  );

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: "35%",
    },
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
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e0e0e0",
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
      width: "18%",
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
          color={PORTFOLIO_COLORS[portfolio]}
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
          color={CATEGORY_COLORS[category]}
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
    if (selectedYear !== "all") params.set("year", selectedYear);
    if (selectedPortfolio !== "all") params.set("portfolio", selectedPortfolio);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    const queryString = params.toString();
    return `/status/${slug}${queryString ? `?${queryString}` : ""}`;
  };

  const summaryCards = [
    {
      title: "In Progress",
      slug: "in-progress",
      count: statusCounts["In Progress"] || 0,
      color: STATUS_COLORS["In Progress"],
      icon: "⚙️",
    },
    {
      title: "Done",
      slug: "done",
      count: statusCounts["Done"] || 0,
      color: STATUS_COLORS["Done"],
      icon: "🚀",
    },
    {
      title: "Rejected",
      slug: "rejected",
      count: statusCounts["Rejected"] || 0,
      color: STATUS_COLORS["Rejected"],
      icon: "❌",
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Filter Bar */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Space wrap size="middle">
          <Space>
            <Text style={{ color: "#999", fontSize: 13 }}>Year</Text>
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
            <Text style={{ color: "#999", fontSize: 13 }}>Portfolio</Text>
            <Select
              value={selectedPortfolio}
              onChange={handlePortfolioChange}
              style={{ width: 130 }}
              options={[
                { label: "All", value: "all" },
                { label: "Core", value: "Core" },
                { label: "Adjacent", value: "Adjacent" },
              ]}
            />
          </Space>
          <Space>
            <Text style={{ color: "#999", fontSize: 13 }}>Category</Text>
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              style={{ width: 130 }}
              options={[
                { label: "All", value: "all" },
                { label: "Service", value: "Service" },
                { label: "Product", value: "Product" },
                { label: "Process", value: "Process" },
              ]}
            />
          </Space>
        </Space>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {summaryCards.map((card) => (
          <Col xs={24} sm={8} md={8} key={card.title}>
            <Card
              hoverable
              onClick={() => navigate(buildStatusUrl(card.slug))}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderLeft: `4px solid ${card.color}`,
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              styles={{
                body: { padding: "16px 20px" },
              }}
            >
              <Text
                style={{
                  color: "#888",
                  fontSize: 12,
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
          <span style={{ color: "#e0e0e0", fontWeight: 600 }}>
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
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        styles={{
          body: { padding: "16px 16px 8px" },
        }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: "#999", fontSize: 13 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#999", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1f1f1f",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                color: "#e0e0e0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#e0e0e0" }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
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
          <span style={{ color: "#e0e0e0", fontWeight: 600 }}>
            All Innovation Projects
          </span>
        }
        extra={
          <Text style={{ color: "#888", fontSize: 13 }}>
            {filteredRecords.length} projects
          </Text>
        }
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
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
