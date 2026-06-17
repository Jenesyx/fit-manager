import { requireProfile, canManageCourses } from "@/lib/auth";
import { Sidebar } from "@/components/portal/sidebar";
import { Topbar } from "@/components/portal/topbar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-svh">
      <Sidebar role={profile.role} canManage={canManageCourses(profile)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-x-hidden px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
