import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Correctly import StockTransactionType and other types. The alias was incorrect.
import { Screen, StockTransaction, DayBookEntry, StockTransactionType } from '../types.js';
import Header from './common/Header.js';
import { UsersIcon, TruckIcon, WalletIcon, ArrowUpRightIcon, ArrowDownLeftIcon, DocumentChartBarIcon, PencilIcon, TrashIcon, PrinterIcon, WhatsAppIcon } from './Icons.js';
import Modal from './common/Modal.js';
import BillForm from './forms/BillForm.js';
import DayBookForm from './forms/DayBookForm.js';

// Declare html2canvas from global scope (loaded via CDN)
declare const html2canvas: any;

interface PartyDetailScreenProps {
  partyId: string;
}

interface MappedTransaction {
    id: string; // DayBookEntry ID
    date: Date;
    description: string;
    cashIn: number;
    cashOut: number;
    type: string;
    originalType: 'daybook' | 'stock';
    originalTxn: DayBookEntry | StockTransaction;
}

const PartyDetailScreen: React.FC<PartyDetailScreenProps> = ({ partyId }) => {
  const { state, dispatch } = useContext(AppContext);
  const { parties, dayBookEntries, stockTransactions } = state;

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  // Fix: The state should hold a StockTransactionType ('Buy' | 'Sell'), not a full StockTransaction object.
  const [billTypeForForm, setBillTypeForForm] = useState<StockTransactionType>('Sell');
  
  const [isDayBookModalOpen, setIsDayBookModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DayBookEntry | null>(null);

  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const todayISO = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfYear);
  const [endDate, setEndDate] = useState(todayISO);

  const party = parties.find(p => p.id === partyId);

  const filteredTransactions = useMemo<MappedTransaction[]>(() => {
    if (!party) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dayBookTxns = dayBookEntries
      .filter(e => e.partyId === party.id)
      .map(e => {
        const isStockRelated = e.id.startsWith('db-st-');
        let type = 'Day Book';
        let originalStockTxn: StockTransaction | null = null;

        if (isStockRelated) {
            const stockTxnId = e.id.substring(3); // remove 'db-' prefix
            originalStockTxn = stockTransactions.find(st => st.id === stockTxnId) || null;
            if (originalStockTxn) {
                type = `Stock ${originalStockTxn.type}`;
            }
        }
        
        return {
          id: e.id,
          date: new Date(e.date),
          description: e.details,
          cashIn: e.cashIn,
          cashOut: e.cashOut,
          type: type,
          originalType: originalStockTxn ? 'stock' : 'daybook' as 'stock' | 'daybook',
          originalTxn: originalStockTxn || e
        };
      });

    return dayBookTxns
        .filter(txn => txn.date >= start && txn.date <= end)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [party, dayBookEntries, stockTransactions, startDate, endDate]);


  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, txn) => {
      acc.totalIn += txn.cashIn;
      acc.totalOut += txn.cashOut;
      return acc;
    }, { totalIn: 0, totalOut: 0 });
  }, [filteredTransactions]);
  
  const handleYouGotClick = () => {
    setBillTypeForForm('Sell'); // 'Sell' means money comes IN
    setIsBillModalOpen(true);
  };

  const handleYouGaveClick = () => {
    setBillTypeForForm('Buy'); // 'Buy' means money goes OUT
    setIsBillModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsBillModalOpen(false);
  };
  
  const handleEdit = (txn: MappedTransaction) => {
    if (txn.originalType === 'daybook') {
        setEditingEntry(txn.originalTxn as DayBookEntry);
        setIsDayBookModalOpen(true);
    } else {
        const stockTxn = txn.originalTxn as StockTransaction;
        dispatch({
            type: 'NAVIGATE',
            payload: {
                screen: Screen.StockTransaction,
                payload: {
                    transactionId: stockTxn.id,
                    itemId: stockTxn.itemId,
                    transactionType: stockTxn.type
                }
            }
        });
    }
  };

  const handleDelete = (txn: MappedTransaction) => {
    const { id, originalType, originalTxn } = txn;
    if (originalType === 'stock') {
        // For stock-related entries, we delete the stock transaction.
        // The reducer handles deleting the associated daybook entry.
        dispatch({ type: 'DELETE_STOCK_TRANSACTION', payload: (originalTxn as StockTransaction).id });
    } else {
        // For pure daybook entries, we delete the daybook entry directly.
        dispatch({ type: 'DELETE_DAYBOOK_ENTRY', payload: id });
    }
  };


  const handleSaveDayBookEntry = (entry: DayBookEntry) => {
      dispatch({ type: 'EDIT_DAYBOOK_ENTRY', payload: entry });
      setIsDayBookModalOpen(false);
      setEditingEntry(null);
  };
  
  const handlePrint = () => {
    const printContentEl = document.getElementById('party-detail-content');
    if (!party || !printContentEl) return;

    const title = `Details for ${party.name}`;
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
      if (!party) return;
      const text = `Here is the summary for ${party.name}. Current balance is PKR ${party.balance.toFixed(2)} ${party.balance >= 0 ? 'Receivable' : 'Payable'}.`;
      const url = window.location.href; 
      const message = encodeURIComponent(`${text}\n\n${url}`);
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };


  if (!party) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <Header title="Error" backScreen={Screen.Customers} />
        <p className="p-4 text-center">Party not found.</p>
      </div>
    );
  }

  const backScreen = party.type === 'Customer' ? Screen.Customers : Screen.Suppliers;

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <Header title="Party Details" backScreen={backScreen} />
      <main id="party-detail-content" className="flex-grow p-4 space-y-4 overflow-y-auto pb-44 printable-area">
        <section className="bg-white p-4 rounded-md shadow-sm border">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-100 rounded-full">
                {party.type === 'Customer' ? (
                    <UsersIcon className="h-8 w-8 text-teal-600" />
                ) : (
                    <TruckIcon className="h-8 w-8 text-teal-600" />
                )}
                </div>
                <div className="flex-grow">
                <h2 className="text-lg font-bold text-slate-800">{party.name}</h2>
                {party.businessName && <p className="text-sm text-slate-600">{party.businessName}</p>}
                {party.phone && <p className="text-xs text-slate-500 mt-1">{party.phone}</p>}
                </div>
            </div>
            <div className={`mt-4 p-4 rounded-md text-center ${party.balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                <p className="text-xs font-medium">Balance</p>
                <p className="text-xl font-bold">
                  PKR {party.balance >= 0 ? '+' : ''}{party.balance.toFixed(2)}
                </p>
            </div>
        </section>
        
        <section className="bg-white p-4 rounded-md shadow-sm border grid grid-cols-2 gap-4">
            <button onClick={handleYouGotClick} className="text-center p-2 rounded-md bg-emerald-100 hover:bg-emerald-200 transition-colors">
                <p className="text-xs text-emerald-700 flex items-center justify-center gap-1">
                <ArrowDownLeftIcon className="h-4 w-4" /> Cash In
                </p>
                <p className="text-sm font-semibold text-emerald-600">PKR {stats.totalIn.toFixed(2)}</p>
            </button>
            <button onClick={handleYouGaveClick} className="text-center p-2 rounded-md bg-rose-100 hover:bg-rose-200 transition-colors">
                <p className="text-xs text-rose-700 flex items-center justify-center gap-1">
                <ArrowUpRightIcon className="h-4 w-4" /> Cash Out
                </p>
                <p className="text-sm font-semibold text-rose-600">PKR {stats.totalOut.toFixed(2)}</p>
            </button>
        </section>

        <section className="bg-white p-4 rounded-md shadow-sm border no-print">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Statement & Reports</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label className="text-xs font-medium text-slate-500">From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-500">To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-md shadow-sm" />
                </div>
            </div>
             <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { screen: Screen.PartyReport, payload: { partyId: party.id } } })} className="flex items-center justify-center gap-2 p-3 text-sm bg-teal-100 text-teal-800 rounded-lg w-full hover:bg-teal-200">
                <DocumentChartBarIcon className="h-5 w-5" /> View Full Report
            </button>
        </section>
        
        <section className="bg-white p-4 rounded-md shadow-sm border">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Transaction History</h3>
            <div className="space-y-2">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(txn => (
                        <div key={txn.id} className="bg-slate-50 p-3 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{txn.description}</p>
                                    <p className="text-xs text-slate-500">{txn.date.toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    {txn.cashIn > 0 && <p className="font-bold text-sm text-emerald-600">+ PKR {txn.cashIn.toFixed(2)}</p>}
                                    {txn.cashOut > 0 && <p className="font-bold text-sm text-rose-600">- PKR {txn.cashOut.toFixed(2)}</p>}
                                </div>
                            </div>
                            <div className="flex justify-end mt-1 gap-1">
                                <button onClick={() => handleEdit(txn)} className="p-1 text-slate-400 hover:text-teal-600 text-xs rounded-full"><PencilIcon className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(txn)} className="p-1 text-slate-400 hover:text-rose-600 text-xs rounded-full"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-500 p-6">
                        <WalletIcon className="h-12 w-12 mx-auto text-slate-400" />
                        <p className="mt-2">No transactions in selected range.</p>
                    </div>
                )}
            </div>
        </section>
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
      <Modal isOpen={isBillModalOpen} onClose={handleModalClose} title="Create Transaction Bill">
        <BillForm onSave={handleModalClose} onCancel={handleModalClose} fixedPartyId={partyId} defaultTransactionType={billTypeForForm} />
      </Modal>
      <Modal isOpen={isDayBookModalOpen} onClose={() => setIsDayBookModalOpen(false)} title="Edit Entry">
          <DayBookForm
              entry={editingEntry}
              onSave={handleSaveDayBookEntry}
              onCancel={() => setIsDayBookModalOpen(false)}
          />
      </Modal>
    </div>
  );
};

export default PartyDetailScreen;