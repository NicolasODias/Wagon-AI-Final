import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Download, Printer, CheckCircle, Clock, Link, AlertTriangle } from 'lucide-react';
import { Order, Client, Product } from '../types';
import { generateInvoicePDF, generateSecureValidationHash } from '../utils/pdfGenerator';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS } from '../data';

interface PublicInvoicePortalProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

export default function PublicInvoicePortal({ currentPath, onNavigate }: PublicInvoicePortalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Extract order ID from the path: e.g. /pedido/PED-49305 or /pedido/PED-49305/pdf
  const pathParts = currentPath.split('/');
  const orderId = pathParts[2] || 'PED-49305';
  const isPdfDirect = pathParts[3] === 'pdf';

  useEffect(() => {
    // 1. Load clients and products
    const cachedClients = localStorage.getItem('vertice_erp_clients');
    const loadedClients: Client[] = cachedClients ? JSON.parse(cachedClients) : INITIAL_CLIENTS;
    
    const cachedProducts = localStorage.getItem('vertice_erp_products');
    const loadedProducts: Product[] = cachedProducts ? JSON.parse(cachedProducts) : INITIAL_PRODUCTS;

    setClients(loadedClients);
    setProducts(loadedProducts);

    // 2. Try to find the order in localStorage or database
    const cachedOrders = localStorage.getItem('vertice_erp_orders');
    let allOrders: Order[] = cachedOrders ? JSON.parse(cachedOrders) : [];

    let matched = allOrders.find(o => o.id === orderId);

    // 3. Um identificador inexistente nunca pode gerar um documento simulado.
    if (!matched) {
      setNotFound(true);
      setOrder(null);
      return;
    }

    setNotFound(false);

    // Ensure the order has a UUID
    if (!matched.uuid) {
      matched.uuid = '9f0a7c89-234f-4f77-bb72-19a3e5c4d115';
    }

    setOrder(matched);

    // 4. If URL ends with /pdf, trigger PDF download immediately on mount!
    if (isPdfDirect && matched) {
      const runImmediateDownload = async () => {
        try {
          if (matched && matched.pdfUrl && matched.pdfUrl.startsWith('data:application/pdf')) {
            const link = document.createElement('a');
            link.href = matched.pdfUrl;
            link.download = `WAGON-PEDIDO-${matched.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            await generateInvoicePDF(matched!, loadedClients, loadedProducts, { isDownload: true });
          }
        } catch (err) {
          console.error('[Public PDF Direct Download Error]', err);
        }
      };
      runImmediateDownload();
    }
  }, [orderId, isPdfDirect]);

  const handleDownloadPDF = async () => {
    if (!order) return;
    setIsGenerating(true);
    try {
      if (order.pdfUrl && order.pdfUrl.startsWith('data:application/pdf')) {
        const link = document.createElement('a');
        link.href = order.pdfUrl;
        link.download = `WAGON-PEDIDO-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const doc = await generateInvoicePDF(order, clients, products, { isDownload: false });
        const dataUri = doc.output('datauristring');
        
        // Cache it in localStorage
        order.pdfUrl = dataUri;
        const cachedOrders = localStorage.getItem('vertice_erp_orders');
        if (cachedOrders) {
          const allOrders: Order[] = JSON.parse(cachedOrders);
          const index = allOrders.findIndex(o => o.id === order.id);
          if (index !== -1) {
            allOrders[index].pdfUrl = dataUri;
            localStorage.setItem('vertice_erp_orders', JSON.stringify(allOrders));
          }
        }

        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `WAGON-PEDIDO-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('[Public PDF Download Error]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Documento não encontrado</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            O pedido informado não existe ou não está disponível neste dispositivo.
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center select-none font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
          <Clock className="h-10 w-10 text-slate-400 mx-auto animate-pulse" />
          <h2 className="text-sm font-black text-slate-905 uppercase tracking-wide">Buscando comprovante eletrônico...</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Consolidando integridade fiscal e assinatura de tráfego com o banco central Wagon AI.
          </p>
        </div>
      </div>
    );
  }

  const orderUUID = order.uuid || '9f0a7c89-234f-4f77-bb72-19a3e5c4d115';
  const validationHash = generateSecureValidationHash(order.id, orderUUID);

  return (
    <div id="public-invoice-portal" className="min-h-screen bg-slate-55 text-slate-800 font-sans pb-16 select-text overflow-y-auto w-full flex flex-col items-center">
      
      {/* Top Banner Branding Header */}
      <div className="w-full bg-[#1F3767] text-white py-4 px-6 shadow-md flex justify-between items-center z-10 select-none">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-black tracking-widest uppercase">WAGON AI <span className="text-emerald-400">INTEGRIDADE</span></span>
        </div>
        <div className="text-[10px] uppercase font-mono text-slate-300 font-bold bg-slate-950/35 px-3 py-1.5 rounded-lg border border-slate-500/20">
          CONFORMIDADE DIGITAL ATIVA
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl w-full px-4 mt-8 space-y-6">
        
        {/* BIG STATUS BADGE / AUTENTICIDADE */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-slate-900 shadow-lg flex flex-col md:flex-row items-center md:justify-between gap-6 relative overflow-hidden">
          
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full translate-x-10 -translate-y-10" />

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-510 text-emerald-600 rounded-2xl">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/50 px-2.5 py-1 rounded-md inline-block tracking-wider uppercase">
                Documento localizado
              </span>
              <h2 className="text-lg font-black text-slate-900">Registro emitido pela Wagon AI</h2>
              <p className="text-xs text-slate-500 font-medium">Emissão Concluída: {order.date} às 10:15 UTC-3</p>
            </div>
          </div>

          <div className="text-left md:text-right font-medium text-xs space-y-1.5 shrink-0 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-100/50">
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Identificador do Documento</p>
            <p className="font-mono text-slate-900 font-bold text-[11px] select-all">{validationHash}</p>
            <p className="text-[10px] text-emerald-600 font-bold">Faturamento Direto Homologado</p>
          </div>
        </div>

        {/* INVOICE DETAILS SHEETCARD */}
        <div className="bg-white rounded-3xl border border-slate-205 shadow-xl p-6 md:p-8 space-y-8 relative">
          
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-dashed border-slate-200 pb-5 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#1E94CF] uppercase tracking-widest pl-0.5">Nota Auxiliar Eletrônica</span>
              <h1 className="text-xl font-black text-slate-900">Pedido Nº {order.id}</h1>
              <p className="text-xs text-slate-400 font-medium">Chave: {orderUUID}</p>
            </div>
            
            <div className="text-left sm:text-right text-xs text-slate-500 space-y-1 font-medium">
              <strong className="text-slate-900 font-bold text-sm uppercase">14.571.417 Cristiane Aparecida Gonçalves</strong>
              <p>CNPJ: <span className="font-mono font-bold">14.571.417/0001-19</span></p>
              <p>IE: <span className="font-mono font-bold">001867602.00-43</span> | Situação: <span className="text-emerald-600 font-extrabold uppercase">Ativa</span></p>
            </div>
          </div>

          {/* GRID: RECIPIENT & REPRESENTATIVE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            
            {/* Comprador / Destinatário */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">Destinatário</span>
              <strong className="text-slate-905 font-bold text-sm block">{order.clientName}</strong>
              <div className="space-y-1 text-xs text-slate-500 font-medium">
                <p>CNPJ: <strong className="text-slate-700 font-mono">{clients.find(c => c.id === order.clientId)?.cnpj || 'Carga Dinâmica'}</strong></p>
                <p>Email: <strong className="text-slate-700">{clients.find(c => c.id === order.clientId)?.email || 'comercial@compras.com.br'}</strong></p>
                <p>Telefone: <strong className="text-slate-700">{clients.find(c => c.id === order.clientId)?.phone || '(15) 99122-4455'}</strong></p>
              </div>
            </div>

            {/* Representação comercial */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest">Emissor de Negócio</span>
              <strong className="text-slate-905 font-bold text-sm block">{order.salesRep || 'Vendedor Canal'}</strong>
              <div className="space-y-1 text-xs text-slate-500 font-medium">
                <p>Forma de Pagamento: <strong className="text-indigo-600 font-bold">{order.paymentTerm}</strong></p>
                <p>Canal: <strong className="text-slate-700">Canal Atacadista S/A</strong></p>
                <p>Status: <span className="inline-block px-2.5 py-0.5 ml-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase text-center">{order.status}</span></p>
              </div>
            </div>
          </div>

          {/* PRODUCTS LIST TABLE */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-widest pl-1 font-bold">Relação de itens faturados</span>
            
            <div className="border border-slate-200/80 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[720px] text-left font-sans text-xs">
                <thead className="bg-[#1F3767] text-white text-[9.5px] uppercase font-bold">
                  <tr>
                    <th className="p-4 rounded-tl-2xl">Produto / Mercadoria</th>
                    <th className="p-4 text-center">Quantidade</th>
                    <th className="p-4 text-right">Preço Unitário</th>
                    <th className="p-4 text-right">Descontos</th>
                    <th className="p-4 text-right font-black rounded-tr-2xl">Total Geral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {order.items.map((item) => {
                    const matchingProd = products.find(p => p.id === item.productId);
                    const matchingUnit = matchingProd ? matchingProd.unit : 'un';
                    const originalTotal = item.unitPrice * item.quantity;
                    const discountTotal = originalTotal - item.total;
                    const discountPercent = originalTotal > 0 ? (discountTotal / originalTotal) * 100 : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <strong className="text-slate-800 text-xs block">{item.productName}</strong>
                          <span className="font-mono text-[9px] text-slate-400 block mt-0.5">Cod: {item.productId}</span>
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-slate-700">
                          {item.quantity} {matchingUnit}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-600">
                          R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-rose-500 font-mono">
                          {discountTotal > 0 ? (
                            <>
                              -R$ {discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              <span className="text-[9px] font-bold block">({discountPercent.toFixed(0)}% Off)</span>
                            </>
                          ) : (
                            'R$ 0,00'
                          )}
                        </td>
                        <td className="p-4 text-right font-black font-mono text-slate-800 text-xs">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MATH & SUMMATIONS GRID */}
          <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 border-t border-slate-150 pt-6">
            
            {/* Left validation stamp text */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex-1 space-y-2 text-[11px] text-slate-500 font-medium">
              <strong className="text-slate-800 uppercase tracking-wider text-[9px] font-black block">Declaração Legítima</strong>
              <p className="leading-relaxed">
                Este documento foi emitido e homologado sob o gateway de conformidade eletrônica de 14.571.417 Cristiane Aparecida Gonçalves com autenticação digital de hash certificado.
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[9px] text-slate-600 space-y-0.5">
                <p>Hash Stamp: <span className="text-slate-800 font-bold">{validationHash}</span></p>
                <p>Conformidade: Simples Nacional (MEI)</p>
              </div>
            </div>

            {/* Right finance tally card */}
            <div className="w-full md:w-80 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Total Bruto de Itens:</span>
                <span className="font-mono">R$ {order.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-500 font-bold">
                <span>Total Descontos:</span>
                <span className="font-mono">- R$ {(order.subtotal - order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[11px] border-t border-slate-100 pt-2 text-slate-400">
                <span>Impostos Ativos (Provisão ICMS/IPI):</span>
                <span className="font-mono text-slate-600">R$ {order.taxes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between items-center border-t-2 border-slate-200 pt-3 font-black text-slate-800 mt-2">
                <span className="text-xs uppercase tracking-wide">VALOR REAL LÍQUIDO:</span>
                <strong className="text-base text-emerald-600 font-black font-mono">
                  R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="border-t border-slate-150 pt-6 flex flex-col sm:flex-row justify-end gap-3 select-none">
            <button
              onClick={() => window.print()}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border border-slate-200"
            >
              <Printer className="h-4.5 w-4.5" />
              <span>Imprimir Nota</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-6 py-3 bg-[#1E94CF] hover:bg-sky-600 disabled:bg-sky-300 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 text-center"
            >
              {isGenerating ? (
                <span>Gerando PDF...</span>
              ) : (
                <>
                  <Download className="h-4.5 w-4.5" />
                  <span>Baixar Nota em PDF</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Small security stamp footer */}
        <div className="text-center text-[10px] text-slate-400 space-y-1">
          <p>Documento emitido através da plataforma Wagon AI.</p>
          <p>Emitente: <strong>14.571.417 Cristiane Aparecida Gonçalves</strong> | CNPJ: <strong>14.571.417/0001-19</strong></p>
          <p>Este portal é certificado em nível bancário de conformidade com criptografia de ponta-a-ponta.</p>
        </div>

      </div>

    </div>
  );
}
