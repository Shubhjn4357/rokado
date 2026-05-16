"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo2, UploadCloud, FileSpreadsheet, CheckCircle2, ChevronRight } from "lucide-react";

interface Props {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const MIGRATION_SOURCES = [
  { id: "excel", title: "Excel / CSV Import", desc: "Upload your customer lists and inventory", icon: FileSpreadsheet },
  { id: "tally", title: "Tally XML Import", desc: "Direct ledger and voucher migration", icon: UploadCloud },
  { id: "vyapar", title: "Vyapar CSV", desc: "Quick migration for retail shops", icon: UploadCloud },
];

export function MigrationWizard({ onBack }: Props) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-2xl shadow-2xl bg-card/80 backdrop-blur-xl border-white/10 animate-in fade-in zoom-in-95 duration-500">
      <CardHeader>
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-6 top-6 rounded-full">
          <Undo2 className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <CardTitle className="text-2xl font-bold">Migrate Existing Shop</CardTitle>
          <CardDescription className="mt-2">
            Import your ledgers, inventory, and opening balances without losing history.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-lg">Select Data Source</h3>
            <div className="grid gap-3">
              {MIGRATION_SOURCES.map((src) => {
                const Icon = src.icon;
                const isSelected = source === src.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => setSource(src.id)}
                    className={`flex items-center text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className={`p-3 rounded-lg mr-4 ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{src.title}</div>
                      <div className="text-sm text-muted-foreground">{src.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center border-2 border-dashed border-border mb-4">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Upload your {MIGRATION_SOURCES.find(s => s.id === source)?.title} file</h3>
            <p className="text-muted-foreground">Drag and drop your file here or click to browse.</p>
            <Button variant="outline" className="mt-4">Select File</Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/50 p-6">
        <Button variant="ghost" disabled={step === 1} onClick={onBack}>
          Back
        </Button>
        <Button disabled={!source} onClick={() => {
          if (step === 1) {
            onNext();
          } else {
            // Begin import - would normally trigger import process
            onSkip(); // For now, just skip to completion
          }
        }} className="px-8 rounded-xl">
          {step === 1 ? "Next Step" : "Begin Import"} <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
