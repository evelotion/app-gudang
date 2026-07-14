import Sidebar from "@/components/Sidebar";
import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Cukup panggil Sidebar tanpa prop user */}
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}