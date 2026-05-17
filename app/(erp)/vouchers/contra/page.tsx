"use client";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ContraVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    router.push("/vouchers");
    toast({
      title: "Contra voucher created",
      description: "The contra voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <VoucherForm initialType="contra" onSuccess={handleSuccess} />
    </div>
  );
}
