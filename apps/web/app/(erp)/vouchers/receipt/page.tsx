"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ReceiptVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    router.push("/vouchers");
    toast({
      title: "Receipt voucher created",
      description: "The receipt voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <VoucherForm initialType="receipt" onSuccess={handleSuccess} />
    </div>
  );
}
