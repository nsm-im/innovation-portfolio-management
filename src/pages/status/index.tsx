import React, { useMemo, useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Card, Table, Tag, Typography, Button, Space, Empty, Select } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { Innovation } from "../../types";
import {
  STATUS_ORDER,
  STATUS_COLORS,
  PORTFOLIO_COLORS,
  CATEGORY_COLORS,
} from "../../types";

const { Title, Text } = Typography;

// Map URL-safe slug back to actual status name
const SLUG_TO_STATUS: Record<string, string> = {
  "strategic-direction": "Strategic Direction",
  development: "Development",
  "test-implement": "Test/Implement",
  launch: "Launch",
};

const STATUS_ICONS: Record<string, string> = {
  "Strategic Direction": "🎯",
  Development: "⚙️",
  "Test/Implement": "🧪",
  Launch: "🚀",
};

export const StatusListPage: React.FC = () => {
  const { status: statusSlug } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusName = SLUG_TO_STATUS[statusSlug ?? ""] ?? statusSlug ?? "";

  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get("year") || "all"
  );
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>(
    searchParams.get("portfolio") || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );

  useEffect(() => {
    setSelectedYear(searchParams.get("year") || "all");
    setSelectedPortfolio(searchParams.get("portfolio") || "all");
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

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

  const allRecords = useMemo(
    () => (result?.data ?? []) as Innovation[],
    [result]
  );
  const isLoading = query?.isLoading ?? false;

  // Available years from entire dataset
  const availableYears = useMemo(
    () => [...new Set(allRecords.map((r) => r.finished_year))].sort(),
    [allRecords]
  );

  // Filter records by status AND the selected filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (r.status !== statusName) return false;
      if (selectedYear !== "all" && String(r.finished_year) !== selectedYear) return false;
      if (selectedPortfolio !== "all" && r.innovation_management_portfolio !== selectedPortfolio) return false;
      if (selectedCategory !== "all" && r.innovation_category !== selectedCategory) return false;
      return true;
    });
  }, [allRecords, statusName, selectedYear, selectedPortfolio, selectedCategory]);

  // Group by year for display
  const years = useMemo(
    () => [...new Set(filteredRecords.map((r) => r.finished_year))].sort(),
    [filteredRecords]
  );

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: "8%",
      render: (id: number) => (
        <Text style={{ color: "#888", fontFamily: "monospace" }}>#{id}</Text>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Year",
      dataIndex: "finished_year",
      key: "finished_year",
      width: "12%",
      sorter: (a: Innovation, b: Innovation) =>
        a.finished_year - b.finished_year,
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

  const statusColor = STATUS_COLORS[statusName] ?? "#888";

  // Build query param string to preserve filters when navigating
  const currentQueryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Header with back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/${currentQueryString}`)}
          style={{
            color: "#999",
            fontSize: 16,
          }}
        />
        <div>
          <Title
            level={3}
            style={{
              margin: 0,
              color: statusColor,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>{STATUS_ICONS[statusName]}</span>
            {statusName}
          </Title>
          <Text style={{ color: "#888", fontSize: 13 }}>
            {filteredRecords.length} innovation project
            {filteredRecords.length !== 1 ? "s" : ""}
          </Text>
        </div>
      </div>

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
                ...availableYears.map((y) => ({ label: String(y), value: String(y) })),
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

      {/* Status pipeline breadcrumb */}
      <Card
        size="small"
        style={{
          marginBottom: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Space size="small" style={{ display: "flex", flexWrap: "wrap" }}>
          {STATUS_ORDER.map((s, i) => {
            const slug = s.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-");
            const isActive = s === statusName;
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <span style={{ color: "#555", margin: "0 4px" }}>→</span>
                )}
                <Tag
                  style={{
                    cursor: "pointer",
                    background: isActive
                      ? STATUS_COLORS[s]
                      : "rgba(255,255,255,0.04)",
                    color: isActive ? "#fff" : "#888",
                    border: isActive
                      ? "none"
                      : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    padding: "4px 14px",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => navigate(`/status/${slug}${currentQueryString}`)}
                >
                  {s}
                </Tag>
              </React.Fragment>
            );
          })}
        </Space>
      </Card>

      {/* Project list grouped by year */}
      {filteredRecords.length === 0 && !isLoading ? (
        <Card
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Empty
            description={
              <Text style={{ color: "#888" }}>
                No projects found for status "{statusName}" with current filters
              </Text>
            }
          />
        </Card>
      ) : (
        years.map((year) => {
          const yearRecords = filteredRecords.filter(
            (r) => r.finished_year === year
          );
          return (
            <Card
              key={year}
              title={
                <span style={{ color: "#e0e0e0", fontWeight: 600 }}>
                  📅 Year {year}
                </span>
              }
              extra={
                <Text style={{ color: "#888", fontSize: 13 }}>
                  {yearRecords.length} project{yearRecords.length !== 1 ? "s" : ""}
                </Text>
              }
              style={{
                marginBottom: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Table
                dataSource={yearRecords}
                columns={columns as any}
                rowKey="id"
                loading={isLoading}
                pagination={false}
                size="middle"
              />
            </Card>
          );
        })
      )}
    </div>
  );
};
