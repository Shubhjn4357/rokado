"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, DownloadCloud, Database } from "lucide-react";
import { BusinessTypeSelector } from "./business-type-selector";
import { MigrationWizard } from "./migration-wizard";

type FlowState = "welcome" | "new_business" | "migrate" | "backup";

export function WelcomeScreen() {
  const [flow, setFlow] = useState<FlowState>("welcome");
  const [selectedType, setSelectedType] = useState<string>("wholesale_saree");

  if (flow === "new_business") {
    return (
      <BusinessTypeSelector 
        onBack={() => setFlow("welcome")} 
        onNext={() => {}}
        selectedType={selectedType}
        onSelect={setSelectedType}
      />
    );
  }

  if (flow === "migrate") {
    return (
      <MigrationWizard 
        onBack={() => setFlow("welcome")} 
        onNext={() => {}}
        onSkip={() => setFlow("welcome")}
      />
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-xl border-white/10 relative overflow-hidden transition-all duration-500 hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <CardHeader className="text-center pb-8 pt-10">
        <div className="mx-auto bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Welcome to ERP</CardTitle>
        <CardDescription className="text-base mt-2">
          The next-generation financial core for your business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-8">
        <Button 
          variant="default" 
          size="lg" 
          className="w-full h-14 text-lg justify-between group rounded-xl"
          onClick={() => setFlow("new_business")}
        >
          <span className="flex items-center gap-3">
            <Building2 className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            Start New Business
          </span>
          <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full h-14 text-lg justify-between group rounded-xl border-border/50 hover:bg-accent/50"
          onClick={() => setFlow("migrate")}
        >
          <span className="flex items-center gap-3">
            <DownloadCloud className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-primary" />
            Migrate Existing Shop
          </span>
          <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Button>
      </CardContent>
      <CardFooter className="px-8 pb-8 pt-4 justify-center">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Database className="w-4 h-4 mr-2" />
          Continue from backup
        </Button>
      </CardFooter>
    </Card>
  );
}
