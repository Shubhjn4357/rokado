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

/**
 * Helper to parse a standard HTML table element into structured key-value arrays
 */
function parseTableData(table: HTMLTableElement) {
  const headers: string[] = [];
  const rows: string[][] = [];

  const thElements = Array.from(table.querySelectorAll("thead th, thead td")) as HTMLElement[];
  thElements.forEach((th) => {
    headers.push(th.innerText.trim() || "Field");
  });

  const trElements = Array.from(table.querySelectorAll("tbody tr")) as HTMLTableRowElement[];
  trElements.forEach((tr) => {
    const row: string[] = [];
    const tdElements = Array.from(tr.querySelectorAll("td, th")) as HTMLElement[];
    tdElements.forEach((td) => {
      row.push(td.innerText.trim());
    });
    if (row.length > 0) {
      rows.push(row);
    }
  });

  return { headers, rows };
}

/**
 * Exports an HTML table element to a JSON data file (.json)
 * @param tableId The DOM ID of the <table> element
 * @param filename The desired output filename (without extension)
 */
export async function exportTableToJSON(tableId: string, filename: string) {
  if (typeof window === "undefined") return;

  const table = document.getElementById(tableId) as HTMLTableElement | null;
  if (!table) {
    console.error(`[Export Utils] Table element not found: #${tableId}`);
    return;
  }

  try {
    const { headers, rows } = parseTableData(table);
    const jsonData = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || "";
      });
      return obj;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${filename}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error("[Export Utils] JSON export failed:", err);
  }
}

/**
 * Exports an HTML table element to a CSV text file (.csv)
 * @param tableId The DOM ID of the <table> element
 * @param filename The desired output filename (without extension)
 */
export async function exportTableToCSV(tableId: string, filename: string) {
  if (typeof window === "undefined") return;

  const table = document.getElementById(tableId) as HTMLTableElement | null;
  if (!table) {
    console.error(`[Export Utils] Table element not found: #${tableId}`);
    return;
  }

  try {
    const { headers, rows } = parseTableData(table);
    
    // Join header names and row cells with escaping
    const escapeCSVCell = (text: string) => `"${text.replace(/"/g, '""')}"`;
    const headerLine = headers.map(escapeCSVCell).join(",");
    const rowLines = rows.map((row) => row.map(escapeCSVCell).join(","));
    const csvContent = [headerLine, ...rowLines].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[Export Utils] CSV export failed:", err);
  }
}

/**
 * Exports a DOM element as a high-fidelity PNG image (.png)
 * @param elementId The DOM ID of the container element to render
 * @param filename The desired output filename (without extension)
 */
export async function exportElementToPNG(elementId: string, filename: string) {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[Export Utils] Element not found: #${elementId}`);
    return;
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", imgData);
    downloadAnchor.setAttribute("download", `${filename}.png`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error("[Export Utils] PNG export failed:", err);
  }
}
