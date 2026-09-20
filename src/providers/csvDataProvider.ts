import type { DataProvider, Pagination } from "@refinedev/core";
import type { Innovation } from "../types";

let cachedTopDown: Innovation[] | null = null;
let cachedBottomUp: Innovation[] | null = null;
let cachedAll: Innovation[] | null = null;

// RFC-compliant CSV parser that handles quotes, commas, and newlines inside quoted fields
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = "";
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function fetchTopDown(): Promise<Innovation[]> {
  if (cachedTopDown) return cachedTopDown;

  const response = await fetch(`${import.meta.env.BASE_URL}data/topdown-innovation.csv`);
  const text = await response.text();
  const rows = parseCSVText(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const data: Innovation[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowValues = rows[i];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = rowValues[idx] ?? "";
    });

    const yearVal = parseInt(row["year"] || row["finished_year"] || "0", 10);
    const rawStatus = row["status"] || "In Progress";
    let status: Innovation["status"] = "In Progress";
    if (rawStatus.toLowerCase() === "done" || rawStatus.toLowerCase() === "launch") {
      status = "Done";
    } else if (
      rawStatus.toLowerCase() === "terminated" ||
      rawStatus.toLowerCase() === "rejected"
    ) {
      status = "Terminated";
    }

    let portfolio = (row["innovation_management_portfolio"] || "Core").trim();
    if (portfolio.toLowerCase() === "tranformation") {
      portfolio = "Transformation";
    }

    data.push({
      id: parseInt(row["id"] || String(i), 10),
      name: row["name"] || "",
      year: yearVal,
      status,
      innovation_management_portfolio: portfolio,
      innovation_category: row["innovation_category"] || "Product",
      source: "top-down",
    });
  }

  cachedTopDown = data;
  return data;
}

async function fetchBottomUp(): Promise<Innovation[]> {
  if (cachedBottomUp) return cachedBottomUp;

  const response = await fetch(`${import.meta.env.BASE_URL}data/bottom-up-innovation.csv`);
  const text = await response.text();
  const rows = parseCSVText(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const data: Innovation[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowValues = rows[i];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = rowValues[idx] ?? "";
    });

    const yearVal = parseInt(row["year"] || "0", 10);
    const rawStatus = row["status"] || "In Progress";
    let status: Innovation["status"] = "In Progress";
    if (rawStatus.toLowerCase() === "done" || rawStatus.toLowerCase() === "launch") {
      status = "Done";
    } else if (
      rawStatus.toLowerCase() === "terminated" ||
      rawStatus.toLowerCase() === "rejected"
    ) {
      status = "Terminated";
    }

    let portfolio = (row["innovation_management_portfolio"] || "Core").trim();
    if (portfolio.toLowerCase() === "tranformation") {
      portfolio = "Transformation";
    }

    data.push({
      id: parseInt(row["id"] || String(i), 10),
      name: row["name"] || "",
      year: yearVal,
      status,
      innovation_management_portfolio: portfolio,
      innovation_category: row["innovation_category"] || "Product",
      source: "bottom-up",
      description: row["description"] || "",
      responsible_department: row["ผู้รับผิดชอบ/สำนัก"] || "",
      submitter_info: row["ผู้เติมข้อมูล / วันที่"] || "",
    });
  }

  cachedBottomUp = data;
  return data;
}

async function fetchAllInnovations(): Promise<Innovation[]> {
  if (cachedAll) return cachedAll;
  const [topdown, bottomup] = await Promise.all([fetchTopDown(), fetchBottomUp()]);
  cachedAll = [...topdown, ...bottomup];
  return cachedAll;
}

async function getDataForResource(resource: string): Promise<Innovation[]> {
  if (resource === "topdown-innovations") {
    return fetchTopDown();
  }
  if (resource === "bottomup-innovations") {
    return fetchBottomUp();
  }
  return fetchAllInnovations();
}

export const csvDataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    let data = await getDataForResource(resource);

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
          const aVal = a[sorter.field as keyof Innovation] ?? "";
          const bVal = b[sorter.field as keyof Innovation] ?? "";
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

  getOne: async ({ resource, id }) => {
    const data = await getDataForResource(resource);
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
