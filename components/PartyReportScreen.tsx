import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen } from '../types.js';
import Header from './common/Header.js';
import { PrinterIcon, WhatsAppIcon } from './Icons.js';

interface PartyReportScreenProps {
  partyId: string;
}

const PartyReportScreen: React.FC<PartyReportScreenProps> = ({ partyId }) => {
    const { state, dispatch } = useContext(AppContext);
    const { parties, dayBookEntries, stockTransactions, stockItems, user } = state;

    const party = useMemo(() => parties.find(p => p.id === partyId), [parties, partyId]);

    const transactionsWithBalance = useMemo(() => {
        if (!party) return [];

        const dayBookTxns = dayBookEntries
          .filter(e => e.partyId === party.id)
          .map(e => ({
            id: e.id,
            date: new Date(e.date),
            description: e.details,
            debit: e.cashOut, // We gave them money
            credit: e.cashIn, // We got money from them
          }));

        const stockTxns = stockTransactions
          .filter(t => t.partyId === party.id)
          .map(t => {
            const isBuy = t.type === 'Buy'; // We bought from them (supplier)
            const itemName = stockItems.find(i => i.id === t.itemId)?.name || 'Unknown Item';
            return {
              id: t.id,
              date: new Date(t.date),
              description: `${isBuy ? 'Purchased' : 'Sold'}: ${itemName}`,
              debit: isBuy ? 0 : t.totalAmount, // Sell is a debit for customer
              credit: isBuy ? t.totalAmount : 0, // Buy is a credit for supplier
            }
          });
        
        const sorted = [...dayBookTxns, ...stockTxns].sort((a, b) => a.date.getTime() - b.date.getTime());
        
        let runningBalance = 0;
        return sorted.map(txn => {
            runningBalance += txn.debit - txn.credit;
            return { ...txn, balance: runningBalance };
        });

    }, [party, dayBookEntries, stockTransactions, stockItems]);
    
    const finalStats = useMemo(() => {
        const stats = transactionsWithBalance.reduce((acc, txn) => {
            acc.totalDebit += txn.debit;
            acc.totalCredit += txn.credit;
            return acc;
        }, { totalDebit: 0, totalCredit: 0});

        const finalBalance = transactionsWithBalance.length > 0 ? transactionsWithBalance[transactionsWithBalance.length - 1].balance : 0;
        return { ...stats, finalBalance };

    }, [transactionsWithBalance]);

    if (!party || !user) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Error" backScreen={Screen.Customers} />
                <p className="p-4 text-center">Party or User not found.</p>
            </div>
        );
    }
    
    const handleBack = () => {
         dispatch({ type: 'NAVIGATE', payload: { screen: Screen.PartyDetail, payload: { partyId } } });
    }
    
    const handlePrint = () => {
        const printContentEl = document.getElementById('party-report-content');
        if (!printContentEl || !party) return;

        const title = `Statement for ${party.name}`;
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
        const text = `Here is the statement for ${party.name}. Current balance is PKR ${party.balance.toFixed(2)} ${party.balance >= 0 ? 'Receivable' : 'Payable'}.`;
        const url = window.location.href;
        const message = encodeURIComponent(`${text}\n\n${url}`);
        window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-slate-100">
            <Header title="Party Statement" onBack={handleBack} />
            <main id="party-report-content" className="flex-grow p-4 overflow-y-auto pb-32 printable-area">
                <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                    <div className="bg-sky-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">{user?.businessName || user?.name}</h1>
                                <p className="text-xs text-slate-500">{user?.address}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold uppercase text-slate-400">Statement</h2>
                                <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-500">Statement For:</p>
                                <p className="font-bold text-slate-700">{party.name}</p>
                                <p className="text-xs text-slate-600">{party.address}</p>
                                <p className="text-xs text-slate-600">{party.phone}</p>
                            </div>
                            <div className={`p-3 rounded-md text-right ${party.balance >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                <p className="text-xs font-medium">Closing Balance</p>
                                <p className="text-xl font-bold">PKR {Math.abs(party.balance).toFixed(2)}</p>
                                <p className="text-xs font-semibold">{party.balance >= 0 ? 'Receivable' : 'Payable'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs bg-white">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600">Date</th>
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600">Description</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600">You Gave (Debit)</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600">You Got (Credit)</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {transactionsWithBalance.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-2 py-2 whitespace-nowrap">{t.date.toLocaleDateString()}</td>
                                            <td className="px-2 py-2">{t.description}</td>
                                            <td className="px-2 py-2 text-right">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                            <td className="px-2 py-2 text-right">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                            <td className={`px-2 py-2 text-right font-medium ${t.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {Math.abs(t.balance).toFixed(2)} {t.balance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-100 font-bold">
                                    <tr>
                                        <td colSpan={2} className="px-2 py-2 text-right">Totals:</td>
                                        <td className="px-2 py-2 text-right">{finalStats.totalDebit.toFixed(2)}</td>
                                        <td className="px-2 py-2 text-right">{finalStats.totalCredit.toFixed(2)}</td>
                                        <td className={`px-2 py-2 text-right font-bold ${finalStats.finalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {Math.abs(finalStats.finalBalance).toFixed(2)} {finalStats.finalBalance >= 0 ? 'Dr' : 'Cr'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
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

export default PartyReportScreen;