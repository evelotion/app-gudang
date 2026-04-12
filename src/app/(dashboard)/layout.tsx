import Sidebar from "@/components/Sidebar";
import { getSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Ambil session langsung di server, jadi nggak perlu nunggu loading di client
  const session = await getSession();

  // 2. Kalau entah kenapa lolos dari middleware, jaga-jaga tendang ke login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 3. Lempar data session sebagai props ke Sidebar */}
      <Sidebar user={session} />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}