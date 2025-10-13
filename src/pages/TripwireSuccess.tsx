import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import { generateHSAMaximizerReport } from "@/lib/pdfReportGenerator";
import { toast } from "sonner";

const TripwireSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const sessionId = searchParams.get("session_id");

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      // Get calculator data from session
      const savedData = sessionStorage.getItem("calculatorResults");
      if (!savedData) {
        toast.error("Calculator data not found. Please retake the quiz.");
        return;
      }

      const data = JSON.parse(savedData);
      const email = sessionStorage.getItem("leadEmail") || undefined;

      const pdfBlob = await generateHSAMaximizerReport(data, email);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "HSA-Maximizer-Report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please contact support.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <h1 className="mb-4 text-3xl font-bold">Payment Successful! 🎉</h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Your HSA Maximizer Report is ready to download
            </p>

            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleDownloadReport}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-5 w-5" />
                {isGenerating ? "Generating Report..." : "Download Your Report"}
              </Button>

              <div className="my-8 border-t pt-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Your 14-Day Plus Trial is Active! 🚀
                </h2>
                <p className="mb-6 text-muted-foreground">
                  Start tracking expenses and maximizing your savings today
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Activate Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg bg-primary/5 p-6 text-left">
                <h3 className="mb-3 font-semibold">What's included in your trial:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>Unlimited expense tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>Automatic receipt OCR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>Smart categorization & rewards alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>One-click HSA reimbursements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>Advanced analytics & tax reports</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Questions? Email us at support@wellth.ai
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripwireSuccess;
