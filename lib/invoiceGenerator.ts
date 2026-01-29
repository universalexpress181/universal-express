import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to load image for PDF
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export const generateInvoice = async (shipment: any, profile?: any) => {
  const doc = new jsPDF();

  // --- Professional Color Palette ---
  const brandColor = [15, 23, 42];    // Navy Blue
  const accentColor = [220, 38, 38];  // Red (for COD/Alerts)
  const successColor = [22, 163, 74]; // Green (for Prepaid)
  const grayColor = [241, 245, 249];  // Light Gray
  const borderColor = [203, 213, 225];// Border Gray

  // --- 1. HEADER SECTION ---
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  // --- LOGO & BRANDING LOCKUP ---
  try {
    const logoImg = await loadImage("/logo.png");
    
    // 1. Logo (Larger Size)
    // x=14, y=8, width=24, height=24 (Square aspect)
    doc.addImage(logoImg, "PNG", 14, 8, 24, 24); 
    
    // 2. Text positioned relative to Logo (Acting as one unit)
    doc.setTextColor(255, 255, 255);
    
    // Company Name
    doc.setFontSize(20); // Big, Bold Title
    doc.setFont("helvetica", "bold");
    doc.text("UNIVERSAL LOGISTICS", 42, 20); // x=42 starts right after logo
    
    // Tagline
    doc.setFontSize(10); // Smaller subtitle
    doc.setFont("helvetica", "normal");
    doc.text("Fast. Secure. Worldwide.", 42, 28); // Aligned below title

  } catch (e) {
    // Fallback if logo fails to load (Text Only)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("UNIVERSAL LOGISTICS", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Fast. Secure. Worldwide.", 14, 30);
  }

  // --- INVOICE META (Right Side) ---
  doc.setTextColor(255, 255, 255); // Ensure text is white
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 196, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 24, { align: "right" });
  doc.text(`AWB: ${shipment.awb_code}`, 196, 29, { align: "right" });

  // --- 2. STATUS BANNER ---
  const isCOD = shipment.payment_mode === "COD";
  const bannerColor = isCOD ? accentColor : successColor;
  const bannerText = isCOD 
    ? `COD SHIPMENT - COLLECT Rs. ${shipment.cod_amount}` 
    : "PREPAID SHIPMENT - DO NOT COLLECT CASH";

  doc.setFillColor(bannerColor[0], bannerColor[1], bannerColor[2]);
  doc.rect(0, 40, 210, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(bannerText, 105, 46.5, { align: "center" });

  // --- 3. ROUTE DETAILS (Sender & Receiver) ---
  const senderInfo = `SENDER:\n${shipment.sender_name}\n${shipment.sender_address}\n${shipment.sender_city}, ${shipment.sender_state} - ${shipment.sender_pincode}\nPh: ${shipment.sender_phone}`;
  const receiverInfo = `RECEIVER (DELIVER TO):\n${shipment.receiver_name}\n${shipment.receiver_address}\n${shipment.receiver_city}, ${shipment.receiver_state} - ${shipment.receiver_pincode}\nPh: ${shipment.receiver_phone}`;

  (autoTable as any)(doc, {
    startY: 58,
    head: [['FROM (ORIGIN)', 'TO (DESTINATION)']],
    body: [[senderInfo, receiverInfo]],
    theme: 'grid',
    headStyles: { 
        fillColor: grayColor, 
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 9,
        lineColor: borderColor,
        lineWidth: 0.1
    },
    styles: { 
        textColor: [15, 23, 42],
        fontSize: 10,
        cellPadding: 6,
        lineColor: borderColor,
        lineWidth: 0.1,
        valign: 'top'
    },
    margin: { left: 14, right: 14 }
  });

  // --- 4. PACKAGE CONTENTS & VALUES ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Base Rows
  const packageRows = [
    ["Package Content / Type", shipment.package_type || "Standard Package"],
    ["Actual Weight", `${shipment.weight} KG`],
    ["Payment Mode", isCOD ? "Cash on Delivery (COD)" : "Prepaid"],
  ];

  // ✅ CONDITIONAL ROW LOGIC
  if (isCOD) {
    // If COD: Show "Amount to Collect" (Hide Product Cost)
    packageRows.push(["AMOUNT TO BE COLLECTED", `Rs. ${shipment.cod_amount}`]);
  } else {
    // If Prepaid: Show "Product Cost" (Hide Amount to Collect)
    packageRows.push(["Product Cost", `Rs. ${shipment.declared_value || 0}`]);
  }

  (autoTable as any)(doc, {
    startY: finalY,
    head: [["Description", "Details"]],
    body: packageRows,
    theme: 'striped',
    headStyles: { 
        fillColor: brandColor, 
        textColor: 255,
        fontSize: 10
    },
    styles: { 
        fontSize: 10, 
        cellPadding: 4,
        textColor: [51, 65, 85]
    },
    columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
    },
    didParseCell: function (data: any) {
        // Highlight the Financial Row (Last Row)
        if (data.row.index === packageRows.length - 1 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 12;
            
            if (isCOD) {
                data.cell.styles.textColor = accentColor; // Red for COD Amount
            } else {
                data.cell.styles.textColor = successColor; // Green for Prepaid Value
            }
        }
    },
    margin: { left: 14, right: 14 }
  });

  // --- 5. FOOTER / DISCLAIMER ---
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "normal");
  
  doc.text("If undelivered, please return to the sender address mentioned above.", 14, pageHeight - 20);
  doc.text("This is a system-generated document. No signature required.", 105, pageHeight - 10, { align: "center" });

  doc.save(`Invoice_${shipment.awb_code}.pdf`);
};