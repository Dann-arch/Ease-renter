import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Wrench,
  LogOut,
  Menu,
  ChevronRight,
  Home as HomeIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const allNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "property_manager", "property_owner", "field_officer"] },
  { path: "/properties", label: "Properties", icon: Building2, roles: ["super_admin", "property_manager", "property_owner", "field_officer"] },
  { path: "/tenants", label: "Tenants", icon: Users, roles: ["super_admin", "property_manager", "property_owner"] },
  { path: "/payments", label: "Payments", icon: Wallet, roles: ["super_admin", "property_manager", "property_owner"] },
  { path: "/maintenance", label: "Maintenance", icon: Wrench, roles: ["super_admin", "property_manager", "property_owner", "field_officer"] },
];

const SidebarContent = ({
  navItems,
  location,
  onNavigate,
  userRole,
  initials,
  onSignOut,
}: {
  navItems: typeof allNavItems;
  location: ReturnType<typeof useLocation>;
  onNavigate: () => void;
  userRole: string | null;
  initials: string;
  onSignOut: () => void;
}) => (
  <>
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
        <HomeIcon className="h-5 w-5 text-sidebar-primary-foreground" />
      </div>
      <div>
        <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">EASE RENTER</h1>
        <p className="text-xs text-sidebar-foreground/60">
          {userRole ? userRole.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Kenya Edition"}
        </p>
      </div>
    </div>

    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>

    <div className="border-t border-sidebar-border p-3">
      <button
        onClick={onSignOut}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4.5 w-4.5" />
        Sign Out
      </button>
    </div>
  </>
);

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const navItems = allNavItems.filter(
    (item) => !userRole || item.roles.includes(userRole)
  );

  const currentPage = navItems.find((item) => item.path === location.pathname);
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarContent
          navItems={navItems}
          location={location}
          onNavigate={() => {}}
          userRole={userRole}
          initials={initials}
          onSignOut={handleSignOut}
        />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
            >
              <SidebarContent
                navItems={navItems}
                location={location}
                onNavigate={closeSidebar}
                userRole={userRole}
                initials={initials}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>EASE RENTER</span>
            {currentPage && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
