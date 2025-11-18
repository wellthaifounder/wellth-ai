import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHSAAccounts } from "@/hooks/useHSAAccounts";
import { formatHSAAccountDateRange } from "@/lib/hsaAccountUtils";
import { Calendar } from "lucide-react";

type HSAAccountSelectorProps = {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function HSAAccountSelector({
  value,
  onValueChange,
  placeholder = "Select HSA account",
  disabled = false,
}: HSAAccountSelectorProps) {
  const { accounts, isLoading } = useHSAAccounts();

  // Filter to only show active accounts
  const activeAccounts = accounts.filter((acc) => acc.is_active && !acc.closed_date);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading accounts..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (activeAccounts.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 border border-muted rounded-md bg-muted/20">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          No active HSA accounts. Add one in Settings.
        </span>
      </div>
    );
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeAccounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex flex-col">
              <span className="font-medium">{account.account_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatHSAAccountDateRange(account)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
