import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { meApi } from "@/api/authApi";

export default function AdminOnlyRoute() {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      try {
        const result = await meApi();

        if (!mounted) return;

        if (!result.ok) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        const me = result.data?.user || result.data || null;
        const role = String(me?.role || "").toLowerCase();

        setIsAuthenticated(true);
        setIsAdmin(role === "admin");
      } catch (error) {
        if (!mounted) return;

        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
