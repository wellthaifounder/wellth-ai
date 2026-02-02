import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { DisputeWizard } from "@/components/bills/DisputeWizard";
import { toast } from "sonner";

export default function BillDispute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch invoice and related bill review
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-for-dispute', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          bill_reviews (
            id,
            total_potential_savings,
            confidence_score
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch bill errors if there's a review
  const billReviewId = (invoice?.bill_reviews as any)?.[0]?.id;
  
  const { data: errors } = useQuery({
    queryKey: ['bill-errors-for-dispute', billReviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bill_errors')
        .select('*')
        .eq('bill_review_id', billReviewId)
        .eq('status', 'identified')
        .order('potential_savings', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!billReviewId
  });

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!invoice) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This invoice doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/expenses')}>
              Back to Expenses
            </Button>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Start a Dispute</h1>
          <p className="text-muted-foreground">
            We'll guide you through the process of disputing incorrect charges
          </p>
        </div>

        {/* Dispute Wizard */}
        <DisputeWizard 
          invoice={invoice}
          errors={errors || []}
          billReviewId={billReviewId}
        />
      </div>
    </AuthenticatedLayout>
  );
}
