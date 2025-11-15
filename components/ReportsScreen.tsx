import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen, StockTransaction, DayBookEntry } from '../types.js';
import Header from './common/Header.js';
import { ChartBarIcon, PencilIcon, TrashIcon } from './Icons.js';
import Modal from './common/Modal.js';
import DayBookForm from './forms/DayBookForm.js';

type CombinedTransaction = {
  id: string; // prefixed with 'db-' or 'st-'
  date: Date;
  description: string;
  partyName: string;
  type: 'Sale' | 'Purchase' | 'Cash In' | 'Cash Out';
  amount: number;
  partyId?: string;
  itemId?: string; // For stock transactions
};

type ChartDataPoint = {
    date: string;
    totalIn: number;
    totalOut: number;
};

const ReportsScreen: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { parties, dayBookEntries, stockTransactions, stockItems } = state;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayISO = today.toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(todayISO);
    const [partyFilter, setPartyFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase' | 'cash_in' | 'cash_out'>('all');
    
    const [isDayBookModalOpen, setIsDayBookModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DayBookEntry | null>(null);

    const getItemName = (itemId: string) => stockItems.find(i => i.id === itemId)?.name || 'Unknown';
    const getPartyName = (partyId?: string) => parties.find(p => p.id === partyId)?.name || 'N/A';
    
    const combinedTransactions = useMemo<CombinedTransaction[]>(() => {
        const dayBookTxns = dayBookEntries.map(e => ({
            id: `db-${e.id}`,
            date: new Date(e.date),
            description: e.details,
            partyName: getPartyName(e.partyId),
            type: e.cashIn > 0 ? 'Cash In' : 'Cash Out' as 'Cash In' | 'Cash Out',
            amount: e.cashIn > 0 ? e.cashIn : e.cashOut,
            partyId: e.partyId
        }));

        const stockTxns = stockTransactions.map(t => ({
            id: `st-${t.id}`,
            date: new Date(t.date),
            description: `${t.type === 'Buy' ? 'Purchased' : 'Sold'}: ${t.quantity} x ${getItemName(t.itemId)}`,
            partyName: getPartyName(t.partyId),
            type: t.type === 'Buy' ? 'Purchase' : 'Sale' as 'Purchase' | 'Sale',
            amount: t.totalAmount,
            partyId: t.partyId,
            itemId: t.itemId, // Add itemId
        }));
        
        return [...dayBookTxns, ...stockTxns].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [dayBookEntries, stockTransactions, parties, stockItems]);
    
    const filteredTransactions = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return combinedTransactions.filter(txn => {
            const dateMatch = txn.date >= start && txn.date <= end;
            const partyMatch = partyFilter === 'all' || txn.partyId === partyFilter;
            const typeMatch = typeFilter === 'all' ||
                (typeFilter === 'sale' && txn.type === 'Sale') ||
                (typeFilter === 'purchase' && txn.type === 'Purchase') ||
                (typeFilter === 'cash_in' && txn.type === 'Cash In') ||
                (typeFilter === 'cash_out' && txn.type === 'Cash Out');
            
            return dateMatch && partyMatch && typeMatch;
        });
    }, [combinedTransactions, startDate, endDate, partyFilter, typeFilter]);
    
    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, txn) => {
            if (txn.type === 'Sale') acc.sales += txn.amount;
            if (txn.type === 'Purchase') acc.purchases += txn.amount;
            if (txn.type === 'Cash In') acc.cashIn += txn.amount;
            if (txn.type === 'Cash Out') acc.cashOut += txn.amount;
            return acc;
        }, { sales: 0, purchases: 0, cashIn: 0, cashOut: 0 });
    }, [filteredTransactions]);

    const chartData = useMemo<ChartDataPoint[]>(() => {
        const dailyData: { [date: string]: { totalIn: number; totalOut: number } } = {};
        
        filteredTransactions.forEach(txn => {
            const dateStr = txn.date.toISOString().split('T')[0];
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { totalIn: 0, totalOut: 0 };
            }
            if (txn.type === 'Sale' || txn.type === 'Cash In') {
                dailyData[dateStr].totalIn += txn.amount;
            }
            if (txn.type === 'Purchase' || txn.type === 'Cash Out') {
                dailyData[dateStr].totalOut += txn.amount;
            }
        });

        return Object.entries(dailyData)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [filteredTransactions]);
    
    const totalIn = summary.sales + summary.cashIn;
    const totalOut = summary.purchases + summary.cashOut;
    const netCashFlow = totalIn - totalOut;
    
    const handleEdit = (txn: CombinedTransaction) => {
        if (txn.id.startsWith('db-')) {
            const entryId = txn.id.substring(3);
            const originalEntry = dayBookEntries.find(e => e.id === entryId);
            if (originalEntry) {
                setEditingEntry(originalEntry);
                setIsDayBookModalOpen(true);
            }
        } else if (txn.id.startsWith('st-')) {
            const txnId = txn.id.substring(3);
            const originalTxn = stockTransactions.find(t => t.id === txnId);
            if (originalTxn) {
                dispatch({
                    type: 'NAVIGATE',
                    payload: {
                        screen: Screen.StockTransaction,
                        payload: {
                            transactionId: originalTxn.id,
                            itemId: originalTxn.itemId,
                            transactionType: originalTxn.type
                        }
                    }
                });
            }
        }
    };

    const handleDelete = (txn: CombinedTransaction) => {
        if (txn.id.startsWith('db-')) {
            dispatch({ type: 'DELETE_DAYBOOK_ENTRY', payload: txn.id.substring(3) });
        } else if (txn.id.startsWith('st-')) {
            dispatch({ type: 'DELETE_STOCK_TRANSACTION', payload: txn.id.substring(3) });
        }
    };

    const handleSaveDayBookEntry = (entry: DayBookEntry) => {
        dispatch({ type: 'EDIT_DAYBOOK_ENTRY', payload: entry });
        setIsDayBookModalOpen(false);
        setEditingEntry(null);
    };

    const SummaryCard: React.FC<{title: string; value: number; color: string}> = ({title, value, color}) => (
        <div className={`p-2 rounded-md ${color}`}>
            <p className="text-sm">{title}</p>
            <p className="text-base font-bold">PKR {value.toFixed(2)}</p>
        </div>
    );
    
    const CashFlowChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
        const maxValue = useMemo(() => {
            if (data.length === 0) return 1;
            const max = Math.max(...data.map(d => Math.max(d.totalIn, d.totalOut)));
            return max === 0 ? 1 : max;
        }, [data]);

        if (data.length === 0) return null;

        return (
            <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                 <h2 className="text-lg font-bold text-slate-800 mb-3">Cash Flow Overview</h2>
                 <div className="flex justify-center gap-4 mb-2">
                    <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>Total In</div>
                    <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div>Total Out</div>
                 </div>
                 <div className="flex gap-2 items-end border-b-2 border-slate-200 pt-4 pb-2 h-48 overflow-x-auto">
                    {data.map(point => (
                        <div key={point.date} className="flex flex-col items-center flex-shrink-0 w-16 group">
                           <div className="flex gap-1 items-end h-full">
                                <div 
                                    className="w-5 bg-emerald-500 rounded-t-sm hover:opacity-80" 
                                    style={{ height: `${(point.totalIn / maxValue) * 100}%` }}
                                    title={`In: ${point.totalIn.toFixed(2)}`}
                                ></div>
                                <div 
                                    className="w-5 bg-rose-500 rounded-t-sm hover:opacity-80" 
                                    style={{ height: `${(point.totalOut / maxValue) * 100}%` }}
                                    title={`Out: ${point.totalOut.toFixed(2)}`}
                                ></div>
                           </div>
                           <p className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                               {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </p>
                        </div>
                    ))}
                 </div>
            </div>
        );
    };


    return (
        <div className="flex flex-col h-full bg-slate-100">
            <Header title="Transaction Reports" backScreen={Screen.Home} />
            <div id="reports-content" className="flex-grow flex flex-col">
                <div className="p-3 bg-white shadow-sm border-b sticky top-[52px] z-10 no-print">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <label className="text-xs font-medium text-slate-500">Party</label>
                            <select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm bg-white">
                                <option value="all">All Parties</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500">Type</label>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm bg-white">
                                <option value="all">All Types</option>
                                <option value="sale">Sale</option>
                                <option value="purchase">Purchase</option>
                                <option value="cash_in">Cash In</option>
                                <option value="cash_out">Cash Out</option>
                            </select>
                        </div>
                    </div>
                </div>

                <main className="flex-grow p-4 overflow-y-auto pb-28 printable-area">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-3">Report Summary</h2>
                        <div className="grid grid-cols-2 gap-3 text-white text-center">
                            <SummaryCard title="Total In (Sales + Cash In)" value={totalIn} color="bg-emerald-500" />
                            <SummaryCard title="Total Out (Purchases + Cash Out)" value={totalOut} color="bg-rose-500" />
                            <SummaryCard title="Net Cash Flow" value={netCashFlow} color={netCashFlow >= 0 ? "bg-sky-600" : "bg-amber-600"} />
                            <SummaryCard title="Total Sales" value={summary.sales} color="bg-indigo-500" />
                        </div>
                    </div>

                    <div className="mt-4 bg-white p-4 rounded-lg shadow-sm grid grid-cols-2 gap-3 no-print">
                        <button onClick={() => dispatch({type: 'NAVIGATE', payload: { screen: Screen.StockInReport }})} className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-md hover:bg-emerald-100 text-sm">View Stock In Report</button>
                        <button onClick={() => dispatch({type: 'NAVIGATE', payload: { screen: Screen.StockOutReport }})} className="p-3 bg-rose-50 text-rose-700 font-semibold rounded-md hover:bg-rose-100 text-sm">View Stock Out Report</button>
                    </div>

                    <CashFlowChart data={chartData} />
                    
                    <div className="mt-4 bg-white rounded-lg shadow-sm overflow-hidden">
                        <h3 className="text-base font-semibold text-slate-700 p-4 border-b">Transactions</h3>
                        {filteredTransactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600">Description</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600">Type</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600">Amount</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600 no-print">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredTransactions.map(txn => (
                                            <tr key={txn.id}>
                                                <td className="px-3 py-2 whitespace-nowrap">{txn.date.toLocaleDateString()}</td>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-slate-800">{txn.description}</p>
                                                    <p className="text-xs text-slate-500">{txn.partyName}</p>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                        txn.type === 'Sale' || txn.type === 'Cash In' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>{txn.type}</span>
                                                </td>
                                                <td className={`px-3 py-2 text-right font-semibold ${
                                                    txn.type === 'Sale' || txn.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    PKR {txn.amount.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-right no-print">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <button onClick={() => handleEdit(txn)} className="p-1 text-slate-400 hover:text-teal-600 rounded-full"><PencilIcon className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDelete(txn)} className="p-1 text-slate-400 hover:text-rose-600 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-6 text-slate-500">
                                <ChartBarIcon className="h-12 w-12 mx-auto text-slate-400" />
                                <p className="mt-2">No transactions found for the selected criteria.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
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

export default ReportsScreen;