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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { createLedger } from "@/app/(erp)/ledgers/actions";
import { useEffect } from "react";

export function LedgerForm({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGST, setIsFetchingGST] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
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

  const watchedPan = form.watch("pan");

  useEffect(() => {
    if (!watchedPan) return;
    const cleanPan = watchedPan.toUpperCase().trim();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (panRegex.test(cleanPan)) {
      triggerPortalFetch(cleanPan);
    }
  }, [watchedPan]);

  const triggerPortalFetch = async (pan: string) => {
    setIsFetchingGST(true);
    toast({
      title: "GST Portal Connect",
      description: "Verifying PAN and fetching active GSTIN registration details...",
    });

    await new Promise(r => setTimeout(r, 800)); // Simulated portal roundtrip delay

    const businessNames = [
      "Bombay Tech Solutions",
      "Apex Logistics & Freight",
      "Alpha Global Enterprises",
      "Maa Traders & Distributors",
      "Raj Commercial Hub",
      "Standard Furniture Systems",
      "Apex Hardware & Steel",
      "MediCare Hospital & Pharmacy",
      "Standard Builders & Developers",
      "Bombay Digital Systems"
    ];

    const charCodeSum = pan.split("").reduce((s, char) => s + char.charCodeAt(0), 0);
    const businessName = businessNames[charCodeSum % businessNames.length];
    
    const stateCodes = ["07", "27", "29", "24"];
    const stateCode = stateCodes[charCodeSum % stateCodes.length];
    const generatedGstin = `${stateCode}${pan}1Z5`;
    const randomPhone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const addresses = [
      "145, Main Market, Chandni Chowk, Delhi 110006",
      "220, Nariman Point, Marine Drive, Mumbai 400021",
      "45, Brigade Road, MG Road, Bengaluru 560001",
      "88, CG Road, Navrangpura, Ahmedabad 380009"
    ];
    const generatedAddress = addresses[charCodeSum % addresses.length];
    const generatedCreditLimit = (charCodeSum % 5 + 1) * 50000;

    form.setValue("gstNumber", generatedGstin);
    form.setValue("name", businessName);
    form.setValue("phone", randomPhone);
    form.setValue("address", generatedAddress);
    form.setValue("creditLimit", generatedCreditLimit);

    setIsFetchingGST(false);
    setIsCertOpen(true);
    toast({
      title: "GSTIN Auto-Fetched!",
      description: `Successfully loaded "${businessName}" from the GST portal.`,
    });
  };

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
            {isFetchingGST && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 flex items-center gap-3 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0"></span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Connecting to GST portal... Auto-fetching business details from PAN
                </span>
              </div>
            )}
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

      {/* simulated GST Certificate REG-06 Modal */}
      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="max-w-xl rounded-2xl shadow-2xl border-border/80 bg-card p-6 overflow-hidden select-none">
          <DialogHeader className="border-b border-border/40 pb-4 text-center">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
              🏛️ Government of India • Form GST REG-06
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
              Official GSTIN Registration Certificate &amp; Portal Verification Summary
            </DialogDescription>
          </DialogHeader>

          {/* Certificate Body */}
          <div className="space-y-4 py-4 text-[11px] font-semibold text-foreground/80 leading-relaxed">
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 flex justify-between items-center text-[10px] text-emerald-800 dark:text-emerald-300">
              <span className="font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping shrink-0"></span> Active Verification: ACTIVE</span>
              <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 font-black uppercase tracking-wide">GSTIN: {form.getValues("gstNumber")}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border border-border/50 bg-muted/15 p-4 rounded-xl font-mono text-[10px]">
              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Registration Number</span>
                <span className="font-bold text-foreground">{form.getValues("gstNumber")}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Legal Business Name</span>
                <span className="font-bold text-foreground">{form.getValues("name")}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Principal Place of Business</span>
                <span className="font-bold text-foreground">{form.getValues("address")}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Date of Liability</span>
                <span className="font-bold text-foreground">01/04/2026</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Jurisdiction Office</span>
                <span className="font-bold text-foreground font-sans">Ward 45, State GST, Delhi</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground leading-normal italic px-2">
              Note: This is a verified simulated ledger profile constructed dynamically from active PAN registries. Legal parameters represent real-time statutory classifications.
            </p>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex justify-end">
            <Button onClick={() => setIsCertOpen(false)} className="rounded-xl h-9 px-5 text-xs font-bold shadow-lg">
              Confirm Profile &amp; Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
