import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, FolderOpen, Tag, X } from "lucide-react";

interface GlobalFilterBarProps {
  onFilterChange: (filters: { collectionId: string | null; labelIds: string[] }) => void;
}

export function GlobalFilterBar({ onFilterChange }: GlobalFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  const selectedCollectionId = searchParams.get("collection") || null;
  const selectedLabelIds = searchParams.get("labels")?.split(",").filter(Boolean) || [];

  // Fetch collections
  const { data: collections } = useQuery({
    queryKey: ["collections-for-filter"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("collections")
        .select("id, title, color")
        .eq("user_id", user.id)
        .order("title");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch labels
  const { data: labels } = useQuery({
    queryKey: ["labels-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("id, name, color")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({
      collectionId: selectedCollectionId,
      labelIds: selectedLabelIds,
    });
  }, [selectedCollectionId, selectedLabelIds.join(",")]);

  const setCollectionFilter = (collectionId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (collectionId) {
      params.set("collection", collectionId);
    } else {
      params.delete("collection");
    }
    setSearchParams(params, { replace: true });
    setCollectionOpen(false);
  };

  const toggleLabelFilter = (labelId: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get("labels")?.split(",").filter(Boolean) || [];

    const updated = current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId];

    if (updated.length > 0) {
      params.set("labels", updated.join(","));
    } else {
      params.delete("labels");
    }
    setSearchParams(params, { replace: true });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("collection");
    params.delete("labels");
    setSearchParams(params, { replace: true });
  };

  const hasActiveFilters = selectedCollectionId || selectedLabelIds.length > 0;
  const selectedCollection = collections?.find((c) => c.id === selectedCollectionId);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Collection filter */}
      <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <FolderOpen className="h-3.5 w-3.5" />
            {selectedCollection ? (
              <span className="flex items-center gap-1.5">
                {selectedCollection.color && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedCollection.color }}
                  />
                )}
                {selectedCollection.title}
              </span>
            ) : (
              "Collection"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search collections..." />
            <CommandEmpty>No collections found</CommandEmpty>
            <CommandGroup>
              {collections?.map((collection) => (
                <CommandItem
                  key={collection.id}
                  onSelect={() =>
                    setCollectionFilter(
                      collection.id === selectedCollectionId ? null : collection.id
                    )
                  }
                >
                  <div className="flex items-center gap-2 flex-1">
                    {collection.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                    )}
                    <span>{collection.title}</span>
                  </div>
                  {collection.id === selectedCollectionId && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Label filter */}
      <Popover open={labelOpen} onOpenChange={setLabelOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Tag className="h-3.5 w-3.5" />
            Labels
            {selectedLabelIds.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedLabelIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandEmpty>No labels found</CommandEmpty>
            <CommandGroup>
              {labels?.map((label) => (
                <CommandItem
                  key={label.id}
                  onSelect={() => toggleLabelFilter(label.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>
                  {selectedLabelIds.includes(label.id) && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {selectedLabelIds.map((labelId) => {
        const label = labels?.find((l) => l.id === labelId);
        if (!label) return null;
        return (
          <Badge
            key={labelId}
            variant="secondary"
            className="h-7 gap-1 cursor-pointer"
            onClick={() => toggleLabelFilter(labelId)}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
            <X className="h-3 w-3" />
          </Badge>
        );
      })}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-xs text-muted-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
