import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

interface ProviderReviewFormProps {
  providerId: string;
}

export function ProviderReviewForm({ providerId }: ProviderReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    overall_rating: 0,
    cost_rating: 0,
    accuracy_rating: 0,
    response_rating: 0,
    review_text: '',
    would_recommend: true
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
    if (formData.overall_rating === 0) {
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
          overall_rating: formData.overall_rating,
          cost_rating: formData.cost_rating || null,
          accuracy_rating: formData.accuracy_rating || null,
          response_rating: formData.response_rating || null,
          review_text: formData.review_text || null,
          would_recommend: formData.would_recommend
        });

      if (error) throw error;

      toast.success("Review submitted successfully");
      
      // Reset form
      setFormData({
        overall_rating: 0,
        cost_rating: 0,
        accuracy_rating: 0,
        response_rating: 0,
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
        <StarRating 
          label="Overall Rating *" 
          field="overall_rating" 
          value={formData.overall_rating} 
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StarRating 
            label="Cost Rating" 
            field="cost_rating" 
            value={formData.cost_rating} 
          />
          <StarRating 
            label="Accuracy Rating" 
            field="accuracy_rating" 
            value={formData.accuracy_rating} 
          />
          <StarRating 
            label="Response Rating" 
            field="response_rating" 
            value={formData.response_rating} 
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
          disabled={isSubmitting || formData.overall_rating === 0}
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
