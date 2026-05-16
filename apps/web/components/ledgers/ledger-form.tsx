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
import { ledgers, LedgerGroup, BalanceType } from "@repo/database";
import { createLedger } from "@/app/(erp)/ledgers/actions";

const LedgerFormSchema = z.object({
  name: z.string().min(1, "Ledger name is required"),
  group: z.nativeEnum(LedgerGroup),
  gstNumber: z.string().optional().or(z.literal("")).transform((val) => val === "" ? undefined : val),
  pan: z.string().optional().or(z.literal("")).transform((val) => val === "" ? undefined : val),
  phone: z.string().optional().or(z.literal("")).transform((val) => val === "" ? undefined : val),
  address: z.string().optional().or(z.literal("")).transform((val) => val === "" ? undefined : val),
  creditLimit: z.number().nonnegative().default(0),
  openingBalance: z.number().default(0),
  balanceType: z.nativeEnum(BalanceType),
});

type LedgerFormValues = z.infer<typeof LedgerFormSchema>;

export function LedgerForm({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LedgerFormValues>({
    resolver: zodResolver(LedgerFormSchema),
    defaultValues: {
      name: "",
      group: "sundry_debtors",
      gstNumber: "",
      pan: "",
      phone: "",
      address: "",
      creditLimit: 0,
      openingBalance: 0,
      balanceType: "dr",
    },
  });

  const { toast } = useToast();

  const onSubmit = async (values: LedgerFormValues) => {
    setIsLoading(true);
    try {
      // Call server action to create ledger
      const result = await createLedger(values);

      if (result.success) {
        toast({
          title: "Ledger created",
          description: "Ledger has been created successfully.",
        });
        reset();
        router.push(`/ledgers/${result.ledgerId}`);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Ledger" : "Edit Ledger"}</CardTitle>
        <CardDescription>
          Enter the details for the new ledger account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...{ onSubmit: handleSubmit(onSubmit) }} className="space-y-6">
          <FormField
            control={register}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ledger Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter ledger name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ledger Group</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries({
                        cash: "Cash",
                        bank: "Bank Accounts",
                        sundry_debtors: "Sundry Debtors",
                        sundry_creditors: "Sundry Creditors",
                        sales: "Sales Accounts",
                        purchase: "Purchase Accounts",
                        expenses: "Indirect Expenses",
                        capital: "Capital Account",
                        duties_taxes: "Duties & Taxes",
                        loans: "Loans & Liabilities",
                        fixed_assets: "Fixed Assets",
                        current_assets: "Current Assets",
                        current_liabilities: "Current Liabilities",
                      }).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
            control={register}
            name="gstNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSTIN</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter GSTIN (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="pan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter PAN (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter phone number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter address"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="creditLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="Enter credit limit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="openingBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Balance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="Enter opening balance"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={register}
            name="balanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balance Type</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select balance type" />
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
        </Form>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Ledger"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/ledgers")}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}