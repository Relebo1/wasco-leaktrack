"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ReporterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = pathname === "/login" || pathname === "/register";

  if (noSidebar) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
