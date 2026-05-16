import { VoucherForm } from "@/components/vouchers/voucher-form";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function PurchaseVoucherPage() {
  const router = useRouter();

  const handleSuccess = (voucherId: string) => {
    router.push("/vouchers");
    toast({
      title: "Purchase voucher created",
      description: "The purchase voucher has been created successfully.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <VoucherForm initialType="purchase" onSuccess={handleSuccess} />
    </div>
  );
}