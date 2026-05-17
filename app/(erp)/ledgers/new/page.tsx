import { LedgerForm } from "@/components/ledgers/ledger-form";

export default function NewLedgerPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <LedgerForm mode="create" />
    </div>
  );
}
