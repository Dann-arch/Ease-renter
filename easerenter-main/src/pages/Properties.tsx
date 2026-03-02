import { useEffect, useState } from "react";
import { Building2, Plus, MapPin, Home, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties">;

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProp, setNewProp] = useState({ name: "", address: "", total_units: "", property_type: "", monthly_rent: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading properties", description: error.message, variant: "destructive" });
    } else {
      setProperties(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleAdd = async () => {
    if (!newProp.name || !newProp.address) return;
    setSubmitting(true);
    const { error } = await supabase.from("properties").insert({
      name: newProp.name,
      address: newProp.address,
      total_units: parseInt(newProp.total_units) || 1,
      property_type: newProp.property_type || "residential",
      monthly_rent: parseFloat(newProp.monthly_rent) || 0,
      owner_id: user?.id,
    });
    if (error) {
      toast({ title: "Error adding property", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Property added successfully" });
      setNewProp({ name: "", address: "", total_units: "", property_type: "", monthly_rent: "" });
      setDialogOpen(false);
      fetchProperties();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-sm text-muted-foreground">Manage your {properties.length} properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Property</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Property</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Property Name</Label>
                <Input placeholder="e.g. Sunset Apartments" value={newProp.name} onChange={(e) => setNewProp({ ...newProp, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="e.g. Kilimani, Nairobi" value={newProp.address} onChange={(e) => setNewProp({ ...newProp, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Units</Label>
                  <Input type="number" placeholder="24" value={newProp.total_units} onChange={(e) => setNewProp({ ...newProp, total_units: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input placeholder="residential" value={newProp.property_type} onChange={(e) => setNewProp({ ...newProp, property_type: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent</Label>
                  <Input type="number" placeholder="15000" value={newProp.monthly_rent} onChange={(e) => setNewProp({ ...newProp, monthly_rent: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Property
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No properties yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Click "Add Property" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-primary to-warning" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{property.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{property.address}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{property.property_type}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <Home className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-lg font-bold text-foreground">{property.total_units}</p>
                    <p className="text-xs text-muted-foreground">Units</p>
                  </div>
                  <div className="text-center">
                    <Building2 className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-lg font-bold text-accent">KES {Number(property.monthly_rent).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Rent/unit</p>
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

export default Properties;
