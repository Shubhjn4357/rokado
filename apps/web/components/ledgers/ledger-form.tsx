"use client";

import { useState } from "react";
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
  useToast,
} from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { createLedger } from "@/app/(erp)/ledgers/actions";

export function LedgerForm({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<any>({
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

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const result = await createLedger(values);

      if (result.success) {
        toast({
          title: "Ledger created",
          description: "Ledger has been created successfully.",
        });
        form.reset();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ledger Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter ledger name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ledger Group</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sundry_debtors">Sundry Debtors</SelectItem>
                        <SelectItem value="sundry_creditors">Sundry Creditors</SelectItem>
                        <SelectItem value="bank">Bank Accounts</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="sales">Sales Accounts</SelectItem>
                        <SelectItem value="purchase">Purchase Accounts</SelectItem>
                        <SelectItem value="expenses">Indirect Expenses</SelectItem>
                        <SelectItem value="capital">Capital Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Balance</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="balanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>Submit</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}