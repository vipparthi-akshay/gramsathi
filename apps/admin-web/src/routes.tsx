import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Schemes = lazy(() => import("@/pages/Schemes"));
const SchemeForm = lazy(() => import("@/pages/SchemeForm"));
const Applications = lazy(() => import("@/pages/Applications"));
const ApplicationReview = lazy(() => import("@/pages/ApplicationReview"));
const Grievances = lazy(() => import("@/pages/Grievances"));
const GrievanceDetail = lazy(() => import("@/pages/GrievanceDetail"));
const Citizens = lazy(() => import("@/pages/Citizens"));
const CitizenDetail = lazy(() => import("@/pages/CitizenDetail"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Users = lazy(() => import("@/pages/Users"));
const Settings = lazy(() => import("@/pages/Settings"));

export type UserRole = "citizen" | "officer" | "admin" | "super_admin";

export interface RouteConfig extends Omit<RouteObject, "children"> {
  path: string;
  label?: string;
  icon?: string;
  roles?: UserRole[];
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  { path: "/login", element: <Login />, label: "Login" },
  {
    path: "/",
    label: "Dashboard",
    icon: "dashboard",
    roles: ["officer", "admin", "super_admin"],
    children: [
      { path: "", element: <Dashboard />, label: "Overview", icon: "overview" },
    ],
  },
  {
    path: "/schemes",
    element: <Schemes />,
    label: "Schemes",
    icon: "assignment",
    roles: ["officer", "admin", "super_admin"],
  },
  {
    path: "/schemes/new",
    element: <SchemeForm />,
    label: "New Scheme",
    icon: "add_circle",
    roles: ["admin", "super_admin"],
  },
  {
    path: "/schemes/:id/edit",
    element: <SchemeForm />,
    label: "Edit Scheme",
    roles: ["admin", "super_admin"],
  },
  {
    path: "/applications",
    label: "Applications",
    icon: "description",
    roles: ["officer", "admin", "super_admin"],
    children: [
      { path: "", element: <Applications />, label: "All Applications" },
      { path: ":id", element: <ApplicationReview />, label: "Review" },
    ],
  },
  {
    path: "/grievances",
    label: "Grievances",
    icon: "feedback",
    roles: ["officer", "admin", "super_admin"],
    children: [
      { path: "", element: <Grievances />, label: "All Grievances" },
      { path: ":id", element: <GrievanceDetail />, label: "Grievance Detail" },
    ],
  },
  {
    path: "/citizens",
    label: "Citizens",
    icon: "people",
    roles: ["officer", "admin", "super_admin"],
    children: [
      { path: "", element: <Citizens />, label: "All Citizens" },
      { path: ":id", element: <CitizenDetail />, label: "Citizen Detail" },
    ],
  },
  {
    path: "/analytics",
    element: <Analytics />,
    label: "Analytics",
    icon: "bar_chart",
    roles: ["admin", "super_admin"],
  },
  {
    path: "/users",
    element: <Users />,
    label: "Users",
    icon: "admin_panel_settings",
    roles: ["super_admin"],
  },
  {
    path: "/settings",
    element: <Settings />,
    label: "Settings",
    icon: "settings",
    roles: ["officer", "admin", "super_admin"],
  },
];

export function getRoleRoutes(role: UserRole): RouteConfig[] {
  return routes.filter((route) => {
    if (!route.roles) return true;
    return route.roles.includes(role);
  });
}
