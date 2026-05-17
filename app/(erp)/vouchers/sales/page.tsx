"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function SalesVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    // For now, redirect to vouchers list. Later we can redirect to voucher detail.
    router.push("/vouchers");
    toast({
      title: "Sales voucher created",
      description: "The sales voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <VoucherForm initialType="sales" onSuccess={handleSuccess} />
    </div>
  );
}
