"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ChallanVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    // For now, redirect to vouchers list. Later we can redirect to voucher detail.
    router.push("/vouchers");
    toast({
      title: "Delivery challan created",
      description: "The delivery challan has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <VoucherForm initialType="challan" onSuccess={handleSuccess} />
    </div>
  );
}
