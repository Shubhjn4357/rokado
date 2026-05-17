"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useForm, useFieldArray, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db, ledgers } from "@repo/database";
import { createVoucher } from "@/app/(erp)/vouchers/actions";
import type { VoucherType, LedgerGroup } from "@/lib/types";
import { Trash2 } from "lucide-react";

const VoucherFormSchema = z.object({
  type: z.enum(["sales", "purchase", "payment", "receipt", "contra", "journal", "challan"]),
  date: z.string(),
  narration: z.string().optional(),
  reference: z.string().optional(),
  // Challan specific fields
  transportName: z.string().optional(),
  lrNumber: z.string().optional(),
  dispatchDate: z.string().optional(),
  freightAmount: z.string().optional(),
  entries: z.array(
    z.object({
      ledgerId: z.string().min(1, "Ledger is required"),
      type: z.enum(["dr", "cr"]),
      amount: z.string().min(1, "Amount is required"),
      narration: z.string().optional(),
    })
  ).min(2, "At least two entries are required")
}).refine((data) => {
  if (data.type === "challan") {
    return !!(data.transportName && data.lrNumber && data.dispatchDate && data.freightAmount);
  }
  return true;
}, {
  message: "Transport details are required for challan",
  path: ["transportName"],
});

type VoucherFormValues = z.infer<typeof VoucherFormSchema>;

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

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(VoucherFormSchema),
    defaultValues: {
      type: initialType ?? "sales",
      date: new Date().toISOString().split('T')[0],
      narration: "",
      reference: "",
      entries: [
        { ledgerId: "", type: "dr", amount: "0", narration: "" },
        { ledgerId: "", type: "cr", amount: "0", narration: "" },
      ],
    },
  });

  const { control, handleSubmit, watch, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });

  // Fetch ledgers for the dropdown
  useEffect(() => {
    async function fetchLedgers() {
      try {
        const data = await db.select({ id: ledgers.id, name: ledgers.name, group: ledgers.group as any })
          .from(ledgers)
          .orderBy(ledgers.name);
        setLedgersOptions(data);
      } catch (err) {
        console.error("Failed to fetch ledgers:", err);
      }
    }
    fetchLedgers();
  }, []);

  const onSubmit = async (values: VoucherFormValues) => {
    setIsLoading(true);
    try {
      const input = {
        type: values.type,
        date: new Date(values.date).getTime(),
        narration: values.narration,
        reference: values.reference,
        entries: values.entries.map(entry => ({
          ledgerId: entry.ledgerId,
          type: entry.type,
          amount: parseFloat(entry.amount),
          narration: entry.narration,
        })),
        ...(values.type === "challan" ? {
          transportName: values.transportName,
          lrNumber: values.lrNumber,
          dispatchDate: values.dispatchDate ? new Date(values.dispatchDate).getTime() : undefined,
          freightAmount: values.freightAmount ? parseFloat(values.freightAmount) : undefined,
        } : {})
      };

      const result = await createVoucher(input as any);

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
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control as any}
                name="type"
                render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "type"> }) => (
                  <FormItem>
                    <FormLabel>Voucher Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                control={control as any}
                name="date"
                render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "date"> }) => (
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
              control={control as any}
              name="reference"
              render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "reference"> }) => (
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
              control={control as any}
              name="narration"
              render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "narration"> }) => (
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

            {watch("type") === "challan" && (
              <>
                <div className="border-t pt-4">
                  <h2 className="font-bold mb-4">Challan Details</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={control as any}
                      name="transportName"
                      render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "transportName"> }) => (
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
                      control={control as any}
                      name="lrNumber"
                      render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "lrNumber"> }) => (
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
                      control={control as any}
                      name="dispatchDate"
                      render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "dispatchDate"> }) => (
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
                      control={control as any}
                      name="freightAmount"
                      render={({ field }: { field: ControllerRenderProps<VoucherFormValues, "freightAmount"> }) => (
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
              <div className="space-y-4">
                {fields.map((entryField, index) => (
                  <div key={entryField.id} className="border p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Entry {index + 1}</h3>
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          aria-label={`Remove entry ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                      <FormField
                        control={control as any}
                        name={`entries.${index}.ledgerId`}
                        render={({ field: innerField }: { field: ControllerRenderProps<VoucherFormValues, `entries.${number}.ledgerId`> }) => (
                          <FormItem>
                            <FormLabel>Ledger</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={innerField.onChange}
                                defaultValue={innerField.value}
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
                        control={control as any}
                        name={`entries.${index}.type`}
                        render={({ field: innerField }: { field: ControllerRenderProps<VoucherFormValues, `entries.${number}.type`> }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={innerField.onChange}
                                defaultValue={innerField.value}
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
                        control={control as any}
                        name={`entries.${index}.amount`}
                        render={({ field: innerField }: { field: ControllerRenderProps<VoucherFormValues, `entries.${number}.amount`> }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                {...innerField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control as any}
                        name={`entries.${index}.narration`}
                        render={({ field: innerField }: { field: ControllerRenderProps<VoucherFormValues, `entries.${number}.narration`> }) => (
                          <FormItem>
                            <FormLabel>Narration (optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...innerField}
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
                  type="button"
                  variant="outline"
                  onClick={() => append({ ledgerId: "", type: "dr", amount: "0", narration: "" })}
                  disabled={fields.length >= 10}
                >
                  Add Entry
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Voucher"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/vouchers")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}