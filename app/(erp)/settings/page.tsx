"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  DollarSign,
  Banknote,
  Users,
  Settings,
  Layout,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Layers,
  Download,
  Loader2,
  User,
  Lock,
  ShieldAlert,
  UserPlus,
  PlusCircle,
  Trash2,
  Check,
  Building,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { getSettings, saveCompanySettings, saveFinancialSettings, saveTaxSettings, saveNotificationSettings } from "./actions";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRandomBillAction } from "./seeder-actions";
import { exportTallyXmlAction, exportGstr1JsonAction } from "./export-actions";

// Import custom profile/security and organization actions
import { updateProfileAction, changePasswordAction } from "./profile-actions";
import {
  getUserCompaniesAction,
  switchActiveCompanyAction,
  getOrganizationMembersAction,
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "../organization/actions";
import {
  createCompanyAndLedgersAction,
  getCurrentUserAction,
} from "@/app/onboarding/setup/actions";

function SeederConsole() {
  const [targetAmount, setTargetAmount] = useState<number>(25000);
  const [voucherType, setVoucherType] = useState<"sales" | "purchase">("sales");
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [isPending, setIsPending] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const triggerSeed = async () => {
    setIsPending(true);
    setSeedResult(null);
    try {
      const res = await generateRandomBillAction({
        targetAmount,
        voucherType,
        gstPercent,
      });

      if (mountedRef.current) {
        if (res.success) {
          setSeedResult(res);
          toast({
            title: "Random Bill Seeded!",
            description: `Generated ₹${targetAmount.toLocaleString("en-IN")} bill successfully!`,
          });
        } else {
          toast({
            title: "Seeding Failed",
            description: res.error || "Unknown error",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        toast({
          title: "Error Seeding",
          description: "Something went wrong during execution.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 bg-muted/20 p-5 rounded-2xl border border-border/60">
        <div>
          <Label htmlFor="seed-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Target Invoice Amount (₹)
          </Label>
          <Input
            id="seed-amount"
            type="number"
            min="100"
            max="500000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
            className="h-10 text-xs font-bold bg-background/55 border-border rounded-lg"
          />
          <span className="text-[10px] text-muted-foreground mt-1.5 block">
            Exact double-entry lines will resolve to this sum.
          </span>
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Transaction Voucher Type
          </Label>
          <Select
            onValueChange={(val: any) => setVoucherType(val)}
            value={voucherType}
          >
            <SelectTrigger className="w-full h-10 bg-background border-border rounded-lg text-xs font-bold">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sales" className="text-xs font-semibold">Sales Invoice (F8)</SelectItem>
              <SelectItem value="purchase" className="text-xs font-semibold">Purchase Voucher (F9)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            GST Duties Rate (%)
          </Label>
          <Select
            onValueChange={(val: any) => setGstPercent(parseInt(val))}
            value={String(gstPercent)}
          >
            <SelectTrigger className="w-full h-10 bg-background border-border rounded-lg text-xs font-bold">
              <SelectValue placeholder="GST Bracket" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="0" className="text-xs font-semibold">0% (Exempt)</SelectItem>
              <SelectItem value="5" className="text-xs font-semibold">5% (Handloom Sarees)</SelectItem>
              <SelectItem value="12" className="text-xs font-semibold">12% (Standard Sarees)</SelectItem>
              <SelectItem value="18" className="text-xs font-semibold">18% (Premium Fabrics)</SelectItem>
              <SelectItem value="28" className="text-xs font-semibold">28% (Luxury Collection)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end border-t border-border/30 pt-4">
        <Button
          type="button"
          onClick={triggerSeed}
          disabled={isPending || targetAmount <= 0}
          className="rounded-xl h-10 px-6 font-bold text-xs bg-amber-500 hover:bg-amber-600 shadow-md flex items-center gap-2 cursor-pointer text-white border-none"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling Balanced Ledger Entries...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              One-Click Generate Random Bill
            </>
          )}
        </Button>
      </div>

      {seedResult && (
        <Card className="border border-emerald-500/25 bg-emerald-500/5 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Success! Transaction Seeded Dynamically into SQLite</span>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 text-xs font-bold font-mono">
            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Party Name (Generated Customer)</div>
              <div className="text-primary text-sm font-extrabold">{seedResult.partyName}</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Seeded Item Allocation</div>
              <div className="text-primary text-sm font-extrabold">{seedResult.itemName} (Qty: {seedResult.quantity})</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Taxable Subtotal</div>
              <div className="text-primary text-sm">₹{seedResult.subtotal.toFixed(2)}</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Duties &amp; Taxes Added ({gstPercent}%)</div>
              <div className="text-accent text-sm">₹{seedResult.taxAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="text-center font-bold text-xs text-muted-foreground uppercase pt-2 select-none border-t border-border/30">
            Balanced Double-Entry Audit Posted: <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{targetAmount.toFixed(2)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [passwordState, setPasswordState] = useState({
    currentPass: "",
    newPass: "",
    confirmPass: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Invite Form State
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "accountant" | "auditor">("accountant");
  const [isInviting, setIsInviting] = useState(false);

  // Member management state
  const [isUpdatingMember, setIsUpdatingMember] = useState<string | null>(null);

  // Create Workspace Form State
  const [newWorkspace, setNewWorkspace] = useState({
    businessName: "",
    gstin: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPincode: "",
    businessPhone: "",
    businessEmail: "",
    businessType: "retail_saree",
    cashInHand: 0,
    bankBalance: 0,
  });
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    gstin: "",
    pan: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
  });
  const [financialSettings, setFinancialSettings] = useState({
    fiscalYearStart: "04-01",
    currencySymbol: "₹",
    currencyCode: "INR",
    numberFormat: "Indian",
  });
  const [taxSettings, setTaxSettings] = useState({
    gstApplicable: true,
    defaultGstRate: 18,
    TDSApplicable: false,
    defaultTDSRate: 10,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    paymentReminders: true,
    backupReminders: true,
  });

  const mountedRef = useRef(true);

  const loadUserData = async () => {
    const user = await getCurrentUserAction();
    if (user && mountedRef.current) {
      setCurrentUser(user);
      setProfileName(user.name || "");
    }
  };

  const loadCompanies = async () => {
    const companies = await getUserCompaniesAction();
    if (mountedRef.current) {
      setUserCompanies(companies);
    }
  };

  const loadMembers = async () => {
    const members = await getOrganizationMembersAction();
    if (mountedRef.current) {
      setOrgMembers(members);
    }
  };

  // Load settings on mount
  useEffect(() => {
    mountedRef.current = true;
    async function loadAll() {
      await loadUserData();
      await loadCompanies();
      await loadMembers();

      const settings = await getSettings();
      if (mountedRef.current && settings) {
        setCompanyInfo(settings.companyInfo);
        setFinancialSettings(settings.financialSettings);
        setTaxSettings(settings.taxSettings);
        setNotificationSettings(settings.notificationSettings);
      }
    }
    loadAll();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSave = async (tab: string) => {
    let res;
    switch (tab) {
      case "company":
        res = await saveCompanySettings(companyInfo);
        break;
      case "financial":
        res = await saveFinancialSettings(financialSettings);
        break;
      case "tax":
        res = await saveTaxSettings(taxSettings);
        break;
      case "notifications":
        res = await saveNotificationSettings(notificationSettings);
        break;
    }

    if (!mountedRef.current) return;

    if (res?.success) {
      toast({
        title: "Settings Saved",
        description: `${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved successfully!`,
      });
    } else {
      toast({
        title: "Error Saving Settings",
        description: res?.error || "An unknown error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsUpdatingProfile(true);
    const res = await updateProfileAction(profileName);
    setIsUpdatingProfile(false);
    if (res.success) {
      toast({
        title: "Profile Updated",
        description: "Your display name has been updated.",
      });
      await loadUserData();
    } else {
      toast({
        title: "Update Failed",
        description: res.error || "Could not update profile.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPass || !passwordState.newPass || !passwordState.confirmPass) {
      toast({
        title: "Validation Error",
        description: "All password fields are required.",
        variant: "destructive",
      });
      return;
    }
    if (passwordState.newPass !== passwordState.confirmPass) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (passwordState.newPass.length < 8) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    const res = await changePasswordAction({
      currentPass: passwordState.currentPass,
      newPass: passwordState.newPass,
    });
    setIsChangingPassword(false);
    if (res.success) {
      toast({
        title: "Password Changed",
        description: "Your security credentials have been updated.",
      });
      setPasswordState({ currentPass: "", newPass: "", confirmPass: "" });
    } else {
      toast({
        title: "Error",
        description: res.error || "Could not change password.",
        variant: "destructive",
      });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setIsInviting(true);
    const res = await inviteMemberAction(inviteUsername, inviteRole);
    setIsInviting(false);
    if (res.success) {
      toast({
        title: "User Invited",
        description: `Successfully invited user "${inviteUsername}" to this workspace.`,
      });
      setInviteUsername("");
      await loadMembers();
    } else {
      toast({
        title: "Invitation Failed",
        description: res.error || "Could not invite user.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, role: "owner" | "accountant" | "auditor") => {
    setIsUpdatingMember(userId);
    const res = await updateMemberRoleAction(userId, role);
    setIsUpdatingMember(null);
    if (res.success) {
      toast({
        title: "Role Updated",
        description: "Member's role updated successfully.",
      });
      await loadMembers();
    } else {
      toast({
        title: "Update Failed",
        description: res.error || "Could not update member role.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) return;
    setIsUpdatingMember(userId);
    const res = await removeMemberAction(userId);
    setIsUpdatingMember(null);
    if (res.success) {
      toast({
        title: "Member Removed",
        description: "Member removed from the workspace successfully.",
      });
      await loadMembers();
    } else {
      toast({
        title: "Removal Failed",
        description: res.error || "Could not remove member.",
        variant: "destructive",
      });
    }
  };

  const handleSwitchCompany = async (companyId: string) => {
    const res = await switchActiveCompanyAction(companyId);
    if (res.success) {
      toast({
        title: "Workspace Switched",
        description: "Successfully switched to the selected organization.",
      });
      window.location.reload();
    } else {
      toast({
        title: "Switch Failed",
        description: res.error || "Could not switch workspace.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspace.businessName.trim()) {
      toast({
        title: "Validation Error",
        description: "Business name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Active session not found.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingWorkspace(true);
    const res = await createCompanyAndLedgersAction({
      businessName: newWorkspace.businessName,
      gstin: newWorkspace.gstin,
      businessAddress: newWorkspace.businessAddress,
      businessCity: newWorkspace.businessCity,
      businessState: newWorkspace.businessState,
      businessPincode: newWorkspace.businessPincode,
      businessPhone: newWorkspace.businessPhone,
      businessEmail: newWorkspace.businessEmail,
      businessType: newWorkspace.businessType,
      cashInHand: Number(newWorkspace.cashInHand) || 0,
      bankBalance: Number(newWorkspace.bankBalance) || 0,
      ownerName: currentUser.name,
      username: currentUser.username,
    });
    setIsCreatingWorkspace(false);

    if (res.success) {
      toast({
        title: "Workspace Created",
        description: `Successfully created "${newWorkspace.businessName}" workspace!`,
      });
      // Reset form
      setNewWorkspace({
        businessName: "",
        gstin: "",
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessPincode: "",
        businessPhone: "",
        businessEmail: "",
        businessType: "retail_saree",
        cashInHand: 0,
        bankBalance: 0,
      });
      // Full page reload so active session is switched to the new workspace!
      window.location.reload();
    } else {
      toast({
        title: "Creation Failed",
        description: res.error || "Could not create workspace.",
        variant: "destructive",
      });
    }
  };

  const isOwner = currentUser?.role === "owner";

  return (
    <div className="min-h-screen p-4 font-sans max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl border border-border/60 hover:bg-muted transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">System Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your profile, workspaces, billing accounts and system configurations.</p>
          </div>
        </div>
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2.5 bg-muted/30 border border-border/50 px-3.5 py-1.5 rounded-2xl select-none">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10.5px] font-black text-accent-foreground uppercase">
              {currentUser.name ? currentUser.name.substring(0, 2) : "US"}
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Active Workspace</div>
              <div className="text-xs font-black text-foreground mt-0.5 leading-none">{companyInfo.name || "Loading..."}</div>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="flex flex-wrap gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/30 h-auto w-full">
          <TabsTrigger value="profile" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <User className="h-3.5 w-3.5 text-blue-500" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Lock className="h-3.5 w-3.5 text-red-500" />
            Security
          </TabsTrigger>
          <TabsTrigger value="organization" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Users className="h-3.5 w-3.5 text-teal-500" />
            Workspaces &amp; Members
          </TabsTrigger>
          <TabsTrigger value="company" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Building2 className="h-3.5 w-3.5 text-orange-500" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="financial" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="tax" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Banknote className="h-3.5 w-3.5 text-violet-500" />
            Taxation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <MessageCircle className="h-3.5 w-3.5 text-pink-500" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="ca-portal" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            CA Export
          </TabsTrigger>
          <TabsTrigger value="random-seeder" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            Random Seeder
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <User className="w-5 h-5 text-blue-500" />
                My Account Profile
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Update your display name and review account authorization metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 bg-muted/20 p-5 rounded-2xl border border-border/50">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="space-y-1.5 flex-1 w-full text-center md:text-left">
                    <div className="text-sm font-black text-primary uppercase tracking-wide">
                      {currentUser?.name || "Loading..."}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Username: <span className="font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded">@{currentUser?.username || "loading"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Authorization Class: <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{currentUser?.role || "loading"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Full Name / Display Name
                  </Label>
                  <Input
                    id="profile-name"
                    placeholder="Enter your name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This is what other members in your active organizations will see.
                  </p>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="rounded-xl h-10 px-6 font-bold text-xs bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-md"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Saving Profile...
                      </>
                    ) : (
                      "Save Profile Details"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Lock className="w-5 h-5 text-red-500" />
                Security Credentials
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Ensure maximum defense by changing passwords regularly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Current Password
                    </Label>
                    <Input
                      id="current-pass"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordState.currentPass}
                      onChange={(e) => setPasswordState(prev => ({ ...prev, currentPass: e.target.value }))}
                      required
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        New Password
                      </Label>
                      <Input
                        id="new-pass"
                        type="password"
                        placeholder="Must be at least 8 characters"
                        value={passwordState.newPass}
                        onChange={(e) => setPasswordState(prev => ({ ...prev, newPass: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-pass"
                        type="password"
                        placeholder="Re-enter new password"
                        value={passwordState.confirmPass}
                        onChange={(e) => setPasswordState(prev => ({ ...prev, confirmPass: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="rounded-xl h-10 px-6 font-bold text-xs bg-red-500 hover:bg-red-600 text-white cursor-pointer shadow-md"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Verifying &amp; Re-Keying...
                      </>
                    ) : (
                      "Change Passphrase"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Workspace Switcher & Member Management */}
        <TabsContent value="organization" className="space-y-6">
          {/* Active Workspace / Switching */}
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Briefcase className="w-5 h-5 text-teal-500" />
                Multi-Tenant Organization Switcher
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Switch seamlessly between different businesses and billing scopes using your active credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {userCompanies.map((c) => {
                  const isActive = currentUser?.companyId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => !isActive && handleSwitchCompany(c.id)}
                      className={`relative p-5 rounded-2xl border transition-all select-none duration-300 flex flex-col justify-between h-36 ${
                        isActive
                          ? "border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-lg cursor-default"
                          : "border-border/60 hover:border-teal-500/40 bg-muted/10 hover:bg-muted/20 cursor-pointer"
                      }`}
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center justify-between">
                          <span>Workspace</span>
                          {isActive && (
                            <span className="bg-teal-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-primary truncate leading-tight mt-1">{c.name}</h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-3">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          Role: <span className="font-extrabold text-teal-600 dark:text-teal-400">{c.role}</span>
                        </span>
                        {!isActive && (
                          <span className="text-[10px] text-teal-500 font-extrabold hover:underline">
                            Switch &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Members list & Invitation */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Members List Table */}
            <Card className="lg:col-span-2 border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/40 py-5 px-6">
                <CardTitle className="text-md font-extrabold flex items-center gap-2 text-primary">
                  <Users className="w-4.5 h-4.5 text-teal-500" />
                  Workspace Members
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Audit, update, or revoke authorization settings for collaborators within this business.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Username</th>
                        <th className="p-3.5">Assigned Role</th>
                        {isOwner && <th className="p-3.5 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {orgMembers.map((m) => {
                        const isSelf = m.id === currentUser?.id;
                        return (
                          <tr key={m.id} className="hover:bg-muted/15 transition-colors font-medium">
                            <td className="p-3.5 text-primary font-bold">
                              {m.name} {isSelf && <span className="text-[10px] font-black text-muted-foreground">(You)</span>}
                            </td>
                            <td className="p-3.5 text-muted-foreground font-mono">@{m.username}</td>
                            <td className="p-3.5">
                              {isOwner && !isSelf ? (
                                <Select
                                  defaultValue={m.role}
                                  onValueChange={(val: any) => handleUpdateRole(m.id, val)}
                                  disabled={isUpdatingMember === m.id}
                                >
                                  <SelectTrigger className="w-28 h-8 rounded-lg text-[10px] font-bold border-border bg-background shadow-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="owner" className="text-xs font-semibold text-red-500">Owner</SelectItem>
                                    <SelectItem value="accountant" className="text-xs font-semibold text-blue-500">Accountant</SelectItem>
                                    <SelectItem value="auditor" className="text-xs font-semibold text-green-500">Auditor</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className={`text-[10px] uppercase tracking-widest font-extrabold ${
                                  m.role === "owner"
                                    ? "text-red-500 bg-red-500/10"
                                    : m.role === "accountant"
                                    ? "text-blue-500 bg-blue-500/10"
                                    : "text-green-500 bg-green-500/10"
                                } px-2 py-0.5 rounded-full`}>
                                  {m.role}
                                </span>
                              )}
                            </td>
                            {isOwner && (
                              <td className="p-3.5 text-right">
                                {!isSelf ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveMember(m.id)}
                                    disabled={isUpdatingMember === m.id}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                                    title="Revoke access"
                                  >
                                    {isUpdatingMember === m.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic font-normal pr-2">Protected</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invite Form (Owner Only) */}
            <Card className="border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 border-b border-border/40 py-5 px-6">
                  <CardTitle className="text-md font-extrabold flex items-center gap-2 text-primary">
                    <UserPlus className="w-4.5 h-4.5 text-teal-500" />
                    Invite Collaborator
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Assign a role and grant instant workspace clearance to an existing system user.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {isOwner ? (
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-username" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          User's Username
                        </Label>
                        <Input
                          id="invite-username"
                          placeholder="e.g., john_doe"
                          value={inviteUsername}
                          onChange={(e) => setInviteUsername(e.target.value)}
                          required
                          className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                        />
                        <span className="text-[9px] text-muted-foreground mt-1.5 block">
                          The user must already have a system login.
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Assign Permission Role
                        </Label>
                        <Select
                          onValueChange={(val: any) => setInviteRole(val)}
                          value={inviteRole}
                        >
                          <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Select Permission Role" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="owner" className="text-xs font-semibold text-red-500">Owner (Admin access)</SelectItem>
                            <SelectItem value="accountant" className="text-xs font-semibold text-blue-500">Accountant (Standard read/write)</SelectItem>
                            <SelectItem value="auditor" className="text-xs font-semibold text-green-500">Auditor (Read-only verification)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        disabled={isInviting || !inviteUsername}
                        className="w-full rounded-xl h-10 font-bold text-xs bg-teal-500 hover:bg-teal-600 text-white cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isInviting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending Clearance...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Grant Workspace Access
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/20 border border-border/55 rounded-2xl h-44">
                      <ShieldAlert className="w-8 h-8 text-amber-500 mb-2.5" />
                      <div className="text-xs font-extrabold text-primary">Invitation Desk Locked</div>
                      <div className="text-[10px] text-muted-foreground max-w-[200px] mt-1">
                        Only members holding the <strong>Owner</strong> security role can issue invitations.
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Create New Workspace */}
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <PlusCircle className="w-5 h-5 text-teal-500 animate-pulse" />
                Initialize New Workspace / Business Unit
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Spawn another company dynamic ledger database instantly. You will automatically become the Workspace Owner.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-biz-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Business Unit / Workspace Name
                    </Label>
                    <Input
                      id="new-biz-name"
                      placeholder="e.g., Shree Saree Wholesale, Rokado Inc."
                      value={newWorkspace.businessName}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-gstin" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      GSTIN (Optional)
                    </Label>
                    <Input
                      id="new-biz-gstin"
                      placeholder="15-digit GST identification number"
                      value={newWorkspace.gstin}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, gstin: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-biz-type" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Business Framework Segment
                    </Label>
                    <Select
                      onValueChange={(val: any) => setNewWorkspace(prev => ({ ...prev, businessType: val }))}
                      value={newWorkspace.businessType}
                    >
                      <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                        <SelectValue placeholder="Select Business Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="wholesale_saree" className="text-xs font-semibold">Wholesale Saree/Textiles</SelectItem>
                        <SelectItem value="textile_retail" className="text-xs font-semibold">Retail Fabrics / Textiles</SelectItem>
                        <SelectItem value="general_trade" className="text-xs font-semibold">General Trading &amp; Distribution</SelectItem>
                        <SelectItem value="service_provider" className="text-xs font-semibold">Professional Services</SelectItem>
                        <SelectItem value="generic_business" className="text-xs font-semibold">Generic Ledger Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <Input
                      id="new-biz-phone"
                      placeholder="e.g., +91 9876543210"
                      value={newWorkspace.businessPhone}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessPhone: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Email Address
                    </Label>
                    <Input
                      id="new-biz-email"
                      type="email"
                      placeholder="billing@company.com"
                      value={newWorkspace.businessEmail}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessEmail: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-biz-address" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Full Commercial Address
                  </Label>
                  <Input
                    id="new-biz-address"
                    placeholder="Street name, corporate park room, building name"
                    value={newWorkspace.businessAddress}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessAddress: e.target.value }))}
                    className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-biz-city" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      City
                    </Label>
                    <Input
                      id="new-biz-city"
                      placeholder="City"
                      value={newWorkspace.businessCity}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessCity: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-state" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      State / UT
                    </Label>
                    <Input
                      id="new-biz-state"
                      placeholder="State"
                      value={newWorkspace.businessState}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessState: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-pin" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      PIN Code
                    </Label>
                    <Input
                      id="new-biz-pin"
                      placeholder="6-digit postal code"
                      maxLength={6}
                      value={newWorkspace.businessPincode}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessPincode: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4 space-y-4">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Opening Liquid Accounts Capital (Seeded Double-Entry Ledgers)
                  </h4>

                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-biz-cash" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Initial Cash-In-Hand Balance (₹)
                      </Label>
                      <Input
                        id="new-biz-cash"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newWorkspace.cashInHand || ""}
                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, cashInHand: parseFloat(e.target.value) || 0 }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                      <span className="text-[9px] text-muted-foreground block">
                        Will seed opening balance for Cash ledger.
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-biz-bank" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Initial Bank Balance (₹)
                      </Label>
                      <Input
                        id="new-biz-bank"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newWorkspace.bankBalance || ""}
                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, bankBalance: parseFloat(e.target.value) || 0 }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                      <span className="text-[9px] text-muted-foreground block">
                        Will seed opening balance for Bank/Current ledger.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4">
                  <Button
                    type="submit"
                    disabled={isCreatingWorkspace}
                    className="rounded-xl h-10 px-6 font-bold text-xs bg-teal-500 hover:bg-teal-600 text-white cursor-pointer shadow-md flex items-center gap-2"
                  >
                    {isCreatingWorkspace ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Ledgers &amp; Tables...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 text-white" />
                        Complete Workspace Provisioning
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Company Information */}
        <TabsContent value="company">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5 text-orange-500" />
                Active Organization / Company Details
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Update billing, contact, tax identity, and details for the active workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("company");
              }}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstin" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GSTIN</Label>
                      <Input
                        id="gstin"
                        placeholder="Enter GSTIN (optional)"
                        value={companyInfo.gstin}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pan" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PAN</Label>
                      <Input
                        id="pan"
                        placeholder="Enter PAN (optional)"
                        value={companyInfo.pan}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, pan: e.target.value }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website URL</Label>
                      <Input
                        id="website"
                        placeholder="Enter website URL"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Corporate/Business Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address, building name"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                      required
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</Label>
                      <Input
                        id="city"
                        placeholder="Enter city"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</Label>
                      <Input
                        id="state"
                        placeholder="Enter state"
                        value={companyInfo.state}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, state: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">PIN Code</Label>
                      <Input
                        id="pincode"
                        placeholder="Enter PIN code"
                        value={companyInfo.pincode}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, pincode: e.target.value }))}
                        required
                        maxLength={6}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                      <Input
                        id="email"
                        placeholder="Enter email"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4 border-t border-border/30 mt-6 px-0 pb-0">
                  <Button
                    variant="default"
                    type="submit"
                    className="px-6 rounded-xl h-10 font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-md"
                  >
                    Save Company Information
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Financial Settings */}
        <TabsContent value="financial">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Financial Settings
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Configure your financial year start, currency symbols, and standard number presentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("financial");
              }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fiscalYearStart" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Financial Year Start Date</Label>
                  <div className="flex items-center gap-3">
                    <Layout className="w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fiscalYearStart"
                      placeholder="MM-DD"
                      value={financialSettings.fiscalYearStart}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                      maxLength={5}
                      pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl max-w-44 text-center font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Format: MM-DD (e.g., 04-01 for April 1st)
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFinancialSettings(prev => ({ ...prev, fiscalYearStart: "04-01" }))}
                    className="text-xs font-bold h-9 rounded-lg border-border hover:bg-emerald-500/5 cursor-pointer"
                  >
                    Use Indian Financial Year (April 1 - March 31)
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/30 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currency Symbol</Label>
                    <Input
                      id="currencySymbol"
                      placeholder="e.g., ₹, $, €"
                      value={financialSettings.currencySymbol}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currencyCode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currency Code</Label>
                    <Input
                      id="currencyCode"
                      placeholder="e.g., INR, USD, EUR"
                      value={financialSettings.currencyCode}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, currencyCode: e.target.value.toUpperCase() }))}
                      maxLength={3}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/30 pt-6">
                  <Label htmlFor="numberFormat" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number Notation Format</Label>
                  <Select
                    onValueChange={(val: any) => setFinancialSettings(prev => ({ ...prev, numberFormat: val }))}
                    value={financialSettings.numberFormat}
                  >
                    <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Select Number Notation Style" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Indian" className="text-xs font-semibold">Indian Format (Lakhs &amp; Crores: 1,00,000.00)</SelectItem>
                      <SelectItem value="International" className="text-xs font-semibold">International Format (Thousands &amp; Millions: 100,000.00)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Select how debit/credit ledger sheets render transaction values.
                  </p>
                </div>

                <CardFooter className="flex justify-end pt-4 border-t border-border/30 mt-6 px-0 pb-0">
                  <Button
                    variant="default"
                    type="submit"
                    className="px-6 rounded-xl h-10 font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-md"
                  >
                    Save Financial Settings
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Taxation */}
        <TabsContent value="tax">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/5 via-transparent to-violet-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Banknote className="w-5 h-5 text-violet-500" />
                Tax Configuration
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Set active defaults for goods and services tax (GST) and TDS thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("tax");
              }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15">
                    <div className="space-y-0.5">
                      <Label htmlFor="gstApplicable" className="text-xs font-extrabold text-primary uppercase tracking-wider block">GST Tax Applicability</Label>
                      <span className="text-[10px] text-muted-foreground block">Enable calculations of Central/State GST in sales billing.</span>
                    </div>
                    <Switch
                      id="gstApplicable"
                      checked={taxSettings.gstApplicable}
                      onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, gstApplicable: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  {taxSettings.gstApplicable && (
                    <div className="p-5 rounded-2xl border border-border/60 bg-muted/15 space-y-4 animate-in fade-in slide-in-from-top-1.5 duration-200">
                      <div className="space-y-2">
                        <Label htmlFor="defaultGstRate" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default GST Bracket (%)</Label>
                        <div className="flex items-center gap-3">
                          <Banknote className="w-5 h-5 text-muted-foreground" />
                          <Input
                            id="defaultGstRate"
                            type="number"
                            min="0"
                            max="28"
                            step="0.1"
                            placeholder="e.g., 18"
                            value={String(taxSettings.defaultGstRate)}
                            onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultGstRate: parseFloat(e.target.value) || 0 }))}
                            className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl max-w-44 text-center font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            Applied automatically on new item ledger provisioning.
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setTaxSettings(prev => ({ ...prev, defaultGstRate: 18 }))} className="text-[10px] font-bold rounded-lg border-border cursor-pointer">Set standard 18%</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setTaxSettings(prev => ({ ...prev, defaultGstRate: 12 }))} className="text-[10px] font-bold rounded-lg border-border cursor-pointer">Set handloom standard 12%</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setTaxSettings(prev => ({ ...prev, defaultGstRate: 5 }))} className="text-[10px] font-bold rounded-lg border-border cursor-pointer">Set handloom basic 5%</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="TDSApplicable" className="text-xs font-extrabold text-primary uppercase tracking-wider block">TDS Deductible (Tax Deducted at Source)</Label>
                      <span className="text-[10px] text-muted-foreground block">Flag payments to creditors for automatic TDS ledger deduction.</span>
                    </div>
                    <Switch
                      id="TDSApplicable"
                      checked={taxSettings.TDSApplicable}
                      onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, TDSApplicable: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  {taxSettings.TDSApplicable && (
                    <div className="p-5 rounded-2xl border border-border/60 bg-muted/15 space-y-4 animate-in fade-in slide-in-from-top-1.5 duration-200">
                      <div className="space-y-2">
                        <Label htmlFor="defaultTDSRate" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default TDS Deduction Rate (%)</Label>
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <Input
                            id="defaultTDSRate"
                            type="number"
                            min="0"
                            max="30"
                            step="0.1"
                            placeholder="e.g., 10"
                            value={String(taxSettings.defaultTDSRate)}
                            onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultTDSRate: parseFloat(e.target.value) || 0 }))}
                            className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl max-w-44 text-center font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            Standard: 1% for individuals, 2% for firms, 10% for rent/professional services.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <CardFooter className="flex justify-end pt-4 border-t border-border/30 mt-6 px-0 pb-0">
                  <Button
                    variant="default"
                    type="submit"
                    className="px-6 rounded-xl h-10 font-bold text-xs bg-violet-500 hover:bg-violet-600 text-white cursor-pointer shadow-md"
                  >
                    Save Tax Settings
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Alerts */}
        <TabsContent value="notifications">
          <Card className="w-full border-border/80 bg-card/65 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500/5 via-transparent to-pink-500/5 border-b border-border/40 py-5 px-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Configure when and through which channels the engine delivers ledger and compliance notices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("notifications");
              }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications" className="text-xs font-extrabold text-primary uppercase tracking-wider block">Email Transaction Advices</Label>
                      <span className="text-[10px] text-muted-foreground block">Send PDF copies of invoices automatically to customer contact list.</span>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications" className="text-xs font-extrabold text-primary uppercase tracking-wider block">SMS Outbox Alerts</Label>
                      <span className="text-[10px] text-muted-foreground block">Deliver immediate SMS alerts on sales dispatch to registered mobile numbers.</span>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="lowStockAlerts" className="text-xs font-extrabold text-primary uppercase tracking-wider block">Inventory Low Reorder Levels</Label>
                      <span className="text-[10px] text-muted-foreground block">Trigger system dashboard warnings if fabric stock quantities dip below threshold.</span>
                    </div>
                    <Switch
                      id="lowStockAlerts"
                      checked={notificationSettings.lowStockAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15">
                    <div className="space-y-0.5">
                      <Label htmlFor="paymentReminders" className="text-xs font-extrabold text-primary uppercase tracking-wider block">Outstanding Payment Reminders</Label>
                      <span className="text-[10px] text-muted-foreground block">Generate reminders on Sundry Debtor accounts 3 days before payment due dates.</span>
                    </div>
                    <Switch
                      id="paymentReminders"
                      checked={notificationSettings.paymentReminders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentReminders: checked }))}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/15">
                    <div className="space-y-0.5">
                      <Label htmlFor="backupReminders" className="text-xs font-extrabold text-primary uppercase tracking-wider block">Cloud Backup Sync Alerts</Label>
                      <span className="text-[10px] text-muted-foreground block">Notify when offline SQLite ledger rows are awaiting cloud synchronization.</span>
                    </div>
                    <Switch
                      id="backupReminders"
                      checked={notificationSettings.backupReminders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, backupReminders: checked }))}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4 border-t border-border/30 mt-6 px-0 pb-0">
                  <Button
                    variant="default"
                    type="submit"
                    className="px-6 rounded-xl h-10 font-bold text-xs bg-pink-500 hover:bg-pink-600 text-white cursor-pointer shadow-md"
                  >
                    Save Notification Preferences
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: CA Export */}
        <TabsContent value="ca-portal">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 border-b border-border/60 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Layers className="w-5 h-5 text-indigo-500" />
                Chartered Accountant Collaboration Desk
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Generate and download balanced audit registers, tax records, and direct Tally ERP formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* TALLY EXPORTER */}
                <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-4 hover:border-indigo-500/35 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-primary">Tally XML Ledger Exporter</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Export your entire Chart of Accounts structured to match Tally's schema for direct importing.
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded shrink-0">
                      XML FORMAT
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold border-border/80 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={async () => {
                      const res = await exportTallyXmlAction();
                      if (res.success && res.content) {
                        const blob = new Blob([res.content], { type: "text/xml" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = res.filename;
                        link.click();
                        toast({ title: "Tally XML Exported", description: "Ledger XML file downloaded successfully!" });
                      } else {
                        toast({ title: "Export Error", description: res.error || "Unknown error", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Tally XML ledgers
                  </Button>
                </div>

                {/* GST EXPORTER */}
                <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-4 hover:border-indigo-500/35 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-primary">GSTR-1 Sales Compliance Exporter</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consolidate GST transactions grouped by customers' GSTIN for quarterly tax filing preparation.
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded shrink-0">
                      JSON FILE
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold border-border/80 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={async () => {
                      const res = await exportGstr1JsonAction();
                      if (res.success && res.content) {
                        const blob = new Blob([res.content], { type: "application/json" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = res.filename;
                        link.click();
                        toast({ title: "GSTR-1 JSON Generated", description: "B2B sales JSON package downloaded!" });
                      } else {
                        toast({ title: "Export Error", description: res.error || "Unknown error", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Validated GSTR-1
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Random Seeder */}
        <TabsContent value="random-seeder">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 border-b border-border/60 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                Dynamic Demo Random Seeder Panel
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Generate highly realistic, balanced transactions on the fly to test accounting sheets, inventory triggers, and dashboard graphs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <SeederConsole />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-sans bg-background">
        <div className="flex flex-col items-center gap-3 bg-card/60 border border-border p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Re-Keying Ledgers...</span>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
