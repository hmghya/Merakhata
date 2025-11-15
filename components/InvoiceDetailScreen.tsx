import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen } from '../types.js';
import Header from './common/Header.js';
import { PrinterIcon, WhatsAppIcon } from './Icons.js';

interface InvoiceDetailScreenProps {
  billNumber: string;
}

const InvoiceDetailScreen: React.FC<InvoiceDetailScreenProps> = ({ billNumber }) => {
    const { state } = useContext(AppContext);
    const { stockTransactions, stockItems, parties, user, screenPayload } = state;

    const invoiceTransactions = useMemo(() => {
        return stockTransactions.filter(t => t.billNumber === billNumber);
    }, [stockTransactions, billNumber]);

    useEffect(() => {
        if (screenPayload?.autoPrint && screenPayload?.billNumber === billNumber) {
            // A small delay ensures the content is fully rendered before the print dialog appears.
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer); // Cleanup timer on unmount
        }
    }, [screenPayload, billNumber]); // Effect dependencies

    if (invoiceTransactions.length === 0 || !user) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Error" backScreen={Screen.Invoices} />
                <p className="p-4 text-center">Invoice or user data not found.</p>
            </div>
        );
    }
    
    const firstTxn = invoiceTransactions[0];
    const party = parties.find(p => p.id === firstTxn.partyId);
    const isSale = firstTxn.type === 'Sell';
    const grandTotal = invoiceTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    const getItemName = (itemId: string) => stockItems.find(item => item.id === itemId)?.name || 'Unknown Item';

    const handlePrint = () => {
        const printContentEl = document.getElementById('invoice-detail-content');
        if (!printContentEl) return;

        const title = `Invoice #${billNumber}`;
        const headContent = document.head.innerHTML;
        const bodyContent = printContentEl.innerHTML;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Could not open print window. Please disable your pop-up blocker.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    ${headContent}
                    <style>
                        @media print {
                            .no-print { display: none !important; }
                            body { margin: 1rem; }
                        }
                    </style>
                </head>
                <body>
                    ${bodyContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleShare = () => {
        const text = `Check out this invoice #${billNumber} for PKR ${grandTotal.toFixed(2)}.`;
        const url = window.location.href; 
        const message = encodeURIComponent(`${text}\n\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-slate-100">
            <Header title={isSale ? 'Invoice' : 'Bill Details'} backScreen={Screen.Invoices} />
            <main id="invoice-detail-content" className="flex-grow p-4 overflow-y-auto pb-32 printable-area">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">{user?.businessName || user?.name || 'Your Business'}</h1>
                            <p className="text-sm text-slate-500">{user?.address}</p>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <p className="text-sm text-slate-500">{user?.phone}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold uppercase text-slate-400">{isSale ? 'Invoice' : 'Purchase Bill'}</h2>
                            <p className="text-sm text-slate-500"># <span className="font-semibold">{billNumber}</span></p>
                            <p className="text-sm text-slate-500">Date: {new Date(firstTxn.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    {/* Bill To */}
                    <div className="py-4">
                        <p className="text-sm font-semibold text-slate-500">{isSale ? 'Bill To:' : 'From:'}</p>
                        {party ? (
                            <>
                                <p className="font-bold text-slate-700">{party.name}</p>
                                <p className="text-sm text-slate-600">{party.businessName}</p>
                                <p className="text-sm text-slate-600">{party.address}</p>
                                <p className="text-sm text-slate-600">{party.phone}</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-600">N/A</p>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Item</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">Qty</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">Price</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {invoiceTransactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2">{getItemName(t.itemId)}</td>
                                        <td className="px-4 py-2 text-right">{t.quantity}</td>
                                        <td className="px-4 py-2 text-right">{t.price.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-medium">{t.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Grand Total */}
                    <div className="flex justify-end pt-4 mt-4 border-t">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Grand Total</p>
                            <p className="text-xl font-bold text-slate-800">PKR {grandTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-3 border-t border-slate-200 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)] z-10 no-print">
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">
                        <PrinterIcon className="h-5 w-5" /> Print / Save PDF
                    </button>
                    <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-white bg-emerald-500 rounded-md hover:bg-emerald-600">
                        <WhatsAppIcon className="h-5 w-5" /> Share
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default InvoiceDetailScreen;