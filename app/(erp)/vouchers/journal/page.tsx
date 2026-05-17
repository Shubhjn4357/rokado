"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function JournalVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    router.push("/vouchers");
    toast({
      title: "Journal voucher created",
      description: "The journal voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2">
      <VoucherForm initialType="journal" onSuccess={handleSuccess} />
    </div>
  );
}
