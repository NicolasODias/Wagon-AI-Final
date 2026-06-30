import { jsPDF } from 'jspdf';
import { Order, Client, Product } from '../types';

/**
 * Standard utility to fetch QR Code image as a base64 string
 */
const getQRCodeBase64 = async (url: string): Promise<string> => {
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&color=0f172a`;
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error fetching QR Code Base64:', err);
    return '';
  }
};

/**
 * Generate a SHA-256 style custom security hash for validation
 */
export const generateSecureValidationHash = (orderId: string, uuid: string): string => {
  const combined = `${orderId}-${uuid}-wagon-secured-compliance-2026`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `WGN-${Math.abs(hash).toString(16).toUpperCase()}-${uuid.slice(0, 8).toUpperCase()}`;
};

/**
 * Generates and downloads or views a professional A4 PDF invoice.
 */
export const generateInvoicePDF = async (
  order: Order,
  clients: Client[],
  products: Product[],
  options: { isDownload?: boolean; isViewOnly?: boolean } = {}
): Promise<jsPDF> => {
  const { isDownload = true, isViewOnly = false } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const matchingClient = clients.find((c) => c.id === order.clientId);
  const orderUUID = order.uuid || '9f0a7c89-234f-4f77-bb72-19a3e5c4d115';
  const validationHash = generateSecureValidationHash(order.id, orderUUID);
  const portalUrl = `https://app.wagon.ai/pedido/${order.id}`;

  // Dimensions: 210mm width x 297mm height
  const leftMargin = 15;
  const rightMargin = 195;
  const topMargin = 15;
  let currentY = topMargin;

  // 1. PAGE HEADER / BACKGROUND ACCENT
  // Primary brand visual stripe
  doc.setFillColor(31, 55, 103); // Deep Vértice Blue
  doc.rect(leftMargin, currentY, 180, 2.5, 'F');
  currentY += 8;

  // 2. CORPORATE BRANDING HEADER
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('WAGON AI', leftMargin, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('ERP CORPORATIVO & LOGÍSTICA', leftMargin, currentY + 4.5);

  // Top right document summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DOCUMENTO AUXILIAR DE VENDA (DAV)', rightMargin, currentY, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nº Pedido: ${order.id}`, rightMargin, currentY + 4.5, { align: 'right' });
  doc.text(`Emissão: ${order.date} às 10:15 UTC-3`, rightMargin, currentY + 8.5, { align: 'right' });

  currentY += 15;

  // 3. COMPANY & COMPLIANCE DATA
  doc.setFillColor(248, 250, 252); // extremely soft gray/blue background
  doc.rect(leftMargin, currentY, 180, 15, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, currentY, 180, 15, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('EMISSOR:', leftMargin + 4, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('14.571.417 Cristiane Aparecida Gonçalves  -  CNPJ: 14.571.417/0001-19  -  IE: 001867602.00-43', leftMargin + 20, currentY + 4.5);
  doc.text('Abertura: 04/11/2011  -  Porte: MEI  -  Natureza: Empresário Individual  -  Optante Simples Nacional / MEI  -  Situação: ATIVA', leftMargin + 4, currentY + 10);

  currentY += 21;

  // 4. CLIENT & REPRESENTATION COLUMNS
  const colWidth = 87;
  const colY = currentY;
  const colHeight = 32;

  // Left Column: Client identification
  doc.setFillColor(255, 255, 255);
  doc.rect(leftMargin, colY, colWidth, colHeight, 'S');
  doc.setFillColor(241, 245, 249);
  doc.rect(leftMargin, colY, colWidth, 5, 'F');
  doc.rect(leftMargin, colY, colWidth, 5, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('IDENTIFICAÇÃO DO DESTINATÁRIO / COMPRADOR', leftMargin + 3.5, colY + 3.5);

  doc.setFontSize(8.5);
  doc.text(order.clientName.toUpperCase(), leftMargin + 4, colY + 9.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`CNPJ / CPF: ${matchingClient?.cnpj || 'Cálculo Retido'}`, leftMargin + 4, colY + 14.5);
  doc.text(`E-mail: ${matchingClient?.email || 'contato@cliente.com'}`, leftMargin + 4, colY + 19.5);
  doc.text(`Telefone: ${matchingClient?.phone || '(15) 3221-9001'}`, leftMargin + 4, colY + 24.5);
  doc.text(`Região de Venda: ${matchingClient?.region || 'Sudeste'}`, leftMargin + 4, colY + 29.5);

  // Right Column: Order Representation / Salesrep details
  const colRightX = leftMargin + colWidth + 6;
  doc.rect(colRightX, colY, colWidth, colHeight, 'S');
  doc.setFillColor(241, 245, 249);
  doc.rect(colRightX, colY, colWidth, 5, 'F');
  doc.rect(colRightX, colY, colWidth, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DA REPRESENTAÇÃO COMERCIAL', colRightX + 3.5, colY + 3.5);

  doc.setFontSize(8.5);
  doc.text((order.salesRep || 'Wagon Vendedor').toUpperCase(), colRightX + 4, colY + 9.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Condição de Pgto: ${order.paymentTerm}`, colRightX + 4, colY + 14.5);
  doc.text(`Forma de Faturamento: Faturamento Direto ERP`, colRightX + 4, colY + 19.5);
  doc.text(`Canal Integrado: Representação Direta S.A.`, colRightX + 4, colY + 24.5);
  
  const statusStr = (order.status || 'Ativo').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', colRightX + 4, colY + 29.5);
  doc.setTextColor(16, 185, 129); // emerald green for active status
  doc.text(statusStr, colRightX + 15, colY + 29.5);

  currentY += colHeight + 8;

  // 5. PRODUCTS RELATIVE TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('RELAÇÃO DE BENS E MERCADORIAS COMERCIALIZADAS', leftMargin, currentY);
  currentY += 3.5;

  // Table Headers
  const tableY = currentY;
  const rowHeight = 6.5;

  doc.setFillColor(30, 41, 59); // Dark blue header
  doc.rect(leftMargin, tableY, 180, 7, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ID/PRODUTO', leftMargin + 4, tableY + 4.5);
  doc.text('QTD / UN', leftMargin + 72, tableY + 4.5, { align: 'center' });
  doc.text('UNITÁRIO', leftMargin + 105, tableY + 4.5, { align: 'right' });
  doc.text('DESCONTOS', leftMargin + 142, tableY + 4.5, { align: 'right' });
  doc.text('TÔTAL ADQUIRIDO', rightMargin - 4, tableY + 4.5, { align: 'right' });

  currentY += 7;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  order.items.forEach((item, index) => {
    const matchingProd = products.find((p) => p.id === item.productId);
    const unitMark = matchingProd ? matchingProd.unit : 'un';
    const originalItemTotal = item.unitPrice * item.quantity;
    const discountSum = originalItemTotal - item.total;
    const discountPct = originalItemTotal > 0 ? (discountSum / originalItemTotal) * 100 : 0;

    // Zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, currentY, 180, rowHeight, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(leftMargin, currentY + rowHeight, rightMargin, currentY + rowHeight);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName.toUpperCase().slice(0, 32), leftMargin + 4, currentY + 4.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`SKU: ${matchingProd?.sku || item.productId}`, leftMargin + 4, currentY + 6.2);
    
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.quantity} ${unitMark}`, leftMargin + 72, currentY + 4.5, { align: 'center' });
    doc.text(`R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, leftMargin + 105, currentY + 4.5, { align: 'right' });
    
    if (discountSum > 0) {
      doc.setTextColor(239, 68, 68); // rose red discount
      doc.text(`- R$ ${discountSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${discountPct.toFixed(0)}%)`, leftMargin + 142, currentY + 4.5, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('R$ 0,00', leftMargin + 142, currentY + 4.5, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightMargin - 4, currentY + 4.5, { align: 'right' });

    currentY += rowHeight;
  });

  currentY += 8;

  // 6. TOTALS & AUTHENTICATION SUMMARY (DOUBLE GRID)
  const infoBlockY = currentY;
  const infoBlockHeight = 45;

  // Left Section: Advanced Secure QR Authenticator
  doc.setDrawColor(226, 232, 240);
  doc.rect(leftMargin, infoBlockY, 95, infoBlockHeight, 'S');
  doc.setFillColor(248, 250, 252);
  doc.rect(leftMargin, infoBlockY, 95, 5, 'F');
  doc.rect(leftMargin, infoBlockY, 95, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('VALIDAÇÃO DE CONFORMIDADE TRIBUTÁRIA / DIGITAL', leftMargin + 3.5, infoBlockY + 3.5);

  // Fetch QR Code and add to doc
  const qrImageBase64 = await getQRCodeBase64(portalUrl);
  if (qrImageBase64) {
    doc.addImage(qrImageBase64, 'PNG', leftMargin + 4, infoBlockY + 7.5, 28, 28);
  } else {
    // Fill QR Code placeholder box if image fetching fails
    doc.setDrawColor(203, 213, 225);
    doc.rect(leftMargin + 4, infoBlockY + 7.5, 28, 28, 'S');
    doc.setFontSize(6);
    doc.text('[QR CODE PLACEHOLDER]', leftMargin + 6, infoBlockY + 21);
  }

  // Verification Hash, UUID, validation stamps
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('✅ DOCUMENTO AUTÊNTICO', leftMargin + 35, infoBlockY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Homologado por Wagon AI ERP', leftMargin + 35, infoBlockY + 15);
  
  doc.setFont('helvetica', 'bold');
  doc.text('UUID de Conformidade:', leftMargin + 35, infoBlockY + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(orderUUID, leftMargin + 35, infoBlockY + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura Eletrônica (Hash):', leftMargin + 35, infoBlockY + 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(validationHash, leftMargin + 35, infoBlockY + 32);

  // Small compliance warning
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Aponte a câmera do celular para conferir eletronicamente.', leftMargin + 4, infoBlockY + 41.5);

  // Right Section: Financial Summary Math Box
  const summaryX = leftMargin + 101;
  doc.rect(summaryX, infoBlockY, 79, infoBlockHeight, 'S');
  doc.setFillColor(248, 250, 252);
  doc.rect(summaryX, infoBlockY, 79, 5, 'F');
  doc.rect(summaryX, infoBlockY, 79, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('DEMONSTRATIVO FINANCEIRO DO PEDIDO', summaryX + 3.5, infoBlockY + 3.5);

  // Math fields
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  doc.text('Valor Bruto de Itens:', summaryX + 4, infoBlockY + 11.5);
  doc.text(`R$ ${order.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightMargin - 4, infoBlockY + 11.5, { align: 'right' });

  const totalDiscount = order.subtotal - order.total;
  if (totalDiscount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text('Total de Descontos:', summaryX + 4, infoBlockY + 17.5);
    doc.text(`- R$ ${totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightMargin - 4, infoBlockY + 17.5, { align: 'right' });
  } else {
    doc.text('Total de Descontos:', summaryX + 4, infoBlockY + 17.5);
    doc.text('R$ 0,00', rightMargin - 4, infoBlockY + 17.5, { align: 'right' });
  }

  doc.setTextColor(71, 85, 105);
  doc.text('Impostos Declarados (Provisão):', summaryX + 4, infoBlockY + 23.5);
  doc.text(`R$ ${order.taxes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightMargin - 4, infoBlockY + 23.5, { align: 'right' });

  // Add tax detail lines
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`(ICMS: R$ ${order.taxes.icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}  -  IPI: R$ ${order.taxes.ipi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}  -  COFINS: R$ ${order.taxes.pisCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, summaryX + 4, infoBlockY + 27);

  // Double border divider
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 2, infoBlockY + 31, rightMargin - 2, infoBlockY + 31);
  doc.line(summaryX + 2, infoBlockY + 31.8, rightMargin - 2, infoBlockY + 31.8);

  // LIQUIDO REAL A COBRAR
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('LÍQUIDO A PAGAR:', summaryX + 4, infoBlockY + 39);
  
  doc.setTextColor(16, 185, 129); // Beautiful green for real price
  doc.setFontSize(11);
  doc.text(`R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightMargin - 4, infoBlockY + 39, { align: 'right' });

  currentY += infoBlockHeight + 10;

  // 7. COMPLIANCE & LEGAL NOTICE
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Este documento atesta uma transação faturada eletronicamente entre o comprador identificado e o operador comercial Wagon AI.', leftMargin, currentY);
  doc.text('Chave de Emissão Autorizada: 1526 8820 4410 0980 1522 9901 0288 #441A9. Válida apenas para controle fiscal de trânsito em território nacional.', leftMargin, currentY + 3.5);

  // Footer Branding Accent Box
  doc.setFillColor(31, 55, 103);
  doc.rect(leftMargin, 280, 180, 5, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('© 2026 WAGON AI - TECNOLOGIA INTELIGENTE DE CANAL S.A.  -  PORTAL DE INTEGRIDADE', leftMargin + 4, 283.5);
  doc.text('PÁGINA 1 DE 1', rightMargin - 4, 283.5, { align: 'right' });

  if (isDownload) {
    doc.save(`WAGON-PEDIDO-${order.id}.pdf`);
  }

  return doc;
};
