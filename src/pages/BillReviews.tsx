import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillReviewCard } from "@/components/bills/BillReviewCard";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BillReviews() {
  const navigate = useNavigate();

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['bill-reviews-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch reviews with invoice data
      const { data: reviews, error } = await supabase
        .from('bill_reviews')
        .select(`
          *,
          invoices (
            vendor,
            amount
          )
        `)
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;

      // Fetch error counts for each review
      const reviewsWithCounts = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: errors, error: errorsError } = await supabase
            .from('bill_errors')
            .select('id')
            .eq('bill_review_id', review.id)
            .eq('status', 'identified');

          if (errorsError) throw errorsError;

          return {
            ...review,
            errorCount: errors?.length || 0
          };
        })
      );

      return reviewsWithCounts;
    }
  });

  const pendingReviews = reviewsData?.filter(r => r.review_status === 'pending') || [];
  const resolvedReviews = reviewsData?.filter(r => r.review_status === 'resolved') || [];
  const totalSavings = reviewsData?.reduce((sum, r) => sum + Number(r.total_potential_savings), 0) || 0;

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Bill Reviews</h1>
          <p className="text-muted-foreground">
            Review AI-analyzed medical bills for potential errors and savings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Pending Reviews</div>
            <div className="text-3xl font-bold">{pendingReviews.length}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Potential Savings</div>
            <div className="text-3xl font-bold text-green-600">${totalSavings.toFixed(2)}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Resolved Reviews</div>
            <div className="text-3xl font-bold">{resolvedReviews.length}</div>
          </Card>
        </div>

        {/* Reviews List */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({reviewsData?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingReviews.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any pending bill reviews at the moment
                </p>
                <Button onClick={() => navigate('/invoices')}>
                  View Bills
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingReviews.map(review => (
                  <BillReviewCard 
                    key={review.id} 
                    review={review as any} 
                    errorCount={review.errorCount}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-6">
            {resolvedReviews.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Reviews</h3>
                <p className="text-muted-foreground">
                  You haven't resolved any bill reviews yet
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {resolvedReviews.map(review => (
                  <BillReviewCard 
                    key={review.id} 
                    review={review as any} 
                    errorCount={review.errorCount}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {!reviewsData || reviewsData.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bill Reviews</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't analyzed any bills yet
                </p>
                <Button onClick={() => navigate('/invoices')}>
                  View Bills
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reviewsData.map(review => (
                  <BillReviewCard 
                    key={review.id} 
                    review={review as any} 
                    errorCount={review.errorCount}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
