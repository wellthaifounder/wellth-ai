import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AlertCircle, TrendingDown, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BillReviewCardProps {
  review: {
    id: string;
    invoice_id: string;
    total_potential_savings: number;
    confidence_score: number;
    review_status: string;
    analyzed_at: string;
    invoice?: {
      vendor: string;
      amount: number;
    };
  };
  errorCount: number;
}

export function BillReviewCard({ review, errorCount }: BillReviewCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {review.invoice?.vendor || "Medical Bill"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzed {formatDistanceToNow(new Date(review.analyzed_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant={review.review_status === 'pending' ? 'default' : 'secondary'}>
            {review.review_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Issues Found</p>
            <p className="text-2xl font-bold text-orange-500">{errorCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Potential Savings
            </p>
            <p className="text-2xl font-bold text-green-600">
              ${review.total_potential_savings.toFixed(2)}
            </p>
          </div>
        </div>

        {review.confidence_score && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Confidence Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${review.confidence_score * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(review.confidence_score * 100)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => navigate(`/bills/${review.invoice_id}/review`)}
            className="flex-1"
          >
            View Details
          </Button>
          {errorCount > 0 && review.review_status === 'pending' && (
            <Button 
              onClick={() => navigate(`/bills/${review.invoice_id}/dispute`)}
              variant="outline"
            >
              Start Dispute
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
