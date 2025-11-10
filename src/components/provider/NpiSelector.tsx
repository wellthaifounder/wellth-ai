import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NpiProvider {
  id: string;
  npi_number: string;
  name: string;
  provider_type?: string;
  city?: string;
  state?: string;
}

interface NpiSelectorProps {
  onSelect: (npi: string | null, provider: NpiProvider | null) => void;
  allowCustom?: boolean;
  extractedName?: string;
  placeholder?: string;
  value?: string;
}

export const NpiSelector = ({
  onSelect,
  allowCustom = true,
  extractedName = "",
  placeholder = "Search providers or enter custom name",
  value = "",
}: NpiSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<NpiProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState(extractedName);
  const [selectedProvider, setSelectedProvider] = useState<NpiProvider | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    if (searchQuery) {
      fetchProviders(searchQuery);
    }
  }, [searchQuery]);

  const fetchProviders = async (query: string) => {
    if (!query || query.length < 2) {
      setProviders([]);
      return;
    }

    const { data, error } = await supabase
      .from("providers")
      .select("id, npi_number, name, provider_type, city, state")
      .or(`name.ilike.%${query}%,npi_number.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      setProviders(data as NpiProvider[]);
    }
  };

  const handleSelect = (provider: NpiProvider) => {
    setSelectedProvider(provider);
    setOpen(false);
    onSelect(provider.npi_number, provider);
  };

  const handleCustom = () => {
    if (customName.trim()) {
      onSelect(null, { 
        id: "", 
        npi_number: "", 
        name: customName.trim() 
      });
      setCustomMode(false);
    }
  };

  if (customMode && allowCustom) {
    return (
      <div className="space-y-2">
        <Label>Provider Name</Label>
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter provider name"
            className="flex-1"
          />
          <Button onClick={handleCustom} disabled={!customName.trim()}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setCustomMode(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Provider</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProvider
              ? `${selectedProvider.name}${selectedProvider.npi_number ? ` (NPI: ${selectedProvider.npi_number})` : ""}`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search providers..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                No providers found.
                {allowCustom && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => {
                      setCustomMode(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Provider
                  </Button>
                )}
              </CommandEmpty>
              {allowCustom && providers.length > 0 && (
                <CommandGroup heading="Options">
                  <CommandItem
                    onSelect={() => {
                      setCustomMode(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Provider
                  </CommandItem>
                </CommandGroup>
              )}
              {providers.length > 0 && (
                <CommandGroup heading="Providers">
                  {providers.map((provider) => (
                    <CommandItem
                      key={provider.id}
                      value={provider.name}
                      onSelect={() => handleSelect(provider)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProvider?.id === provider.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {provider.provider_type && `${provider.provider_type} • `}
                          {provider.npi_number && `NPI: ${provider.npi_number}`}
                          {provider.city && provider.state && ` • ${provider.city}, ${provider.state}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedProvider && (
        <p className="text-xs text-muted-foreground">
          {selectedProvider.provider_type && `${selectedProvider.provider_type} `}
          {selectedProvider.city && selectedProvider.state && `in ${selectedProvider.city}, ${selectedProvider.state}`}
        </p>
      )}
    </div>
  );
};
