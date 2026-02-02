import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Search, FolderOpen, Plus } from "lucide-react";

interface LinkToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  onSuccess: () => void;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

export function LinkToCollectionDialog({
  open,
  onOpenChange,
  documentId,
  onSuccess,
}: LinkToCollectionDialogProps) {
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");

  // Fetch existing collections
  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections-for-linking"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("collections")
        .select("id, title, description, color")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Collection[];
    },
    enabled: open,
  });

  // Filter collections by search
  const filteredCollections = collections?.filter((collection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.title.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  });

  // Link document to existing collection
  const linkMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from("receipts")
        .update({ collection_id: collectionId })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Document linked to collection");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to link document");
    },
  });

  // Create new collection and link
  const createAndLinkMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create new collection
      const { data: newCollection, error: createError } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          title,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      // Link document to new collection
      const { error: linkError } = await supabase
        .from("receipts")
        .update({ collection_id: newCollection.id })
        .eq("id", documentId);

      if (linkError) throw linkError;

      return newCollection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created and document linked");
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to create collection");
    },
  });

  const handleLink = () => {
    if (showNewCollection && newCollectionTitle.trim()) {
      createAndLinkMutation.mutate(newCollectionTitle.trim());
    } else if (selectedCollectionId) {
      linkMutation.mutate(selectedCollectionId);
    }
  };

  const isLinking = linkMutation.isPending || createAndLinkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link to Collection</DialogTitle>
          <DialogDescription>
            Connect this document to a collection for better organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle between existing and new */}
          <div className="flex gap-2">
            <Button
              variant={!showNewCollection ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewCollection(false)}
              className="flex-1"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Existing Collection
            </Button>
            <Button
              variant={showNewCollection ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewCollection(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </div>

          {showNewCollection ? (
            <div className="space-y-2">
              <Label htmlFor="new-collection-title">Collection Title</Label>
              <Input
                id="new-collection-title"
                placeholder='e.g., "Mom - Knee Surgery" or "2026 Dental"'
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can add more details after creating the collection.
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Collection List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredCollections?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No collections found</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowNewCollection(true)}
                  >
                    Create a new collection
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <RadioGroup
                    value={selectedCollectionId}
                    onValueChange={setSelectedCollectionId}
                    className="space-y-2"
                  >
                    {filteredCollections?.map((collection) => (
                      <div
                        key={collection.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCollectionId === collection.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedCollectionId(collection.id)}
                      >
                        <RadioGroupItem value={collection.id} id={collection.id} />
                        <label htmlFor={collection.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            {collection.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: collection.color }}
                              />
                            )}
                            <p className="font-medium">{collection.title}</p>
                          </div>
                          {collection.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {collection.description}
                            </p>
                          )}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={
              isLinking ||
              (showNewCollection ? !newCollectionTitle.trim() : !selectedCollectionId)
            }
          >
            {isLinking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {showNewCollection ? "Create & Link" : "Link to Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
