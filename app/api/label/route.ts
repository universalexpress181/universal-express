import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
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

    // 🎯 EXACT UI HTML
    const html = `
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        body {
          margin: 0;
          background: #fff;
          font-family: Arial, sans-serif;
        }

        .page {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .label {
          width: 400px;
          height: 600px;
          border: 2px solid black;
          padding: 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          page-break-after: always;
        }

        .top {
          border-bottom: 2px solid black;
          display: flex;
          justify-content: space-between;
          padding-bottom: 6px;
        }

        .title {
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
        }

        .subtitle {
          font-size: 10px;
          font-weight: bold;
        }

        .right-top {
          text-align: right;
          font-size: 10px;
          font-weight: bold;
        }

        .box-tag {
          background: black;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          margin-top: 4px;
        }

        .awb {
          text-align: center;
          margin-top: 10px;
        }

        .awb h2 {
          font-size: 34px;
          font-weight: 900;
          margin: 0;
        }

        .total-box {
          border: 2px dashed black;
          display: inline-block;
          padding: 4px 10px;
          margin-top: 6px;
          font-weight: bold;
        }

        .section {
          border: 2px solid black;
          padding: 10px;
          margin-top: 12px;
        }

        .section-title {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .receiver-name {
          font-size: 18px;
          font-weight: 900;
        }

        .footer {
          border-top: 2px solid black;
          margin-top: auto;
          padding-top: 8px;
        }

        .cod {
          background: black;
          color: white;
          padding: 6px 12px;
          font-weight: bold;
        }

        .barcode {
          text-align: center;
          margin-top: 6px;
        }
      </style>
    </head>

    <body>
      <div class="page">

        ${labels
          .map(
            (l, i) => `
        <div class="label">

          <div class="top">
            <div>
              <div class="title">Universal</div>
              <div class="subtitle">Express</div>
            </div>

            <div class="right-top">
              <div>DATE: ${new Date(shipment.created_at).toLocaleDateString()}</div>
              <div>WGT: ${shipment.weight} KG</div>
              <div class="box-tag">BOX: ${l.piece} OF ${l.total}</div>
            </div>
          </div>

          <div class="awb">
            <h2>${shipment.awb_code}</h2>
            <div class="total-box">
              Total Packages: ${l.total}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Deliver To:</div>
            <div class="receiver-name">${shipment.receiver_name}</div>
            <div>${shipment.receiver_address}</div>
            <div>
              ${shipment.receiver_city} - ${shipment.receiver_pincode}
            </div>
            <div>Tel: ${shipment.receiver_phone}</div>
          </div>

          <div class="section">
            <div class="section-title">Return To:</div>
            <div>${shipment.sender_name}</div>
            <div>${shipment.sender_address}</div>
            <div>Tel: ${shipment.sender_phone}</div>
          </div>

          <div class="footer">
            <div>
              Payment: <strong>${shipment.payment_mode}</strong>
            </div>

            ${
              shipment.payment_mode === "COD"
                ? `<div class="cod">₹${shipment.cod_amount}</div>`
                : ""
            }

            <div class="barcode">
              <svg id="barcode-${i}"></svg>
            </div>
          </div>

        </div>
        `
          )
          .join("")}

      </div>

      <script>
        ${labels
          .map(
            (_, i) => `
          JsBarcode("#barcode-${i}", "${shipment.awb_code}", {
            width: 2,
            height: 50,
            displayValue: true
          });
        `
          )
          .join("")}
      </script>

    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}