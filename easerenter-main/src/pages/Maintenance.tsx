import { useEffect, useState } from "react";
import { Plus, Wrench, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type MaintReq = Tables<"maintenance_requests"> & { properties?: { name: string } | null };

const Maintenance = () => {
  const [requests, setRequests] = useState<MaintReq[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("All");
  const [newReq, setNewReq] = useState({ title: "", description: "", property_id: "", priority: "medium" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [reqRes, propRes] = await Promise.all([
      supabase.from("maintenance_requests").select("*, properties(name)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, name"),
    ]);
    setRequests((reqRes.data as MaintReq[]) ?? []);
    setProperties(propRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!newReq.title || !newReq.property_id) return;
    setSubmitting(true);
    const { error } = await supabase.from("maintenance_requests").insert({
      title: newReq.title,
      description: newReq.description || null,
      property_id: newReq.property_id,
      priority: newReq.priority,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted" });
      setNewReq({ title: "", description: "", property_id: "", priority: "medium" });
      setDialogOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const filtered = filter === "All" ? requests : requests.filter((r) => r.status === filter.toLowerCase());

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "pending").length,
    "In Progress": requests.filter((r) => r.status === "in_progress").length,
    Resolved: requests.filter((r) => r.status === "resolved").length,
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-destructive/10 text-destructive";
      case "high": return "bg-warning/10 text-warning";
      case "medium": return "bg-primary/10 text-primary";
      case "low": return "bg-muted text-muted-foreground";
      default: return "";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "pending": return <AlertCircle className="h-4 w-4 text-warning" />;
      case "in_progress": return <Clock className="h-4 w-4 text-primary" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4 text-success" />;
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
          <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Track and manage maintenance requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Leaking pipe" value={newReq.title} onChange={(e) => setNewReq({ ...newReq, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={newReq.property_id} onValueChange={(v) => setNewReq({ ...newReq, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newReq.priority} onValueChange={(v) => setNewReq({ ...newReq, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the issue..." value={newReq.description} onChange={(e) => setNewReq({ ...newReq, description: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {(["All", "Pending", "In Progress", "Resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No maintenance requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">Submit a request when something needs fixing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {statusIcon(req.status)}
                      <h3 className="font-medium text-foreground">{req.title} — {req.properties?.name ?? "Unknown"}</h3>
                    </div>
                    {req.description && <p className="mt-1 text-sm text-muted-foreground">{req.description}</p>}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={priorityColor(req.priority)}>{req.priority}</Badge>
                    {req.status !== "resolved" && (
                      <Select value={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Maintenance;
