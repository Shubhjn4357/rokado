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
import { backupDatabaseAction, restoreDatabaseAction } from "./backup-actions";
import { getSyncConflictsAction, resolveConflictAction } from "../actions/sync-actions";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportTallyXmlAction, exportGstr1JsonAction } from "./export-actions";
import { StateEnum, CurrencyEnum, CurrencySymbolEnum } from "@/constant/app.constant";

// Import custom profile/security and organization actions
import { updateProfileAction, changePasswordAction } from "./profile-actions";
import {
  getUserCompaniesAction,
  switchActiveCompanyAction,
  getOrganizationMembersAction,
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
  deleteCompanyAction,
} from "../organization/actions";
import {
  createCompanyAndLedgersAction,
  getCurrentUserAction,
} from "@/app/onboarding/setup/actions";

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync conflicts state
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadConflicts = async () => {
    try {
      const list = await getSyncConflictsAction();
      setConflicts(list);
    } catch {
      // ignore
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await backupDatabaseAction();
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rokado_erp_backup_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Database Exported",
          description: "JSON database backup downloaded successfully.",
        });
      } else {
        throw new Error(res.error || "Failed to download backup");
      }
    } catch (err) {
      toast({
        title: "Backup Failed",
        description: err instanceof Error ? err.message : "Database export failed.",
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: Restoring will overwrite all active transactions, ledger sheets, inventory lists, and settings. Are you absolutely sure you want to proceed?")) {
      e.target.value = "";
      return;
    }

    setRestoreLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result;
        if (typeof text !== "string") {
          toast({
            title: "Restore Failed",
            description: "Could not read file.",
            variant: "destructive",
          });
          setRestoreLoading(false);
          return;
        }

        const res = await restoreDatabaseAction(text);
        if (res.success) {
          toast({
            title: "Database Restored",
            description: "All database sheets populated successfully. Reloading workspace...",
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast({
            title: "Restore Failed",
            description: res.error || "Database write transaction failed.",
            variant: "destructive",
          });
          setRestoreLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      toast({
        title: "Restore Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      });
      setRestoreLoading(false);
    }
  };

  const handleResolveConflict = async (id: string, resolution: "local" | "server") => {
    setResolvingId(id);
    try {
      const res = await resolveConflictAction(id, resolution);
      if (res.success) {
        toast({
          title: "Conflict Resolved",
          description: resolution === "local" ? "Forced local change to retry sync." : "Accepted cloud server state and discarded local write.",
        });
        await loadConflicts();
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      toast({
        title: "Resolution Failed",
        description: err instanceof Error ? err.message : "Failed to solve sync conflict.",
        variant: "destructive",
      });
    } finally {
      setResolvingId(null);
    }
  };

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
    pan: "",
    startingCapital: 0,
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPincode: "",
    businessPhone: "",
    businessEmail: "",
    businessType: "retail_store",
    cashInHand: 0,
    bankBalance: 0,
  });
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const [isFetchingWorkspaceGST, setIsFetchingWorkspaceGST] = useState(false);
  const [isWorkspaceCertOpen, setIsWorkspaceCertOpen] = useState(false);

  useEffect(() => {
    if (!newWorkspace.pan) return;
    const cleanPan = newWorkspace.pan.toUpperCase().trim();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (panRegex.test(cleanPan)) {
      triggerWorkspacePortalFetch(cleanPan);
    }
  }, [newWorkspace.pan]);

  const triggerWorkspacePortalFetch = async (pan: string) => {
    setIsFetchingWorkspaceGST(true);
    
    await new Promise(r => setTimeout(r, 1200));

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
    const cities = ["Delhi", "Mumbai", "Bengaluru", "Ahmedabad"];
    const states = ["Delhi", "Maharashtra", "Karnataka", "Gujarat"];
    const pincodes = ["110006", "400021", "560001", "380009"];

    const idx = charCodeSum % addresses.length;
    const generatedAddress = addresses[idx];
    const generatedCity = cities[idx];
    const generatedState = states[idx];
    const generatedPincode = pincodes[idx];

    setNewWorkspace(prev => ({
      ...prev,
      gstin: generatedGstin,
      businessName: businessName,
      businessPhone: randomPhone,
      businessAddress: generatedAddress,
      businessCity: generatedCity,
      businessState: generatedState,
      businessPincode: generatedPincode,
      businessEmail: `office@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`
    }));

    setIsFetchingWorkspaceGST(false);
    setIsWorkspaceCertOpen(true);
  };

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
    defaultTemplate: "minimalist",
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
      await loadConflicts();

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

  const handleDeleteCompany = async () => {
    if (!currentUser?.companyId) return;
    const companyName = userCompanies.find(c => c.id === currentUser.companyId)?.name || "this business";
    const confirmText = prompt(`WARNING: To permanently delete "${companyName}" and ALL of its accounting data (ledgers, vouchers, and settings), type the business name EXACTLY:`);

    if (confirmText !== companyName) {
      toast({
        title: "Delete Cancelled",
        description: "Business name verification failed.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingWorkspace(true);
    try {
      const res = await deleteCompanyAction(currentUser.companyId);
      if (res.success) {
        toast({
          title: "Organization Deleted",
          description: `Successfully wiped out "${companyName}" workspace!`,
        });
        window.location.reload();
      } else {
        toast({
          title: "Delete Failed",
          description: res.error || "Failed to wipe workspace.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Delete Error",
        description: "An unexpected error occurred during database wipe.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingWorkspace(false);
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
      pan: newWorkspace.pan,
      startingCapital: newWorkspace.startingCapital,
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
        pan: "",
        startingCapital: 0,
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessPincode: "",
        businessPhone: "",
        businessEmail: "",
        businessType: "retail_store",
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
        <TabsList id="tour-settings-tabs" className="flex flex-wrap gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/30 h-auto w-full">
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
          <TabsTrigger value="backup" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Download className="h-3.5 w-3.5 text-blue-500" />
            Data Backup &amp; Restore
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="cursor-pointer text-[11px] font-extrabold py-2 px-3.5 rounded-xl flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            Sync Conflicts
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
                {isFetchingWorkspaceGST && (
                  <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-3.5 flex items-center gap-3 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping shrink-0"></span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      Accessing government GSTIN database... Fetching company registration details from PAN
                    </span>
                  </div>
                )}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-biz-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Business Unit / Workspace Name
                    </Label>
                    <Input
                      id="new-biz-name"
                      placeholder="e.g.,   Wholesale, Rokado Inc."
                      value={newWorkspace.businessName}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-biz-gstin" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        GSTIN (Optional)
                      </Label>
                      <Input
                        id="new-biz-gstin"
                        placeholder="15-digit GSTIN"
                        value={newWorkspace.gstin}
                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, gstin: e.target.value }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-biz-pan" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        PAN (Optional)
                      </Label>
                      <Input
                        id="new-biz-pan"
                        placeholder="10-digit PAN"
                        value={newWorkspace.pan}
                        onChange={(e) => setNewWorkspace(prev => ({ ...prev, pan: e.target.value }))}
                        className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                      />
                    </div>
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
                        <SelectItem value="retail_store" className="text-xs font-semibold">Retail Store</SelectItem>
                        <SelectItem value="wholesale_dist" className="text-xs font-semibold">Wholesale &amp; Distribution</SelectItem>
                        <SelectItem value="general_services" className="text-xs font-semibold">General Services / Agency</SelectItem>
                        <SelectItem value="apparel_garment" className="text-xs font-semibold">Apparel &amp; Garments</SelectItem>
                        <SelectItem value="manufacturing" className="text-xs font-semibold">Manufacturing / Assembly</SelectItem>
                        <SelectItem value="custom" className="text-xs font-semibold">Custom Business</SelectItem>
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
                    <Select
                      onValueChange={(val) => setNewWorkspace(prev => ({ ...prev, businessState: val }))}
                      value={newWorkspace.businessState}
                    >
                      <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[300px]">
                        {Object.values(StateEnum).map((stateName) => (
                          <SelectItem key={stateName} value={stateName} className="text-xs font-semibold">
                            {stateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="new-biz-capital" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Starting Capital Invested (Optional)
                    </Label>
                    <Input
                      id="new-biz-capital"
                      type="number"
                      min="0"
                      placeholder={`₹ ${(newWorkspace.cashInHand + newWorkspace.bankBalance) || 0}`}
                      value={newWorkspace.startingCapital || ""}
                      onChange={(e) => setNewWorkspace(prev => ({ ...prev, startingCapital: parseFloat(e.target.value) || 0 }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl"
                    />
                    <span className="text-[9px] text-muted-foreground block">
                      Total initial capital invested. If left empty, it will default to Cash + Bank (₹{((newWorkspace.cashInHand + newWorkspace.bankBalance) || 0).toLocaleString("en-IN")}).
                    </span>
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

          {/* simulated GST Certificate REG-06 Modal */}
          <Dialog open={isWorkspaceCertOpen} onOpenChange={setIsWorkspaceCertOpen}>
            <DialogContent className="max-w-xl rounded-2xl shadow-2xl border-border/80 bg-card p-6 overflow-hidden select-none text-xs">
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
                  <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 font-black uppercase tracking-wide">GSTIN: {newWorkspace.gstin}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-border/50 bg-muted/15 p-4 rounded-xl font-mono text-[10px]">
                  <div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Registration Number</span>
                    <span className="font-bold text-foreground">{newWorkspace.gstin}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Legal Business Name</span>
                    <span className="font-bold text-foreground">{newWorkspace.businessName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Principal Place of Business</span>
                    <span className="font-bold text-foreground">{newWorkspace.businessAddress}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Date of Liability</span>
                    <span className="font-bold text-foreground">01/04/2026</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Jurisdiction Office</span>
                    <span className="font-bold text-foreground font-sans">Ward 27, State GST, {newWorkspace.businessState}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-normal italic px-2">
                  Note: This is a verified simulated company profile constructed dynamically from active PAN registries. Legal parameters represent real-time statutory classifications.
                </p>
              </div>

              <DialogFooter className="border-t border-border/40 pt-4 flex justify-end">
                <Button onClick={() => setIsWorkspaceCertOpen(false)} className="rounded-xl h-9 px-5 text-xs font-bold shadow-lg cursor-pointer">
                  Confirm Profile &amp; Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Danger Zone: Delete Active Company */}
          {isOwner && (
            <Card className="w-full border-destructive/30 bg-destructive/5 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden mt-6 animate-in fade-in duration-300">
              <CardHeader className="bg-gradient-to-r from-destructive/10 via-transparent to-destructive/10 border-b border-destructive/20 py-5 px-6">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-5 h-5 text-destructive animate-pulse" />
                  Danger Zone: Delete Active Organization
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete this entire business workspace, including all transactions, vouchers, ledger accounts, and inventory tables. This action is absolute and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Active Organization: <strong className="text-destructive uppercase">{userCompanies.find(c => c.id === currentUser?.companyId)?.name || "This Business"}</strong>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">All data will be permanently wiped out from the cloud and local databases.</p>
                </div>
                <Button
                  onClick={handleDeleteCompany}
                  disabled={isDeletingWorkspace}
                  variant="destructive"
                  className="rounded-xl h-10 px-6 font-bold text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md flex items-center gap-2 shrink-0"
                >
                  {isDeletingWorkspace ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting Database...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-white" />
                      Delete Organization
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
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
                      <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State / UT</Label>
                      <Select
                        onValueChange={(val) => setCompanyInfo(prev => ({ ...prev, state: val }))}
                        value={companyInfo.state}
                      >
                        <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[300px]">
                          {Object.values(StateEnum).map((stateName) => (
                            <SelectItem key={stateName} value={stateName} className="text-xs font-semibold">
                              {stateName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Label htmlFor="currencyCode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currency (Code &amp; Symbol)</Label>
                    <Select
                      onValueChange={(val) => {
                        const code = val as keyof typeof CurrencySymbolEnum;
                        const symbol = CurrencySymbolEnum[code] || "₹";
                        setFinancialSettings(prev => ({ ...prev, currencyCode: code, currencySymbol: symbol }));
                      }}
                      value={financialSettings.currencyCode}
                    >
                      <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[300px]">
                        {Object.keys(CurrencyEnum).map((code) => {
                          const symbol = CurrencySymbolEnum[code as keyof typeof CurrencySymbolEnum] || "";
                          return (
                            <SelectItem key={code} value={code} className="text-xs font-semibold">
                              {code} ({symbol})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Symbol</Label>
                    <Input
                      id="currencySymbol"
                      placeholder="e.g., ₹, $, €"
                      value={financialSettings.currencySymbol}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                      className="h-10 text-xs font-bold bg-background/55 border-border rounded-xl font-mono"
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

                <div className="space-y-2 border-t border-border/30 pt-6">
                  <Label htmlFor="defaultTemplate" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Invoice Print Template</Label>
                  <Select
                    onValueChange={(val: any) => setFinancialSettings(prev => ({ ...prev, defaultTemplate: val }))}
                    value={financialSettings.defaultTemplate}
                  >
                    <SelectTrigger className="w-full h-10 bg-background border-border rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Select Default Template" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="minimalist" className="text-xs font-semibold">1. Minimalist Stark</SelectItem>
                      <SelectItem value="emerald" className="text-xs font-semibold">2. Emerald Classic</SelectItem>
                      <SelectItem value="thermal" className="text-xs font-semibold">3. Retail Thermal (Receipt)</SelectItem>
                      <SelectItem value="corporate" className="text-xs font-semibold">4. Corporate Prestige</SelectItem>
                      <SelectItem value="neon" className="text-xs font-semibold">5. Modern Tech (Neon)</SelectItem>
                      <SelectItem value="retro" className="text-xs font-semibold">6. Carbon Retro</SelectItem>
                      <SelectItem value="crimson" className="text-xs font-semibold">7. Crimson Bold</SelectItem>
                      <SelectItem value="artisan" className="text-xs font-semibold">8. Artisan Studio</SelectItem>
                      <SelectItem value="indigo" className="text-xs font-semibold">9. Sleek Indigo</SelectItem>
                      <SelectItem value="grocer" className="text-xs font-semibold">10. Compact Grocer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This default layout will load automatically when preparing sale/voucher printouts.
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
                        <Button type="button" variant="outline" size="sm" onClick={() => setTaxSettings(prev => ({ ...prev, defaultGstRate: 12 }))} className="text-[10px] font-bold rounded-lg border-border cursor-pointer">Set services standard 12%</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setTaxSettings(prev => ({ ...prev, defaultGstRate: 5 }))} className="text-[10px] font-bold rounded-lg border-border cursor-pointer">Set basic items 5%</Button>
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



        {/* Tab 10: Portable JSON Database Backups */}
        <TabsContent value="backup">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden font-sans">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 border-b border-border/60 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Download className="w-5 h-5 text-blue-500" />
                Portable JSON Database Backups
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Export your entire ERP database sheet to a portable JSON file, or restore a complete accounting ledger copy transactionally.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                
                {/* Export Section */}
                <div className="surface-inset p-5 rounded-2xl border border-border/40 space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    Download Active Workspace Backup
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Downloads all active business sheets (including companies, customers, suppliers, inventory items, transactions, audit logs, and settings) as a portable, database-agnostic JSON package. Excellent for offsite archives!
                  </p>
                  <Button
                    onClick={handleBackup}
                    disabled={backupLoading}
                    className="w-full rounded-xl h-10 font-bold bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-md flex items-center justify-center gap-2 border-none active:scale-[0.98] transition-all"
                  >
                    {backupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting Active Sheets...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        Download Backup (.json)
                      </>
                    )}
                  </Button>
                </div>

                {/* Import Section */}
                <div className="surface-inset p-5 rounded-2xl border border-border/40 space-y-4">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 text-amber-500">
                    <PlusCircle className="w-4 h-4 text-amber-500" />
                    Restore Ledger Backup File
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Select a previously downloaded `.json` database file. Restoring will delete the active workspace and re-populate all relational tables in a single atomic database transaction. This cannot be undone!
                  </p>
                  
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      disabled={restoreLoading}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={restoreLoading}
                      className="w-full rounded-xl h-10 font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md flex items-center justify-center gap-2 border-none active:scale-[0.98] transition-all"
                    >
                      {restoreLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Restoring Relational Tables...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 text-white" />
                          Select &amp; Restore Backup
                        </>
                      )}
                    </Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 11: Multi-User Sync Conflicts */}
        <TabsContent value="conflicts">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden font-sans">
            <CardHeader className="bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 border-b border-border/60 py-5 px-6 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Sync Conflict Resolution Desk
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Review and resolve multi-user transactional conflicts with the cloud database.
                </CardDescription>
              </div>
              <Button onClick={loadConflicts} variant="outline" className="h-9 border-border rounded-xl font-bold cursor-pointer hover:bg-muted text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Conflicts
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {conflicts.length === 0 ? (
                <div className="py-14 text-center text-xs font-semibold text-credit bg-credit/5 border border-dashed border-credit/20 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-credit/10 border border-credit/20 flex items-center justify-center text-credit">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">Sync Channel Clean</h3>
                    <p className="text-muted-foreground text-xs font-semibold mt-1">There are no unresolved multi-user sync conflicts logged in SQLite.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-muted-foreground border-b border-border/40 pb-2">
                    Found {conflicts.length} unresolved conflict{conflicts.length > 1 ? "s" : ""}
                  </div>
                  
                  <div className="divide-y divide-border/40 border border-border/50 bg-background/50 rounded-xl overflow-hidden">
                    {conflicts.map((c) => {
                      const payload = JSON.parse(c.payload || "{}");
                      return (
                        <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-primary hover:bg-muted/10 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">
                                Conflict Status
                              </span>
                              <span className="font-extrabold text-foreground capitalize">
                                {c.entity} ({c.action})
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground/80 font-mono">
                              ID: {c.id} • Registered: {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground max-w-lg mt-1 font-mono break-all p-2 rounded bg-background/70 border border-border/40">
                              {JSON.stringify(payload)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              onClick={() => handleResolveConflict(c.id, "local")}
                              disabled={resolvingId === c.id}
                              className="h-8 rounded-lg bg-accent text-[10px] font-extrabold text-accent-foreground cursor-pointer shadow border-none px-3"
                            >
                              Force Local (Overwrite Cloud)
                            </Button>
                            <Button
                              onClick={() => handleResolveConflict(c.id, "server")}
                              disabled={resolvingId === c.id}
                              variant="outline"
                              className="h-8 rounded-lg border-border text-[10px] font-extrabold cursor-pointer hover:bg-muted px-3"
                            >
                              Use Server (Discard Local)
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
