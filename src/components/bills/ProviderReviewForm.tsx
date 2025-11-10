import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProviderReviewFormProps {
  providerId: string;
}

export function ProviderReviewForm({ providerId }: ProviderReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    overall_experience_rating: 0,
    billing_clarity_rating: 0,
    cost_transparency_rating: 0,
    payment_flexibility_rating: 0,
    insurance_plan_type: '',
    network_status: 'unknown' as 'in_network' | 'out_of_network' | 'unknown',
    deductible_met: false,
    procedure_category: '',
    review_text: '',
    would_recommend: true
  });

  // Fetch user's invoices with this provider
  const { data: invoices } = useQuery({
    queryKey: ['user-invoices-for-provider', providerId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('id, vendor, date, amount, npi_number')
        .eq('user_id', user.id)
        .eq('npi_number', providerId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleStarClick = (field: string, rating: number) => {
    setFormData({ ...formData, [field]: rating });
  };

  const StarRating = ({ label, field, value }: { label: string; field: string; value: number }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(field, star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async () => {
    if (!formData.invoice_id) {
      toast.error("Please select an invoice to review");
      return;
    }
    if (formData.overall_experience_rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('provider_reviews')
        .upsert({
          provider_id: providerId,
          user_id: user.id,
          invoice_id: formData.invoice_id,
          overall_experience_rating: formData.overall_experience_rating,
          billing_clarity_rating: formData.billing_clarity_rating,
          cost_transparency_rating: formData.cost_transparency_rating,
          payment_flexibility_rating: formData.payment_flexibility_rating,
          insurance_plan_type: formData.insurance_plan_type || null,
          network_status: formData.network_status,
          deductible_met: formData.deductible_met,
          procedure_category: formData.procedure_category || null,
          review_text: formData.review_text || null,
          would_recommend: formData.would_recommend
        }, {
          onConflict: 'user_id,invoice_id'
        });

      if (error) throw error;

      toast.success("Review submitted successfully");
      
      // Reset form
      setFormData({
        invoice_id: '',
        overall_experience_rating: 0,
        billing_clarity_rating: 0,
        cost_transparency_rating: 0,
        payment_flexibility_rating: 0,
        insurance_plan_type: '',
        network_status: 'unknown',
        deductible_met: false,
        procedure_category: '',
        review_text: '',
        would_recommend: true
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your experience with this provider to help others
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="invoice">Select Invoice *</Label>
          <Select 
            value={formData.invoice_id}
            onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an invoice to review" />
            </SelectTrigger>
            <SelectContent>
              {invoices?.map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.vendor} - {new Date(invoice.date).toLocaleDateString()} - ${Number(invoice.amount).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <StarRating 
          label="Overall Experience *" 
          field="overall_experience_rating" 
          value={formData.overall_experience_rating} 
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StarRating 
            label="Billing Clarity" 
            field="billing_clarity_rating" 
            value={formData.billing_clarity_rating} 
          />
          <StarRating 
            label="Cost Transparency" 
            field="cost_transparency_rating" 
            value={formData.cost_transparency_rating} 
          />
          <StarRating 
            label="Payment Flexibility" 
            field="payment_flexibility_rating" 
            value={formData.payment_flexibility_rating} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review">Your Review</Label>
          <Textarea
            id="review"
            value={formData.review_text}
            onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
            placeholder="Share details about your experience with this provider..."
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recommend"
            checked={formData.would_recommend}
            onChange={(e) => setFormData({ ...formData, would_recommend: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="recommend" className="cursor-pointer">
            I would recommend this provider
          </Label>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || formData.overall_experience_rating === 0 || !formData.invoice_id}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
