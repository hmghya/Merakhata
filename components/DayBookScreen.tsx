import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext.js';
import { DayBookEntry, Party, PartyType, Screen } from '../types.js';
import Header from './common/Header.js';
import FAB from './common/FAB.js';
import Modal from './common/Modal.js';
import Footer from './common/Footer.js';
import { PencilIcon, TrashIcon, WalletIcon, PrinterIcon } from './Icons.js';
import BillForm from './forms/BillForm.js';
import DayBookForm from './forms/DayBookForm.js';

// --- Main Day Book Screen ---
const DayBookScreen: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [modalType, setModalType] = useState<'none' | 'simple' | 'bill'>('none');
    const [editingEntry, setEditingEntry] = useState<DayBookEntry | null>(null);

    // --- Filtering State ---
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayISO = today.toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(todayISO);
    const [searchTerm, setSearchTerm] = useState('');
    const [partyFilter, setPartyFilter] = useState('all'); // 'all' or a partyId
    const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');

    const getPartyName = useCallback((partyId?: string) => {
        return state.parties.find(p => p.id === partyId)?.name || 'N/A';
    }, [state.parties]);

    const filteredEntries = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return state.dayBookEntries.filter(entry => {
            const entryDateOnly = entry.date.split('T')[0];
            const dateMatch = entryDateOnly >= startDate && entryDateOnly <= endDate;
            const searchMatch = !searchTerm ||
                entry.details.toLowerCase().includes(lowerCaseSearch) ||
                getPartyName(entry.partyId)?.toLowerCase().includes(lowerCaseSearch);
            const partyMatch = partyFilter === 'all' || entry.partyId === partyFilter;
            const typeMatch = typeFilter === 'all' ||
                (typeFilter === 'in' && entry.cashIn > 0) ||
                (typeFilter === 'out' && entry.cashOut > 0);

            return dateMatch && searchMatch && partyMatch && typeMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.dayBookEntries, startDate, endDate, searchTerm, partyFilter, typeFilter, getPartyName]);
    
    // Calculate Opening Balance from all transactions before the start date
    const openingBalance = useMemo(() => {
        const previousEntries = state.dayBookEntries.filter(entry => entry.date < startDate);
        return previousEntries.reduce((balance, entry) => balance + entry.cashIn - entry.cashOut, 0);
    }, [state.dayBookEntries, startDate]);
    
    const filteredSummary = useMemo(() => {
        return filteredEntries.reduce((acc, entry) => {
            acc.cashIn += entry.cashIn;
            acc.cashOut += entry.cashOut;
            return acc;
        }, { cashIn: 0, cashOut: 0 });
    }, [filteredEntries]);

    // Calculate Closing Balance
    const closingBalance = openingBalance + filteredSummary.cashIn - filteredSummary.cashOut;
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Could not open print window. Please disable your pop-up blocker.');
            return;
        }
        const startDateFormatted = new Date(startDate).toLocaleDateString();
        const endDateFormatted = new Date(endDate).toLocaleDateString();
        const businessName = state.user?.businessName || state.user?.name || "Mayra Khata";

        // Calculate running balance for each transaction
        let runningBalance = openingBalance;
        const tableRowsWithBalance = [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort chronologically for running balance
            .map(entry => {
                runningBalance += entry.cashIn - entry.cashOut;
                return `
                    <tr>
                        <td>${new Date(entry.date).toLocaleDateString()}</td>
                        <td>${entry.details}</td>
                        <td>${getPartyName(entry.partyId)}</td>
                        <td class="num">${entry.cashIn > 0 ? entry.cashIn.toFixed(2) : '-'}</td>
                        <td class="num">${entry.cashOut > 0 ? entry.cashOut.toFixed(2) : '-'}</td>
                        <td class="num">${runningBalance.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');

        const printContent = `
            <html>
                <head>
                    <title>Day Book Report - ${businessName}</title>
                    <style>
                        body { font-family: sans-serif; margin: 20px; }
                        h1, h2, h3 { color: #333; }
                        h1 { font-size: 24px; }
                        h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; }
                        .num { text-align: right; }
                        @media print {
                            body { margin: 0; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${businessName}</h1>
                    <h2>Day Book Report (${startDateFormatted} to ${endDateFormatted})</h2>
                    
                    <h3>Transactions Statement</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Details</th>
                                <th>Party</th>
                                <th class="num">Cash In</th>
                                <th class="num">Cash Out</th>
                                <th class="num">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="5" style="font-weight: bold; text-align: right;">Opening Balance</td>
                                <td class="num" style="font-weight: bold;">${openingBalance.toFixed(2)}</td>
                            </tr>
                            ${tableRowsWithBalance}
                            <tr style="border-top: 2px solid #333;">
                                <td colspan="3" style="font-weight: bold; text-align: right;">Total for Period</td>
                                <td class="num" style="font-weight: bold;">${filteredSummary.cashIn.toFixed(2)}</td>
                                <td class="num" style="font-weight: bold;">${filteredSummary.cashOut.toFixed(2)}</td>
                                <td></td>
                            </tr>
                             <tr>
                                <td colspan="5" style="font-weight: bold; text-align: right;">Closing Balance</td>
                                <td class="num" style="font-weight: bold;">${closingBalance.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        }
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
    };


    const handleOpenModal = (type: 'simple' | 'bill', entry?: DayBookEntry) => {
        setEditingEntry(entry || null);
        setModalType(type);
    };

    const handleCloseModal = () => {
        setModalType('none');
        setEditingEntry(null);
    };

    const handleSaveSimpleEntry = (entry: DayBookEntry) => {
        if (editingEntry) {
            dispatch({ type: 'EDIT_DAYBOOK_ENTRY', payload: entry });
        } else {
            dispatch({ type: 'ADD_DAYBOOK_ENTRY', payload: entry });
        }
        handleCloseModal();
    };
    
    const handleDeleteEntry = (entryId: string) => {
        dispatch({ type: 'DELETE_DAYBOOK_ENTRY', payload: entryId });
    };

    const handleSaveBill = () => {
        // The form itself dispatches the action. We just need to close the modal.
        handleCloseModal();
    }
    
    const isAnyFilterActive = searchTerm || partyFilter !== 'all' || typeFilter !== 'all';
    
    const summaryTitle = startDate === endDate 
        ? `Summary for ${new Date(startDate).toLocaleDateString()}` 
        : `Summary for ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <Header title="Day Book" backScreen={Screen.Home} />
            <div id="daybook-content" className="flex-grow flex flex-col">
                <div className="bg-white p-2 sticky top-[52px] z-10 shadow-sm border-b">
                    <section>
                        <h3 className="text-center text-xs font-semibold text-slate-700 mb-2">{summaryTitle}</h3>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-1 bg-sky-50 rounded-md"><p className="text-sky-700">Opening</p><p className="text-xs font-bold text-sky-600">PKR {openingBalance.toFixed(2)}</p></div>
                            <div className="p-1 bg-emerald-50 rounded-md"><p className="text-emerald-700">Cash In</p><p className="text-xs font-bold text-emerald-600">PKR {filteredSummary.cashIn.toFixed(2)}</p></div>
                            <div className="p-1 bg-rose-50 rounded-md"><p className="text-rose-700">Cash Out</p><p className="text-xs font-bold text-rose-600">PKR {filteredSummary.cashOut.toFixed(2)}</p></div>
                            <div className="p-1 bg-slate-200 rounded-md"><p className="text-slate-700">Closing</p><p className="text-xs font-bold text-slate-600">PKR {closingBalance.toFixed(2)}</p></div>
                        </div>
                        {/* Filter Controls */}
                        <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Start Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 py-1 px-2 border border-slate-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">End Date</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 py-1 px-2 border border-slate-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Search</label>
                                <input type="text" placeholder="Details, party..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mt-1 py-1 px-2 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Party</label>
                                    <select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-full mt-1 py-1 px-2 border border-slate-300 rounded-md shadow-sm bg-white">
                                        <option value="all">All Parties</option>
                                        {state.parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                                    <div className="flex rounded-md shadow-sm w-full mt-1">
                                        <button onClick={() => setTypeFilter('all')} className={`flex-1 px-2 py-1 text-xs border border-slate-300 rounded-l-md ${typeFilter === 'all' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white'}`}>All</button>
                                        <button onClick={() => setTypeFilter('in')} className={`flex-1 px-2 py-1 text-xs border-t border-b border-slate-300 ${typeFilter === 'in' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white'}`}>In</button>
                                        <button onClick={() => setTypeFilter('out')} className={`flex-1 px-2 py-1 text-xs border border-slate-300 rounded-r-md ${typeFilter === 'out' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white'}`}>Out</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Export Report</label>
                                <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-200 border border-transparent rounded-md hover:bg-slate-300">
                                    <PrinterIcon className="h-5 w-5" /> Print / Save PDF
                                </button>
                            </div>
                        </section>
                    </div>
                    
                    <main className="flex-grow px-4 pt-2 pb-44 space-y-2 overflow-y-auto bg-slate-100">
                        <div className="bg-white p-2 rounded-lg shadow-sm border-l-4 border-sky-400">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">Opening Balance</p>
                                    <p className="text-xs text-slate-500">As of {new Date(startDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-bold text-sm text-sky-700">PKR {openingBalance.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        {filteredEntries.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">
                                <WalletIcon className="h-16 w-16 mx-auto text-slate-400" />
                                <p className="mt-2 font-semibold">No transactions found.</p>
                                <p className="text-sm">{isAnyFilterActive ? "Try adjusting your filters." : `No entries for the selected date range.`}</p>
                            </div>
                        ) : (
                            filteredEntries.map(entry => (
                                <div key={entry.id} className="bg-white p-2 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm text-slate-800">{entry.details}</p>
                                            <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                            {entry.partyId && <p className="text-xs text-slate-600">Party: {getPartyName(entry.partyId)}</p>}
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            {entry.cashIn > 0 && <p className="font-bold text-sm text-emerald-600">+ PKR {entry.cashIn.toFixed(2)}</p>}
                                            {entry.cashOut > 0 && <p className="font-bold text-sm text-rose-600">- PKR {entry.cashOut.toFixed(2)}</p>}
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-1 gap-1">
                                        <button onClick={() => handleOpenModal('simple', entry)} className="p-1 text-slate-400 hover:text-teal-600 text-xs rounded-full"><PencilIcon className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 text-slate-400 hover:text-rose-600 text-xs rounded-full"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </main>
                </div>
                <FAB onClick={() => handleOpenModal('simple')} ariaLabel="Add new cash entry" />
                <Modal isOpen={modalType === 'simple'} onClose={handleCloseModal} title={editingEntry ? "Edit Entry" : "Add Cash In/Out Entry"}>
                    <DayBookForm entry={editingEntry} onSave={handleSaveSimpleEntry} onCancel={handleCloseModal} />
                </Modal>
                <Modal isOpen={modalType === 'bill'} onClose={handleCloseModal} title="Create Transaction Bill">
                    <BillForm onSave={handleSaveBill} onCancel={handleCloseModal} />
                </Modal>
                <Footer currentScreen={Screen.DayBook} />
        </div>
    );
};

export default DayBookScreen;