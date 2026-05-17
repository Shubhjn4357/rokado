"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function PaymentVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    router.push("/vouchers");
    toast({
      title: "Payment voucher created",
      description: "The payment voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2">
      <VoucherForm initialType="payment" onSuccess={handleSuccess} />
    </div>
  );
}
