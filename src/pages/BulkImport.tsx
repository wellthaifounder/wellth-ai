import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { WellthLogo } from "@/components/WellthLogo";
import { z } from "zod";

const HSA_ELIGIBLE_CATEGORIES = [
  "Doctor Visit",
  "Prescription",
  "Dental",
  "Vision",
  "Medical Equipment",
  "Lab Tests",
  "Hospital",
  "Physical Therapy",
  "Mental Health",
  "Other Medical"
];

interface ImportRow {
  date: string;
  vendor: string;
  amount: string;
  category: string;
  notes?: string;
  valid: boolean;
  errors: string[];
}

const expenseRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  vendor: z.string().trim().min(1, "Vendor required").max(100),
  amount: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid amount format"),
  category: z.string().min(1, "Category required"),
  notes: z.string().max(500).optional(),
});

const BulkImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const downloadTemplate = () => {
    const template = `date,vendor,amount,category,notes
2024-01-15,CVS Pharmacy,45.99,Prescription,Monthly medication
2024-01-20,Dr. Smith,150.00,Doctor Visit,Annual checkup
2024-02-01,LensCrafters,299.99,Vision,New glasses`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-import-template.csv";
    a.click();
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const requiredHeaders = ["date", "vendor", "amount", "category"];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
      return [];
    }

    const rows: ImportRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      const errors: string[] = [];
      try {
        expenseRowSchema.parse(row);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.errors.map(e => e.message));
        }
      }

      rows.push({
        date: row.date,
        vendor: row.vendor,
        amount: row.amount,
        category: row.category,
        notes: row.notes,
        valid: errors.length === 0,
        errors,
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreviewData(parsed);
      
      const validCount = parsed.filter(r => r.valid).length;
      toast.success(`Loaded ${validCount} valid row(s) from ${parsed.length} total`);
    };
    
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    const validRows = previewData.filter(r => r.valid);
    
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const expenses = validRows.map(row => ({
        user_id: user.id,
        date: row.date,
        vendor: row.vendor,
        amount: parseFloat(row.amount),
        category: row.category,
        notes: row.notes || null,
        is_hsa_eligible: HSA_ELIGIBLE_CATEGORIES.includes(row.category),
        is_reimbursed: false,
      }));

      const { error } = await supabase
        .from("expenses")
        .insert(expenses);

      if (error) throw error;

      setImported(true);
      toast.success(`Successfully imported ${validRows.length} expense(s)!`);
      
      setTimeout(() => {
        navigate("/expenses");
      }, 2000);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import expenses");
    } finally {
      setImporting(false);
    }
  };

  if (imported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="mb-2">Import Complete!</CardTitle>
          <CardDescription>
            Redirecting to expenses...
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <WellthLogo size="sm" showTagline />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Bulk Import Expenses</CardTitle>
            <CardDescription>
              Upload a CSV file to import multiple expenses at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <div className="flex-1">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => document.getElementById('csv-file')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? file.name : "Choose CSV File"}
                </Button>
              </div>
            </div>

            {previewData.length > 0 && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold">Preview ({previewData.length} rows)</h3>
                  <div className="flex gap-4 text-sm">
                    <Badge variant="default">
                      {previewData.filter(r => r.valid).length} Valid
                    </Badge>
                    <Badge variant="destructive">
                      {previewData.filter(r => !r.valid).length} Errors
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index} className={!row.valid ? "bg-destructive/10" : ""}>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.vendor}</TableCell>
                          <TableCell>${row.amount}</TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {row.notes}
                            {!row.valid && row.errors.length > 0 && (
                              <div className="text-xs text-destructive mt-1">
                                {row.errors.join(", ")}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing || previewData.filter(r => r.valid).length === 0}
                  className="w-full"
                  size="lg"
                >
                  {importing ? "Importing..." : `Import ${previewData.filter(r => r.valid).length} Expense(s)`}
                </Button>
              </>
            )}

            {previewData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <p>Upload a CSV file to see preview</p>
                <p className="text-sm">
                  Required columns: date, vendor, amount, category
                </p>
                <p className="text-sm">
                  Date format: YYYY-MM-DD (e.g., 2024-01-15)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkImport;
