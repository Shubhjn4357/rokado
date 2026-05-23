/**
 * Exports an HTML table element to an Excel spreadsheet (.xlsx)
 * @param tableId The DOM ID of the <table> element
 * @param filename The desired output filename (without extension)
 */
export async function exportTableToExcel(tableId: string, filename: string) {
  if (typeof window === "undefined") return;

  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`[Export Utils] Table element not found: #${tableId}`);
    return;
  }

  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.table_to_book(table, { raw: true });
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (err) {
    console.error("[Export Utils] Excel export failed:", err);
  }
}

/**
 * Renders a DOM element as a high-fidelity PDF document (.pdf)
 * Supports multi-page flow and handles styling correctly
 * @param elementId The DOM ID of the container element to render
 * @param filename The desired output filename (without extension)
 */
export async function exportElementToPDF(elementId: string, filename: string) {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[Export Utils] Element not found: #${elementId}`);
    return;
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error("[Export Utils] PDF export failed:", err);
  }
}
