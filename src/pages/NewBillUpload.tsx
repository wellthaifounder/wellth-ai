import { useNavigate } from "react-router-dom";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { BillUploadWizard } from "@/components/bills/BillUploadWizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewBillUpload() {
  const navigate = useNavigate();

  const handleComplete = (invoiceId: string) => {
    navigate(`/bills/${invoiceId}`);
  };

  const handleCancel = () => {
    navigate("/bills");
  };

  return (
    <AuthenticatedLayout hideBottomNav>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/bills")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bills
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Upload Medical Bill</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload documents and enter your bill details to track this expense
            and maximize your HSA/FSA savings.
          </p>
        </div>

        <BillUploadWizard onComplete={handleComplete} onCancel={handleCancel} />
      </div>
    </AuthenticatedLayout>
  );
}
