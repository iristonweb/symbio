import { AdminRouteGuard } from "@/components/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
