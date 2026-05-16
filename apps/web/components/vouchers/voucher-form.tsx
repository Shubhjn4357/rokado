"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Input,
} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  toast,
} from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vouchers, ledgers } from "@repo/database";
import { createVoucher } from "@/app/(erp)/vouchers/actions";
import type { VoucherType, LedgerGroup } from "@/lib/types";
import { VoucherEntryLine } from "@/app/(erp)/vouchers/actions";

const VoucherFormSchema = z.object({
  type: z.enum(["sales", "purchase", "payment", "receipt", "contra", "journal", "challan"]),
  date: z.string().transform((str) => new Date(str).getTime()),
  narration: z.string().optional(),
  reference: z.string().optional(),
  // Challan specific fields
  transportName: z.string().optional(),
  lrNumber: z.string().optional(),
  dispatchDate: z.string().transform((str) => new Date(str).getTime()).optional(),
  freightAmount: z.number().optional(),
}).refine((data) => {
  if (data.type === "challan") {
    return !!(data.transportName && data.lrNumber && data.dispatchDate !== undefined && data.freightAmount !== undefined);
  }
  return true;
}, {
  message: "Transport name, LR number, dispatch date, and freight amount are required for challan",
  path: ["transportName"],
});

type VoucherFormValues = z.infer<typeof VoucherFormSchema> & {
  entries: Array<{
    ledgerId: string;
    type: "dr" | "cr";
    amount: number;
    narration?: string;
  }>;
  // Challan specific fields
  transportName?: string;
  lrNumber?: string;
  dispatchDate?: string; // ISO date string
  freightAmount?: number;
};

export function VoucherForm({
  initialType,
  onSuccess
}: {
  initialType?: VoucherType;
  onSuccess: (voucherId: string) => void
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [ledgersOptions, setLedgersOptions] = useState<Array<{id: string; name: string; group: LedgerGroup}>>([]);
  const [entryCount, setEntryCount] = useState(2); // Start with 2 entries

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(VoucherFormSchema.extend({
      entries: z.array(
        z.object({
          ledgerId: z.string().min(1, "Ledger is required"),
          type: z.enum(["dr", "cr"]),
          amount: z.number().min(0.01, "Amount must be greater than 0"),
          narration: z.string().optional(),
        })
      ).min(2, "At least two entries are required")
    })),
    defaultValues: {
      type: initialType ?? "sales",
      date: Date.now(),
      narration: "",
      reference: "",
      entries: Array.from({ length: 2 }, () => ({
        ledgerId: "",
        type: "dr",
        amount: 0,
        narration: "",
      })),
    },
  });

  const { toast } = useToast();

  // Fetch ledgers for the dropdown
  useEffect(() => {
    async function fetchLedgers() {
      const data = await db.select({ id: ledgers.id, name: ledgers.name, group: ledgers.group })
        .from(ledgers)
        .orderBy(ledgers.name);
      setLedgersOptions(data);
    }
    fetchLedgers();
  }, []);

  const addEntry = () => {
    setEntryCount(prev => prev + 1);
  };

  const removeEntry = (index: number) => {
    if (entryCount > 2) {
      setEntryCount(prev => prev - 1);
    }
  };

  const onSubmit = async (values: VoucherFormValues) => {
    setIsLoading(true);
    try {
      // Transform the form values to match the action's expected input
      const input = {
        type: values.type,
        date: values.date,
        narration: values.narration,
        reference: values.reference,
        entries: values.entries.map(entry => ({
          ledgerId: entry.ledgerId,
          type: entry.type,
          amount: entry.amount,
          narration: entry.narration,
        })),
      };

      // Call the voucher creation action
      const result = await createVoucher(input);

      if (result.success) {
        toast({
          title: "Voucher created",
          description: "Voucher has been created successfully.",
        });
        onSuccess(result.voucherId);
        reset();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Voucher</CardTitle>
        <CardDescription>
          Enter the voucher details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...{ onSubmit: handleSubmit(onSubmit) }} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Type</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      disabled={!!initialType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Voucher (F8)</SelectItem>
                        <SelectItem value="purchase">Purchase Voucher (F9)</SelectItem>
                        <SelectItem value="payment">Payment Voucher (F5)</SelectItem>
                        <SelectItem value="receipt">Receipt Voucher (F6)</SelectItem>
                        <SelectItem value="contra">Contra Voucher (F4)</SelectItem>
                        <SelectItem value="journal">Journal Voucher (F7)</SelectItem>
                        <SelectItem value="challan">Delivery Challan (F10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={register}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={register}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter reference"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="narration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Narration (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter narration"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Challan specific fields */}
          {watch("type") === "challan" && (
            <>
              <div className="border-t pt-4">
                <h2 className="font-bold mb-4">Challan Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name="transportName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transport Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter transport name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="lrNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LR Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter LR number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name="dispatchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispatch Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="freightAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freight Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t pt-4">
            <h2 className="font-bold mb-4">Ledger Entries</h2>
            <p className="text-sm text-muted-foreground mb-2">
              At least two entries are required (one debit, one credit). Total debits must equal total credits.
            </p>
            <div className="space-y-4" id="entries-container">
              {Array.from({ length: entryCount }).map((_, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Entry {index + 1}</h3>
                    {entryCount > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(index)}
                        aria-label={`Remove entry ${index + 1}`}
                      >
                        <trash-2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <FormField
                      control={control}
                      name={`entries.${index}.ledgerId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ledger</FormLabel>
                          <FormControl>
                            <Select
                              {...field}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select ledger" />
                              </SelectTrigger>
                              <SelectContent>
                                {ledgersOptions.map(ledger => (
                                  <SelectItem key={ledger.id} value={ledger.id}>
                                    {ledger.name} ({ledger.group})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`entries.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Select
                              {...field}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Dr/Cr" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dr">Debit (Dr)</SelectItem>
                                <SelectItem value="cr">Credit (Cr)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`entries.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`entries.${index}.narration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Narration (optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter narration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center">
              <Button
                variant="outline"
                onClick={addEntry}
                disabled={entryCount >= 10}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Voucher"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/vouchers")}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}