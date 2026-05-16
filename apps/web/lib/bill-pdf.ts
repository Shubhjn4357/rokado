// lib/bill-pdf.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface BillData {
  company: {
    name: string;
    address: string;
    gstin: string;
    phone: string;
    email: string;
  };
  billTo: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    stateCode: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  items: Array<{
    description: string;
    hsn: string;
    quantity: number;
    rate: number;
    discount: number; // percentage
    amount: number;
  }>;
  subtotal: number;
  discount: number; // amount
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  amountInWords: string;
}

/**
 * Generate a PDF bill using html2canvas and jsPDF
 * This function creates a temporary HTML element, renders it to canvas, then adds to PDF.
 */
export async function generateBillPDF(data: BillData): Promise<Blob> {
  // Create a temporary container for the bill HTML
  const container = document.createElement("div");
  container.style.fontFamily = "Arial, sans-serif";
  container.style.width = "210mm"; // A4 width
  container.style.padding = "20mm";
  container.style.position = "relative";
  container.style.background = "#fff";

  // Build the HTML for the bill
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px;">TAX INVOICE</h1>
      <p style="margin: 5px 0; color: #666;">Original for Recipient</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <h2 style="margin: 0 0 5px 0;">${data.company.name}</h2>
        <p style="margin: 0; font-size: 14px;">${data.company.address}</p>
        <p style="margin: 0; font-size: 14px;">GSTIN: ${data.company.gstin}</p>
        <p style="margin: 0; font-size: 14px;">Phone: ${data.company.phone}</p>
        <p style="margin: 0; font-size: 14px;">Email: ${data.company.email}</p>
      </div>
      <div>
        <h2 style="margin: 0 0 5px 0;">Bill To</h2>
        <p style="margin: 0; font-size: 14px;">${data.billTo.name}</p>
        <p style="margin: 0; font-size: 14px;">${data.billTo.address}</p>
        <p style="margin: 0; font-size: 14px;">GSTIN: ${data.billTo.gstin}</p>
        <p style="margin: 0; font-size: 14px;">State: ${data.billTo.state} (${data.billTo.stateCode})</p>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px;"><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${data.invoiceDate}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">S.No</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Description of Goods</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">HSN Code</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #f2f2f2;">Quantity</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">Rate (₹)</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">Discount (%)</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item, index) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.hsn}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.rate.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.discount.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.amount.toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div style="margin-bottom: 20px; font-size: 14px;">
      <p style="margin: 0;">Subtotal: ₹${data.subtotal.toFixed(2)}</p>
      <p style="margin: 0;">Discount: ₹${data.discount.toFixed(2)}</p>
      <p style="margin: 0;">Taxable Value: ₹${data.taxableValue.toFixed(2)}</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <p style="margin: 0; font-size: 14px;"><strong>CGST (${data.cgstRate}%):</strong> ₹${data.cgstAmount.toFixed(2)}</p>
        <p style="margin: 0; font-size: 14px;"><strong>SGST (${data.sgstRate}%):</strong> ₹${data.sgstAmount.toFixed(2)}</p>
        ${data.igstRate > 0 ? `<p style="margin: 0; font-size: 14px;"><strong>IGST (${data.igstRate}%):</strong> ₹${data.igstAmount.toFixed(2)}</p>` : ""}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 14px;"><strong>Total Tax:</strong> ₹${data.totalTax.toFixed(2)}</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold;"><strong>Total Amount:</strong> ₹${data.totalAmount.toFixed(2)}</p>
      </div>
    </div>

    <div style="margin-bottom: 20px; font-size: 14px;">
      <p style="margin: 0;"><strong>Amount in Words:</strong> ${data.amountInWords}</p>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #666;">
      <p style="margin: 0;">Terms & Conditions:</p>
      <p style="margin: 5px 0;">1. Goods once sold will not be taken back.</p>
      <p style="margin: 5px 0;">2. Interest @ 24% per annum will be charged if payment is not made within 30 days.</p>
      <p style="margin: 5px 0;">3. Subject to jurisdiction of Delhi courts.</p>
    </div>
  `;

  // Append to body (required for html2canvas)
  document.body.appendChild(container);

  try {
    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Increase scale for better quality
      useCORS: true, // Allow cross-origin images if needed
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("blob");
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Alternative: Generate PDF directly with jsPDF (without HTML conversion)
 * This is more lightweight but less flexible for complex layouts.
 */
export function generateBillPDFDirect(data: BillData): Blob {
  const pdf = new jsPDF();
  let y = 20;

  pdf.setFontSize(16);
  pdf.text("TAX INVOICE", pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 10;

  pdf.setFontSize(10);
  pdf.text(`${data.company.name}`, 20, y);
  pdf.text(`Invoice No: ${data.invoiceNumber}`, 120, y);
  y += 7;
  pdf.text(`${data.company.address}`, 20, y);
  pdf.text(`Date: ${data.invoiceDate}`, 120, y);
  y += 7;
  pdf.text(`GSTIN: ${data.company.gstin}`, 20, y);
  pdf.text(`Bill To: ${data.billTo.name}`, 120, y);
  y += 7;
  pdf.text(`Phone: ${data.company.phone}`, 20, y);
  pdf.text(`GSTIN: ${data.billTo.gstin}`, 120, y);
  y += 7;
  pdf.text(`Email: ${data.company.email}`, 20, y);
  pdf.text(`State: ${data.billTo.state}`, 120, y);
  y += 15;

  // Table header
  pdf.setFontSize(9);
  pdf.setFillColor(220, 220, 220);
  pdf.rect(20, y, 170, 8, "F"); // Header background
  pdf.text("S.No", 22, y + 5);
  pdf.text("Description", 30, y + 5);
  pdf.text("HSN", 80, y + 5);
  pdf.text("Qty", 100, y + 5, { align: "right" });
  pdf.text("Rate", 115, y + 5, { align: "right" });
  pdf.text("Disc%", 130, y + 5, { align: "right" });
  pdf.text("Amount", 145, y + 5, { align: "right" });
  y += 8;

  // Table rows
  pdf.setFillColor(255, 255, 255);
  data.items.forEach((item, index) => {
    pdf.rect(20, y, 170, 6, "F"); // Row background
    pdf.text(`${index + 1}`, 22, y + 4);
    pdf.text(item.description.substring(0, 30), 30, y + 4);
    pdf.text(item.hsn, 80, y + 4);
    pdf.text(`${item.quantity}`, 100, y + 4, { align: "right" });
    pdf.text(`${item.rate.toFixed(2)}`, 115, y + 4, { align: "right" });
    pdf.text(`${item.discount.toFixed(2)}`, 130, y + 4, { align: "right" });
    pdf.text(`${item.amount.toFixed(2)}`, 145, y + 4, { align: "right" });
    y += 6;
  });

  // Totals
  y += 10;
  pdf.setFontSize(10);
  pdf.text(`Subtotal: ₹${data.subtotal.toFixed(2)}`, 120, y, { align: "right" });
  y += 7;
  pdf.text(`Discount: ₹${data.discount.toFixed(2)}`, 120, y, { align: "right" });
  y += 7;
  pdf.text(`Taxable Value: ₹${data.taxableValue.toFixed(2)}`, 120, y, { align: "right" });
  y += 10;

  pdf.text(`CGST (${data.cgstRate}%): ₹${data.cgstAmount.toFixed(2)}`, 20, y);
  pdf.text(`SGST (${data.sgstRate}%): ₹${data.sgstAmount.toFixed(2)}`, 120, y, { align: "right" });
  y += 7;
  if (data.igstRate > 0) {
    pdf.text(`IGST (${data.igstRate}%): ₹${data.igstAmount.toFixed(2)}`, 20, y);
    y += 7;
  }
  pdf.text(`Total Tax: ₹${data.totalTax.toFixed(2)}`, 120, y, { align: "right" });
  y += 7;
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total Amount: ₹${data.totalAmount.toFixed(2)}`, 120, y, { align: "right" });
  y += 10;
  pdf.setFontSize(10);
  pdf.text(`Amount in Words: ${data.amountInWords}`, 20, y);

  return pdf.output("blob");
}