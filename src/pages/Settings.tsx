import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Shield, Heart, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { SubscriptionManagement } from "@/components/settings/SubscriptionManagement";
import { useOnboarding } from "@/contexts/OnboardingContext";


const Settings = () => {
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hsaOpenedDate, setHsaOpenedDate] = useState("");

  useEffect(() => {
    loadUserData();
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
