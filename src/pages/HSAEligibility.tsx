import { useState } from "react";
import { AuthenticatedNav } from "@/components/AuthenticatedNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Grid3x3,
  List
} from "lucide-react";
import {
  hsaEligibilityItems,
  searchEligibilityItems,
  filterByCategory,
  filterByStatus,
  CATEGORIES,
  getCategoryCounts,
  type HSAEligibilityItem,
  type EligibilityStatus,
} from "@/lib/hsaEligibilityData";

export default function HSAEligibility() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EligibilityStatus | null>(null);
  const [selectedItem, setSelectedItem] = useState<HSAEligibilityItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoryCounts = getCategoryCounts();

  // Apply filters
  let filteredItems = searchQuery 
    ? searchEligibilityItems(searchQuery)
    : hsaEligibilityItems;

  if (selectedCategory) {
    filteredItems = filteredItems.filter(item => item.category === selectedCategory);
  }

  if (selectedStatus) {
    filteredItems = filteredItems.filter(item => item.status === selectedStatus);
  }

  const getStatusColor = (status: EligibilityStatus) => {
    switch (status) {
      case 'eligible':
        return 'bg-success text-success-foreground';
      case 'not-eligible':
        return 'bg-destructive text-destructive-foreground';
      case 'conditional':
        return 'bg-accent text-accent-foreground';
    }
  };

  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'not-eligible':
        return <XCircle className="h-4 w-4" />;
      case 'conditional':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: EligibilityStatus) => {
    switch (status) {
      case 'eligible':
        return 'HSA Eligible';
      case 'not-eligible':
        return 'Not Eligible';
      case 'conditional':
        return 'Conditionally Eligible';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNav />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">HSA Eligibility Reference</h1>
          <p className="text-muted-foreground text-lg">
            Quickly check if medical expenses qualify for HSA reimbursement based on IRS guidelines
          </p>
        </div>

        {/* Disclaimer */}
        <Alert className="mb-6 border-accent">
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            This tool provides general information based on IRS Publication 502. HSA administrators may have different rules. 
            Always consult a tax professional for your specific situation and keep all receipts.
          </AlertDescription>
        </Alert>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses (e.g., 'glasses', 'therapy', 'vitamins')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStatus === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(null)}
                >
                  All Items
                </Button>
                <Button
                  variant={selectedStatus === 'eligible' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus('eligible')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Eligible
                </Button>
                <Button
                  variant={selectedStatus === 'conditional' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus('conditional')}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Conditional
                </Button>
                <Button
                  variant={selectedStatus === 'not-eligible' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus('not-eligible')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Eligible
                </Button>
                
                <div className="ml-auto flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse by Category</TabsTrigger>
            <TabsTrigger value="results">
              Search Results ({filteredItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Category Browser */}
          <TabsContent value="browse" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.values(CATEGORIES).map((category) => (
                <Card
                  key={category}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedCategory(category);
                    // Switch to results tab to show filtered items
                    document.querySelector('[value="results"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <CardDescription>
                      {categoryCounts[category] || 0} items
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Search Results */}
          <TabsContent value="results" className="space-y-6">
            {selectedCategory && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Category:</span>
                <Badge variant="outline" className="gap-1">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No items found matching your search criteria.
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    {viewMode === 'list' && (
                      <CardContent>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{item.category}</Badge>
                          {item.requiresLMN && (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              LMN Required
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Item Detail Dialog */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <Card
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedItem.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getStatusColor(selectedItem.status)}>
                        {getStatusIcon(selectedItem.status)}
                        <span className="ml-1">{getStatusLabel(selectedItem.status)}</span>
                      </Badge>
                      <Badge variant="outline">{selectedItem.category}</Badge>
                      {selectedItem.requiresLMN && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Letter of Medical Necessity Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                </div>

                {selectedItem.conditions && (
                  <div>
                    <h3 className="font-semibold mb-2">Conditions</h3>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{selectedItem.conditions}</AlertDescription>
                    </Alert>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">IRS Reference</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{selectedItem.irsReference}</span>
                    <a
                      href="https://www.irs.gov/pub/irs-pdf/p502.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Full Publication
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Related Terms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold">Need More Information?</h3>
                <p className="text-sm text-muted-foreground">
                  This reference tool covers the most common medical expenses. For complete details and edge cases, 
                  refer to the full IRS Publication 502 or consult with a tax professional.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://www.irs.gov/pub/irs-pdf/p502.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    IRS Publication 502 (PDF)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
