import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Shield, Heart, Download, RotateCcw, Wallet, Building2, Plus, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { SubscriptionManagement } from "@/components/settings/SubscriptionManagement";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaidLink } from "@/components/PlaidLink";


const Settings = () => {
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hsaOpenedDate, setHsaOpenedDate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [bankConnections, setBankConnections] = useState<any[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: "", type: "", rewards_rate: 0 });

  useEffect(() => {
    loadUserData();
    loadPaymentMethods();
    loadBankConnections();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setEmail(user.email || "");
      
      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setDisplayName(profile.full_name || "");
        setHsaOpenedDate(profile.hsa_opened_date || "");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the old HSA date to check if it changed
      const { data: oldProfile } = await supabase
        .from("profiles")
        .select("hsa_opened_date")
        .eq("id", user.id)
        .single();

      const oldHsaDate = oldProfile?.hsa_opened_date;
      const hsaDateChanged = oldHsaDate !== hsaOpenedDate;

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: displayName, hsa_opened_date: hsaOpenedDate || null }, { onConflict: "id" });

      if (upsertError) throw upsertError;

      // If HSA date changed, update existing invoices
      if (hsaDateChanged && hsaOpenedDate) {
        // Set is_hsa_eligible = false for invoices before HSA opened date
        const { error: updateDateError } = await supabase
          .from("invoices")
          .update({ is_hsa_eligible: false })
          .eq("user_id", user.id)
          .lt("date", hsaOpenedDate)
          .eq("is_hsa_eligible", true);
        if (updateDateError) throw updateDateError;

        const { error: updateInvoiceDateError } = await supabase
          .from("invoices")
          .update({ is_hsa_eligible: false })
          .eq("user_id", user.id)
          .lt("invoice_date", hsaOpenedDate)
          .eq("is_hsa_eligible", true);
        if (updateInvoiceDateError) throw updateInvoiceDateError;
        
        toast.success("Profile updated and expense eligibility recalculated");
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const loadBankConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("plaid_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBankConnections(data || []);
    } catch (error) {
      console.error("Error loading bank connections:", error);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("payment_methods").insert({
        user_id: user.id,
        ...newPaymentMethod,
      });

      if (error) throw error;

      toast.success("Payment method added successfully");
      setPaymentDialogOpen(false);
      setNewPaymentMethod({ name: "", type: "", rewards_rate: 0 });
      loadPaymentMethods();
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("Failed to add payment method");
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Payment method deleted");
      loadPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const handleDeleteBankConnection = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this bank account?")) return;

    try {
      const { error } = await supabase
        .from("plaid_connections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Bank account disconnected");
      loadBankConnections();
    } catch (error) {
      console.error("Error disconnecting bank:", error);
      toast.error("Failed to disconnect bank account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and security
          </p>
        </div>

        <div className="space-y-6">
          <SubscriptionManagement />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Manage your app experience and feature tours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Feature Discovery</h4>
                <p className="text-sm text-muted-foreground">
                  Reset the onboarding tooltips to see feature introductions again
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onboarding.resetOnboarding();
                    toast.success("Onboarding reset! Visit the dashboard to see tooltips again.");
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Feature Tours
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Progressive Web App
              </CardTitle>
              <CardDescription>
                Install Wellth.ai for a native app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get instant access, offline support, and push notifications by installing Wellth.ai as an app on your device.
              </p>
              <Button onClick={() => navigate('/install')} variant="outline">
                View Installation Guide
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                HSA Information
              </CardTitle>
              <CardDescription>
                Track HSA eligibility for expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hsa-opened">HSA Opened Date</Label>
                <Input
                  id="hsa-opened"
                  type="date"
                  value={hsaOpenedDate}
                  onChange={(e) => setHsaOpenedDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Only expenses after this date can be reimbursed from your HSA
                </p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <CardTitle>Payment Methods</CardTitle>
                </div>
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="method-name">Name</Label>
                        <Input
                          id="method-name"
                          placeholder="Chase Sapphire Reserve"
                          value={newPaymentMethod.name}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="method-type">Type</Label>
                        <Select value={newPaymentMethod.type} onValueChange={(value) => setNewPaymentMethod({ ...newPaymentMethod, type: value })}>
                          <SelectTrigger id="method-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Debit Card">Debit Card</SelectItem>
                            <SelectItem value="HSA Card">HSA Card</SelectItem>
                            <SelectItem value="FSA Card">FSA Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rewards">Rewards Rate (%)</Label>
                        <Input
                          id="rewards"
                          type="number"
                          step="0.1"
                          value={newPaymentMethod.rewards_rate}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, rewards_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPaymentMethod}>Add Payment Method</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Manage your credit cards, HSA, and FSA cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment methods added yet</p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.type} • {method.rewards_rate}% rewards
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Bank Accounts</CardTitle>
                </div>
                <PlaidLink onSuccess={loadBankConnections} />
              </div>
              <CardDescription>
                Connect your bank accounts to import transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bankConnections.length === 0 ? (
                <div className="text-center py-6">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No bank accounts connected</p>
                  <PlaidLink onSuccess={loadBankConnections} />
                </div>
              ) : (
                <div className="space-y-3">
                  {bankConnections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{connection.institution_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Connected {new Date(connection.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBankConnection(connection.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification preferences coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
