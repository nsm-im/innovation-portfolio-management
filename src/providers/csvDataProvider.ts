import type { DataProvider, Pagination } from "@refinedev/core";
import type { Innovation } from "../types";

let cachedData: Innovation[] | null = null;

async function fetchCSV(): Promise<Innovation[]> {
  if (cachedData) return cachedData;

  const response = await fetch("/data/topdown-innovation.csv");
  const text = await response.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].replace(/\r/g, "").split(",");

  const data: Innovation[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, "");
    if (!line.trim()) continue;

    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = (values[index] || "").trim();
    });

    data.push({
      id: parseInt(row["id"], 10),
      name: row["name"],
      year: parseInt(row["year"] || row["finished_year"], 10),
      status: row["status"] as Innovation["status"],
      innovation_management_portfolio:
        row["innovation_management_portfolio"] as Innovation["innovation_management_portfolio"],
      innovation_category:
        row["innovation_category"] as Innovation["innovation_category"],
    });
  }

  cachedData = data;
  return data;
}

export const csvDataProvider: DataProvider = {
  getList: async ({ pagination, sorters, filters }) => {
    let data = await fetchCSV();

    // Apply filters
    if (filters && filters.length > 0) {
      data = data.filter((item) => {
        return filters.every((filter) => {
          if ("field" in filter && filter.field && filter.value !== undefined && filter.value !== null && filter.value !== "") {
            const fieldValue = String(
              item[filter.field as keyof Innovation] ?? ""
            );
            const filterValue = String(filter.value);

            switch (filter.operator) {
              case "eq":
                return fieldValue === filterValue;
              case "ne":
                return fieldValue !== filterValue;
              case "contains":
                return fieldValue
                  .toLowerCase()
                  .includes(filterValue.toLowerCase());
              case "in":
                return (filter.value as string[]).includes(fieldValue);
              default:
                return true;
            }
          }
          return true;
        });
      });
    }

    // Apply sorters
    if (sorters && sorters.length > 0) {
      data = [...data].sort((a, b) => {
        for (const sorter of sorters) {
          const aVal = a[sorter.field as keyof Innovation];
          const bVal = b[sorter.field as keyof Innovation];
          const direction = sorter.order === "asc" ? 1 : -1;

          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
        }
        return 0;
      });
    }

    const total = data.length;

    // Apply pagination
    if (pagination && pagination.mode !== "off") {
      const current = (pagination as Pagination & { currentPage?: number }).currentPage || 1;
      const pageSize = pagination.pageSize || 10;
      const start = (current - 1) * pageSize;
      data = data.slice(start, start + pageSize);
    }

    return {
      data: data as any,
      total,
    };
  },

  getOne: async ({ id }) => {
    const data = await fetchCSV();
    const record = data.find((item) => item.id === Number(id));
    if (!record) throw new Error(`Record with id ${id} not found`);
    return { data: record as any };
  },

  // Required methods (not used in read-only dashboard)
  create: async () => {
    throw new Error("Not implemented");
  },
  update: async () => {
    throw new Error("Not implemented");
  },
  deleteOne: async () => {
    throw new Error("Not implemented");
  },
  getApiUrl: () => "",
};
