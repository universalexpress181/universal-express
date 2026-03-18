import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const awb = searchParams.get("awb");
    const piece = searchParams.get("piece");
    const total = searchParams.get("total");
    const printAll = searchParams.get("all") === "true";

    if (!awb) {
      return NextResponse.json({ error: "Missing AWB" }, { status: 400 });
    }

    const { data: shipment } = await supabase
      .from("shipments")
      .select("*")
      .eq("awb_code", awb)
      .single();

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const totalPackages = shipment.identical_package_count || 1;

    const labels = printAll
      ? Array.from({ length: totalPackages }, (_, i) => ({
          piece: i + 1,
          total: totalPackages,
        }))
      : [
          {
            piece: piece || 1,
            total: total || totalPackages,
          },
        ];

    // ✅ HTML TEMPLATE (PIXEL STYLE)
    const html = `
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        body { margin:0; font-family:Arial; }
        .label {
          width:400px;
          height:600px;
          border:2px solid black;
          padding:16px;
          box-sizing:border-box;
          display:flex;
          flex-direction:column;
          page-break-after:always;
        }
        .top {
          display:flex;
          justify-content:space-between;
          border-bottom:2px solid black;
        }
        .title { font-size:30px; font-weight:900; }
        .right { font-size:10px; text-align:right; }
        .awb { text-align:center; margin-top:10px; }
        .section {
          border:2px solid black;
          padding:10px;
          margin-top:10px;
        }
        .footer { margin-top:auto; border-top:2px solid black; padding-top:6px; }
        .cod { background:black; color:white; padding:5px; }
        .barcode { text-align:center; }
      </style>
    </head>

    <body>

    ${labels.map((l, i) => `
      <div class="label">

        <div class="top">
          <div>
            <div class="title">Universal</div>
            <div>Express</div>
          </div>
          <div class="right">
            <div>DATE: ${new Date(shipment.created_at).toLocaleDateString()}</div>
            <div>WGT: ${shipment.weight} KG</div>
            <div>BOX: ${l.piece} OF ${l.total}</div>
          </div>
        </div>

        <div class="awb">
          <h2>${shipment.awb_code}</h2>
        </div>

        <div class="section">
          <b>Deliver To:</b><br/>
          ${shipment.receiver_name}<br/>
          ${shipment.receiver_address}<br/>
          ${shipment.receiver_city} - ${shipment.receiver_pincode}
        </div>

        <div class="section">
          <b>Return To:</b><br/>
          ${shipment.sender_name}<br/>
          ${shipment.sender_address}
        </div>

        <div class="footer">
          Payment: ${shipment.payment_mode}
          ${shipment.payment_mode === "COD" ? `<div class="cod">₹${shipment.cod_amount}</div>` : ""}
          <div class="barcode">
            <svg id="barcode-${i}"></svg>
          </div>
        </div>

      </div>
    `).join("")}

    <script>
      ${labels.map((_, i) => `
        JsBarcode("#barcode-${i}", "${shipment.awb_code}", {
          width:2,
          height:50,
          displayValue:true
        });
      `).join("")}
    </script>

    </body>
    </html>
    `;

    // ✅ PRODUCTION SAFE LAUNCH
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      width: "400px",
      height: "600px",
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=${awb}.pdf`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}