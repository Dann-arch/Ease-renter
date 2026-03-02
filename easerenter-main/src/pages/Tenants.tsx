import { useEffect, useState } from "react";
import { Plus, Search, Phone, Mail, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Tenant = Tables<"tenants"> & { properties?: { name: string } | null };

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTenant, setNewTenant] = useState({ full_name: "", phone: "", email: "", property_id: "", unit_number: "", rent_amount: "" });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [tenantRes, propRes] = await Promise.all([
      supabase.from("tenants").select("*, properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name"),
    ]);
    setTenants((tenantRes.data as Tenant[]) ?? []);
    setProperties(propRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!newTenant.full_name || !newTenant.property_id) return;
    setSubmitting(true);
    const { error } = await supabase.from("tenants").insert({
      full_name: newTenant.full_name,
      phone: newTenant.phone || null,
      email: newTenant.email || null,
      property_id: newTenant.property_id,
      unit_number: newTenant.unit_number || null,
      rent_amount: parseFloat(newTenant.rent_amount) || 0,
    });
    if (error) {
      toast({ title: "Error adding tenant", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tenant added successfully" });
      setNewTenant({ full_name: "", phone: "", email: "", property_id: "", unit_number: "", rent_amount: "" });
      setDialogOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const filtered = tenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.properties?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.unit_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success hover:bg-success/20";
      case "notice": return "bg-warning/10 text-warning hover:bg-warning/20";
      default: return "bg-destructive/10 text-destructive hover:bg-destructive/20";
    }
  };

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} tenants across all properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Tenant</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="e.g. Mary Wanjiku" value={newTenant.full_name} onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="0712 345 678" value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="email@example.com" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={newTenant.property_id} onValueChange={(v) => setNewTenant({ ...newTenant, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="B3" value={newTenant.unit_number} onChange={(e) => setNewTenant({ ...newTenant, unit_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent</Label>
                  <Input type="number" placeholder="15000" value={newTenant.rent_amount} onChange={(e) => setNewTenant({ ...newTenant, rent_amount: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tenants by name, property, or unit..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {tenants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No tenants yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add a property first, then add tenants.</p>
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
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{tenant.full_name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{tenant.phone}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {tenant.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{tenant.phone}</div>}
                        {tenant.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{tenant.email}</div>}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{tenant.properties?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{tenant.unit_number ? `Unit ${tenant.unit_number}` : ""}</p>
                      </TableCell>
                      <TableCell className="font-medium">KES {Number(tenant.rent_amount).toLocaleString()}</TableCell>
                      <TableCell className={`font-medium ${Number(tenant.balance) > 0 ? "text-destructive" : "text-success"}`}>
                        KES {Number(tenant.balance).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColor(tenant.status)}>{tenant.status}</Badge>
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

export default Tenants;
