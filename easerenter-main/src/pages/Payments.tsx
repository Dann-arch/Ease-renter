import { useEffect, useState } from "react";
import {
  Wallet, Search, Download, CheckCircle2, Clock, XCircle, Smartphone, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Payment = Tables<"payments"> & {
  tenants?: { full_name: string } | null;
  properties?: { name: string } | null;
};

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("payments")
        .select("*, tenants(full_name), properties(name)")
        .order("paid_at", { ascending: false });
      setPayments((data as Payment[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalCollected = payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalFailed = payments.filter((p) => p.status === "failed").reduce((s, p) => s + Number(p.amount), 0);

  const summaryStats = [
    { label: "Total Collected", value: `KES ${totalCollected.toLocaleString()}`, icon: Wallet, color: "text-success", bg: "bg-success/10" },
    { label: "Pending", value: `KES ${totalPending.toLocaleString()}`, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Failed", value: `KES ${totalFailed.toLocaleString()}`, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const filtered = payments.filter(
    (p) =>
      (p.tenants?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.transaction_ref ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "pending": return <Clock className="h-4 w-4 text-warning" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">M-Pesa transaction history</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-3 ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <Smartphone className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-medium text-foreground">M-Pesa Daraja API Integration</p>
          <p className="text-xs text-muted-foreground">Payments are processed via Safaricom STK Push.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by tenant or M-Pesa code..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {payments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No payments yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Payments will appear here once recorded.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="hidden md:table-cell">Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">M-Pesa Code</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{p.tenants?.full_name ?? "—"}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{p.properties?.name ?? "—"}</p>
                      </TableCell>
                      <TableCell className="font-semibold">KES {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{p.transaction_ref ?? "—"}</code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(p.paid_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(p.status)}
                          <span className="text-sm capitalize">{p.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Payments;
