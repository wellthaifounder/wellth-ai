import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHSAAccounts } from "@/hooks/useHSAAccounts";
import { formatHSAAccountDateRange } from "@/lib/hsaAccountUtils";
import { Wallet } from "lucide-react";

type HSAAccountFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function HSAAccountFilter({ value, onValueChange }: HSAAccountFilterProps) {
  const { accounts, isLoading } = useHSAAccounts();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Loading accounts..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[250px]">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <SelectValue placeholder="All HSA Accounts" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="font-medium">All HSA Accounts</span>
        </SelectItem>
        {accounts.map((account) => (
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
