import React from "react";
import RecruiterSidebar from "@/components/RecruiterSidebar";
import RecruiterNavbar from "@/components/RecruiterNavbar";
import { recruiterNav } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session || session.role !== "recruiter") {
    redirect("/recruiter/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RecruiterSidebar navItems={recruiterNav} />
      <div className="lg:pl-[260px] transition-all duration-300">
        <RecruiterNavbar
          userName={session.name || "Recruiter"}
          avatarInitials={
            session.name
              ? session.name
                  .split(' ')
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : "RE"
          }
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
