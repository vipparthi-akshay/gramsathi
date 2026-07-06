import { create } from "zustand";

export interface KPI {
  label: string;
  value: number;
  trend: number;
  trendDirection: "up" | "down";
  icon: string;
  color: string;
}

export interface RealtimeMetric {
  id: string;
  label: string;
  value: number;
  timestamp: string;
  type: "application" | "grievance" | "verification";
}

export interface TrendPoint {
  date: string;
  applications: number;
  approvals: number;
  rejections: number;
}

export interface DashboardFilters {
  dateRange: [string, string];
  state: string;
  district: string;
  scheme: string;
}

interface DashboardState {
  kpis: KPI[];
  realtimeMetrics: RealtimeMetric[];
  trendData: TrendPoint[];
  filters: DashboardFilters;
  loading: boolean;
  fetchOverview: () => Promise<void>;
  fetchRealtime: () => Promise<void>;
  fetchTrends: () => Promise<void>;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: ["", ""],
  state: "",
  district: "",
  scheme: "",
};

export const useDashboardStore = create<DashboardState>((set) => ({
  kpis: [],
  realtimeMetrics: [],
  trendData: [],
  filters: defaultFilters,
  loading: false,

  fetchOverview: async () => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 600));
    set({
      kpis: [
        {
          label: "Total Applications",
          value: 2847,
          trend: 12.5,
          trendDirection: "up",
          icon: "description",
          color: "#1565C0",
        },
        {
          label: "Approved",
          value: 1892,
          trend: 8.3,
          trendDirection: "up",
          icon: "check_circle",
          color: "#2E7D32",
        },
        {
          label: "Pending Review",
          value: 643,
          trend: -3.2,
          trendDirection: "down",
          icon: "hourglass_empty",
          color: "#F57F17",
        },
        {
          label: "Benefits Disbursed (₹)",
          value: 12500000,
          trend: 15.7,
          trendDirection: "up",
          icon: "account_balance",
          color: "#0288D1",
        },
      ],
      loading: false,
    });
  },

  fetchRealtime: async () => {
    await new Promise((r) => setTimeout(r, 400));
    set({
      realtimeMetrics: [
        {
          id: "1",
          label: "New Application",
          value: 3,
          timestamp: new Date().toISOString(),
          type: "application",
        },
        {
          id: "2",
          label: "Grievance Filed",
          value: 1,
          timestamp: new Date().toISOString(),
          type: "grievance",
        },
        {
          id: "3",
          label: "Aadhaar Verified",
          value: 5,
          timestamp: new Date().toISOString(),
          type: "verification",
        },
      ],
    });
  },

  fetchTrends: async () => {
    await new Promise((r) => setTimeout(r, 500));
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    set({
      trendData: days.map((day) => ({
        date: day,
        applications: Math.floor(80 + Math.random() * 120),
        approvals: Math.floor(40 + Math.random() * 80),
        rejections: Math.floor(5 + Math.random() * 20),
      })),
    });
  },

  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  clearFilters: () => set({ filters: defaultFilters }),
}));
