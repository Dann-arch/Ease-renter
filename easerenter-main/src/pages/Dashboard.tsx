import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const formatKES = (value: number) => `${(value / 1000000).toFixed(1)}M`;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [propertyCount, setPropertyCount] = useState(0);
  const [tenantCount, setTenantCount] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalArrears, setTotalArrears] = useState(0);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; collected: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [propRes, tenantRes, paymentRes, arrearsRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("payments").select("amount").eq("status", "completed"),
        supabase.from("tenants").select("balance").gt("balance", 0),
      ]);

      setPropertyCount(propRes.count ?? 0);
      setTenantCount(tenantRes.count ?? 0);
      setTotalCollected(
        paymentRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
      );
      setTotalArrears(
        arrearsRes.data?.reduce((sum, t) => sum + Number(t.balance), 0) ?? 0
      );

      // Build monthly revenue from payments
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, paid_at, status")
        .order("paid_at", { ascending: true });

      if (payments && payments.length > 0) {
        const monthMap: Record<string, { revenue: number; collected: number }> = {};
        payments.forEach((p) => {
          const d = new Date(p.paid_at);
          const key = d.toLocaleString("en", { month: "short", year: "2-digit" });
          if (!monthMap[key]) monthMap[key] = { revenue: 0, collected: 0 };
          monthMap[key].revenue += Number(p.amount);
          if (p.status === "completed") monthMap[key].collected += Number(p.amount);
        });
        setRevenueData(
          Object.entries(monthMap).map(([month, data]) => ({ month, ...data }))
        );
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `KES ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `KES ${(val / 1000).toFixed(0)}K`;
    return `KES ${val}`;
  };

  const stats = [
    { label: "Total Properties", value: String(propertyCount), icon: Building2, iconBg: "bg-primary/15", iconColor: "text-primary", gradient: "from-primary/20 to-warning/10" },
    { label: "Active Tenants", value: String(tenantCount), icon: Users, iconBg: "bg-accent/15", iconColor: "text-accent", gradient: "from-accent/20 to-accent/5" },
    { label: "Rent Collected", value: formatAmount(totalCollected), icon: Wallet, iconBg: "bg-success/15", iconColor: "text-success", gradient: "from-success/20 to-success/5" },
    { label: "Outstanding Arrears", value: formatAmount(totalArrears), icon: AlertTriangle, iconBg: "bg-warning/15", iconColor: "text-warning", gradient: "from-warning/20 to-warning/5" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your property overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden border-none shadow-md">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {revenueData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <Badge variant="secondary" className="text-xs">Payment history</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(32, 80%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(32, 80%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145, 60%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(145, 60%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tickFormatter={formatKES} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip formatter={(value: number) => `KES ${(value / 1000).toFixed(0)}K`} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(32, 80%, 50%)" fill="url(#revenueGrad)" strokeWidth={2} name="Total" />
                  <Area type="monotone" dataKey="collected" stroke="hsl(145, 60%, 40%)" fill="url(#collectedGrad)" strokeWidth={2} name="Collected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {propertyCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No properties yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Head to the Properties page to add your first property.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
