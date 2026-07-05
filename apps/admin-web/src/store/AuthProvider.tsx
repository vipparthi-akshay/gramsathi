import { useAuth } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated && !user) {
    const storedToken = localStorage.getItem("gramSathiToken");
    const storedUser = localStorage.getItem("gramSathiUser");
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        useAuth.setState({
          user: parsed,
          token: storedToken,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem("gramSathiToken");
        localStorage.removeItem("gramSathiUser");
      }
    }
  }

  return <>{children}</>;
}
