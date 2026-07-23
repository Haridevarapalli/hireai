import React from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { candidateNav } from "@/lib/data";
import { getUserSession } from "@/actions/authActions";
import { redirect } from "next/navigation";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();
  
  if (!session || session.role !== "candidate") {
    redirect("/candidate/login");
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Sidebar navItems={candidateNav} userType="candidate" />
      <div className="lg:pl-[260px] transition-all duration-300">
        <Navbar
          userName={session.name || "Candidate"}
          userRole="candidate"
          avatarInitials={session.name ? session.name.substring(0, 2).toUpperCase() : "CA"}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
