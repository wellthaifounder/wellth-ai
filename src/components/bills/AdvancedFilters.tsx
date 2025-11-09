import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export interface FilterState {
  searchQuery: string;
  status: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  amountRange: [number, number];
  provider: string;
  savingsMin: number;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  showAmountFilter?: boolean;
  showProviderFilter?: boolean;
  showSavingsFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
}

export function AdvancedFilters({ 
  onFiltersChange, 
  showAmountFilter = true,
  showProviderFilter = true,
  showSavingsFilter = false,
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' }
  ]
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: { from: undefined, to: undefined },
    amountRange: [0, 10000],
    provider: '',
    savingsMin: 0
  });

  const activeFilterCount = [
    filters.searchQuery,
    filters.status !== 'all',
    filters.dateRange.from,
    filters.provider,
    filters.amountRange[0] > 0 || filters.amountRange[1] < 10000,
    filters.savingsMin > 0
  ].filter(Boolean).length;

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      searchQuery: '',
      status: 'all',
      dateRange: { from: undefined, to: undefined },
      amountRange: [0, 10000],
      provider: '',
      savingsMin: 0
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by provider, claim number..."
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                className="w-full"
              />
            </div>

            <Select 
              value={filters.status} 
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              More Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="grid gap-6 pt-4 border-t md:grid-cols-2">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "MMM d, yyyy")} -{" "}
                            {format(filters.dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange.from}
                      selected={{
                        from: filters.dateRange.from,
                        to: filters.dateRange.to
                      }}
                      onSelect={(range) => 
                        updateFilters({ 
                          dateRange: { 
                            from: range?.from, 
                            to: range?.to 
                          } 
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Provider Filter */}
              {showProviderFilter && (
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider Name</Label>
                  <Input
                    id="provider"
                    placeholder="Filter by provider..."
                    value={filters.provider}
                    onChange={(e) => updateFilters({ provider: e.target.value })}
                  />
                </div>
              )}

              {/* Amount Range */}
              {showAmountFilter && (
                <div className="space-y-2">
                  <Label>
                    Amount Range: ${filters.amountRange[0]} - ${filters.amountRange[1]}
                  </Label>
                  <Slider
                    value={filters.amountRange}
                    onValueChange={(value) => updateFilters({ amountRange: value as [number, number] })}
                    max={10000}
                    step={100}
                    className="py-4"
                  />
                </div>
              )}

              {/* Minimum Savings */}
              {showSavingsFilter && (
                <div className="space-y-2">
                  <Label>
                    Minimum Potential Savings: ${filters.savingsMin}
                  </Label>
                  <Slider
                    value={[filters.savingsMin]}
                    onValueChange={(value) => updateFilters({ savingsMin: value[0] })}
                    max={5000}
                    step={50}
                    className="py-4"
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ searchQuery: '' })}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ status: 'all' })}
                  />
                </Badge>
              )}
              {filters.dateRange.from && (
                <Badge variant="secondary" className="gap-1">
                  Date Range
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ dateRange: { from: undefined, to: undefined } })}
                  />
                </Badge>
              )}
              {filters.provider && (
                <Badge variant="secondary" className="gap-1">
                  Provider: {filters.provider}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilters({ provider: '' })}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
