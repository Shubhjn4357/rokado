import { db, ledgers, voucherEntries, vouchers, eq, desc } from "@/lib/database";
import { notFound } from "next/navigation";
import { LedgerDetailClient } from "@/components/ledgers/ledger-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ledger = await db.select().from(ledgers).where(eq(ledgers.id as any, id)).limit(1);
  return { title: `${ledger[0]?.name ?? "Ledger"} - ERP` };
}

export default async function LedgerDetailPage({ params }: Props) {
  const { id } = await params;

  const [ledger] = await db.select().from(ledgers).where(eq(ledgers.id as any, id)).limit(1);
  if (!ledger) notFound();

  // Get voucher entries for this ledger, joined with voucher info
  const entries = await db
    .select({
      entryId: voucherEntries.id,
      entryType: voucherEntries.type,
      amount: voucherEntries.amount,
      narration: voucherEntries.narration,
      voucherId: vouchers.id,
      voucherType: vouchers.type,
      voucherDate: vouchers.date,
      voucherNumber: vouchers.number,
      voucherNarration: vouchers.narration,
    })
    .from(voucherEntries)
    .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
    .where(eq(voucherEntries.ledgerId as any, id))
    .orderBy(desc(vouchers.date))
    .limit(50);

  return <LedgerDetailClient ledger={ledger} entries={entries} />;
}
