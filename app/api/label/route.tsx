import React from 'react';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from '@react-pdf/renderer';
import bwipjs from 'bwip-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// A4 PIXEL-PERFECT STYLESHEET (Scaled 2x to fill an A4 sheet)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 16 }, 
  // 🚀 FIXED: Removed hardcoded width/height so it fills the A4 page automatically
  container: { borderWidth: 4, borderColor: '#000000', flex: 1, padding: 16, flexDirection: 'column' },

  // --- TOP SECTION ---
  topSection: { flexShrink: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 3, borderColor: '#000000', paddingBottom: 12, marginBottom: 8 },
  brandTitle: { fontSize: 44, fontWeight: 'bold', textTransform: 'uppercase' },
  brandSub: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  headerRight: { alignItems: 'flex-end' },
  headerText: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  boxBadge: { backgroundColor: '#000000', color: '#ffffff', paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },

  awbContainer: { alignItems: 'center', marginBottom: 8 },
  awbText: { fontSize: 52, fontWeight: 'bold', fontFamily: 'Courier-Bold' },
  deliveryText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4 },
  
  dashedBoxWrap: { marginTop: 8, alignItems: 'center' },
  totalPkgBox: { borderWidth: 3, borderColor: '#000000', borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' },
  totalPkgLabel: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 12 },
  totalPkgValue: { fontSize: 28, fontWeight: 'bold' },

  // --- MIDDLE SECTION (Addresses) ---
  middleSection: { flex: 1, justifyContent: 'center', paddingTop: 4, gap: 10 }, 

  // Deliver Box
  addressBox: { borderWidth: 3, borderColor: '#000000', borderRadius: 8, padding: 16, paddingTop: 24, position: 'relative' },
  badgeWrap: { position: 'absolute', top: -10, left: 24, backgroundColor: '#ffffff', paddingHorizontal: 8 },
  badgeText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },

  receiverName: { fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  receiverAddr: { fontSize: 16, marginBottom: 12, color: '#333333', lineHeight: 1.3 },
  receiverBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 2, borderColor: '#e5e7eb', paddingTop: 8, marginTop: 4 },
  telText: { fontSize: 16, fontWeight: 'bold' },
  rightAlign: { alignItems: 'flex-end' },
  cityText: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  pinText: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  // Return To Box
  returnBox: { borderWidth: 3, borderColor: '#000000', borderRadius: 8, padding: 16, paddingTop: 24, position: 'relative' },
  senderName: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  senderAddr: { fontSize: 16, marginBottom: 8, color: '#333333', lineHeight: 1.3 },
  senderTel: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },

  // --- BOTTOM SECTION ---
  bottomSection: { flexShrink: 0, borderTopWidth: 3, borderColor: '#000000', paddingTop: 12, marginTop: 8 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  paymentLabel: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  paymentMode: { fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase' },
  
  codBox: { borderWidth: 3, borderColor: '#000000', backgroundColor: '#000000', paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', minWidth: 160 },
  collectCashText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 2 },
  codAmount: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', letterSpacing: 2 },

  barcodeContainer: { alignItems: 'center', width: '100%', marginTop: 4 },
  barcodeImg: { width: 180, height: 40 }, 
});

// ---------------------------------------------------------------------------
// REACT-PDF COMPONENT
// ---------------------------------------------------------------------------
const LabelDocument = ({ shipment, barcodeImg, printAll }: any) => {
  const totalPackages = shipment.identical_package_count || 1;
  const pieces = printAll ? Array.from({ length: totalPackages }, (_, i) => i + 1) : [1];

  return (
    <Document>
      {pieces.map((piece) => (
        // 🚀 Natively set to A4 size
        <Page key={piece} size="A4" style={styles.page}>
          <View style={styles.container}>
            
            <View style={styles.topSection}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.brandTitle}>Universal</Text>
                  <Text style={styles.brandSub}>Express</Text>
                </View>
                <View style={styles.headerRight}>
                  <Text style={styles.headerText}>DATE: {new Date(shipment.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.headerText}>WGT: {shipment.weight} KG</Text>
                  <View style={styles.boxBadge}>
                    <Text>BOX: {piece} OF {totalPackages}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.awbContainer}>
                <Text style={styles.awbText}>{shipment.awb_code}</Text>
                <Text style={styles.deliveryText}>Standard Delivery</Text>
                <View style={styles.dashedBoxWrap}>
                    <View style={styles.totalPkgBox}>
                    <Text style={styles.totalPkgLabel}>Total Packages:</Text>
                    <Text style={styles.totalPkgValue}>{totalPackages}</Text>
                    </View>
                </View>
              </View>
            </View>

            <View style={styles.middleSection}>
              {/* DELIVERY BOX */}
              <View style={styles.addressBox}>
                <View style={styles.badgeWrap}><Text style={styles.badgeText}>Deliver To:</Text></View>
                <Text style={styles.receiverName}>{shipment.receiver_name}</Text>
                <Text style={styles.receiverAddr}>{shipment.receiver_address}</Text>
                
                <View style={styles.receiverBottomRow}>
                  <Text style={styles.telText}>Tel: {shipment.receiver_phone}</Text>
                  <View style={styles.rightAlign}>
                    <Text style={styles.cityText}>{shipment.receiver_city}</Text>
                    {shipment.receiver_pincode && <Text style={styles.pinText}>{shipment.receiver_pincode}</Text>}
                  </View>
                </View>
              </View>

              {/* RETURN BOX */}
              <View style={styles.returnBox}>
                <View style={styles.badgeWrap}><Text style={styles.badgeText}>Return To:</Text></View>
                <Text style={styles.senderName}>{shipment.sender_name}</Text>
                <Text style={styles.senderAddr}>{shipment.sender_address}</Text>
                <Text style={styles.senderTel}>Tel: {shipment.sender_phone}</Text>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentLabel}>Payment Mode</Text>
                  <Text style={styles.paymentMode}>{shipment.payment_mode}</Text>
                </View>
                
                {shipment.payment_mode === "COD" && (
                  <View style={styles.codBox}>
                    <Text style={styles.collectCashText}>Collect Cash</Text>
                    <Text style={styles.codAmount}>Rs. {shipment.cod_amount || 0}</Text>
                  </View>
                )}
              </View>

              <View style={styles.barcodeContainer}>
                <Image src={barcodeImg} style={styles.barcodeImg} />
              </View>
            </View>

          </View>
        </Page>
      ))}
    </Document>
  );
};

// ---------------------------------------------------------------------------
// API ROUTE HANDLER
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const awb = searchParams.get('awb');
  const printAll = searchParams.get('all') === 'true';

  if (!awb) {
    return new NextResponse("Missing AWB parameter", { status: 400 });
  }

  try {
    const { data: shipment, error } = await supabase.from('shipments').select('*').eq('awb_code', awb).single();
    if (error || !shipment) return new NextResponse("Shipment not found", { status: 404 });

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128', text: shipment.awb_code, scale: 5, height: 20, includetext: false, backgroundcolor: 'ffffff'
    });
    const barcodeImg = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;

    const pdfStream = await renderToStream(
      <LabelDocument shipment={shipment} barcodeImg={barcodeImg} printAll={printAll} />
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${awb}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Error:", error);
    return new NextResponse(`Error generating PDF: ${error.message}`, { status: 500 });
  }
}