import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateInvoice(order: any, buyerName: string = 'Customer') {
  if (!order) return null;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(16, 185, 129); // #10b981 (primary KamerFresh green)
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KAMERFRESH RECEIPT', 20, 22);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice ID: INV-${order.id.substring(0, 8).toUpperCase()}`, 20, 31);

  const formattedDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString() 
    : new Date().toLocaleDateString();

  // Metadata tables
  autoTable(doc, {
    startY: 48,
    head: [['Order Details', 'Values']],
    body: [
      ['Order Reference ID', order.id],
      ['Date Purchased', formattedDate],
      ['Buyer Account Name', buyerName],
      ['Fulfillment/Shipping Address', order.shipping_address || 'Direct Handshake Handover'],
      ['Grand Total Cost', `${Number(order.total_amount).toLocaleString()} FCFA`],
      ['Fulfillment Status Code', String(order.status).toUpperCase()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }, // Slate-900 heading colors
  });

  // Items lists
  const itemsBody = (order.order_items || []).map((item: any) => {
    const pName = item.products?.name || item.product_name || `Product Item`;
    const qty = item.quantity || 1;
    const price = item.price_at_purchase || item.price || 0;
    const totalItem = qty * price;
    return [
      pName,
      `${qty}`,
      `${Number(price).toLocaleString()} FCFA`,
      `${Number(totalItem).toLocaleString()} FCFA`
    ];
  });

  if (itemsBody.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Product Name', 'Quantity', 'Price/Unit', 'Subtotal']],
      body: itemsBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Green headings
    });
  }

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for supporting KamerFresh Cameroonian agro-entrepreneur farms!', pageWidth / 2, finalY, { align: 'center' });
  doc.text('This receipt functions as certified proof of Escrow payment placement.', pageWidth / 2, finalY + 5, { align: 'center' });

  return doc;
}

export async function downloadInvoicePDF(order: any, buyerName: string = 'Customer') {
  const doc = await generateInvoice(order, buyerName);
  if (doc) {
    doc.save(`Invoice_KamerFresh_ORD_${order.id.substring(0, 8).toUpperCase()}.pdf`);
  }
}
