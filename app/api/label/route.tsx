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
// PIXEL-PERFECT STYLESHEET
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 8 }, 
  container: { borderWidth: 2, borderColor: '#000000', flex: 1, padding: 8, flexDirection: 'column' },

  // --- TOP SECTION ---
  topSection: { flexShrink: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderColor: '#000000', paddingBottom: 6, marginBottom: 4 },
  brandTitle: { fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase' },
  brandSub: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerText: { fontSize: 7, fontWeight: 'bold', marginBottom: 2 },
  boxBadge: { backgroundColor: '#000000', color: '#ffffff', paddingHorizontal: 4, paddingVertical: 2, fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },

  awbContainer: { alignItems: 'center', marginBottom: 4 },
  awbText: { fontSize: 26, fontWeight: 'bold', fontFamily: 'Courier-Bold' },
  deliveryText: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  
  dashedBoxWrap: { marginTop: 4, alignItems: 'center' },
  totalPkgBox: { borderWidth: 2, borderColor: '#000000', borderStyle: 'dashed', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' },
  totalPkgLabel: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 6 },
  totalPkgValue: { fontSize: 14, fontWeight: 'bold' },

  // --- MIDDLE SECTION (Addresses) ---
  middleSection: { flex: 1, justifyContent: 'center', paddingTop: 2, gap: 5 }, 

  // Deliver Box
  addressBox: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 8, paddingTop: 12, position: 'relative' },
  badgeWrap: { position: 'absolute', top: -6, left: 12, backgroundColor: '#ffffff', paddingHorizontal: 4 },
  badgeText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },

  receiverName: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  receiverAddr: { fontSize: 9, marginBottom: 6, color: '#333333', lineHeight: 1.2 },
  receiverBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 4, marginTop: 2 },
  telText: { fontSize: 9, fontWeight: 'bold' },
  rightAlign: { alignItems: 'flex-end' },
  cityText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  pinText: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },

  // 🚀 REFINED: Return To Box
  returnBox: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 8, paddingTop: 12, position: 'relative' },
  senderName: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 3 },
  senderAddr: { fontSize: 9, marginBottom: 4, color: '#333333', lineHeight: 1.2 },
  senderTel: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },

  // --- BOTTOM SECTION ---
  bottomSection: { flexShrink: 0, borderTopWidth: 2, borderColor: '#000000', paddingTop: 6, marginTop: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  paymentLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  paymentMode: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  
  codBox: { borderWidth: 2, borderColor: '#000000', backgroundColor: '#000000', paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 90 },
  collectCashText: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 1 },
  codAmount: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },

  barcodeContainer: { alignItems: 'center', width: '100%', marginTop: 2 },
  barcodeImg: { width: 160, height: 35 }, 
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
        <Page key={piece} size={[288, 432]} style={styles.page}>
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
      bcid: 'code128', text: shipment.awb_code, scale: 3, height: 15, includetext: false, backgroundcolor: 'ffffff'
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