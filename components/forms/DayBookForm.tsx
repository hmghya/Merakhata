import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext.js';
import { DayBookEntry, Party, PartyType } from '../../types.js';
import Modal from '../common/Modal.js';
import PartyForm from './PartyForm.js';

const DayBookForm: React.FC<{
  entry?: DayBookEntry | null;
  onSave: (entry: DayBookEntry) => void;
  onCancel: () => void;
}> = ({ entry, onSave, onCancel }) => {
    const { state, dispatch } = useContext(AppContext);
    const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
    const [details, setDetails] = useState(entry?.details || '');
    const [cashIn, setCashIn] = useState(entry?.cashIn.toString() || '0');
    const [cashOut, setCashOut] = useState(entry?.cashOut.toString() || '0');
    const [partyId, setPartyId] = useState(entry?.partyId || '');
    const [dueDate, setDueDate] = useState(entry?.dueDate || '');

    const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
    const [partyTypeToAdd, setPartyTypeToAdd] = useState<PartyType>('Customer');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: entry?.id || `db-${Date.now().toString()}`, date, details, cashIn: parseFloat(cashIn) || 0, cashOut: parseFloat(cashOut) || 0, partyId: partyId || undefined, dueDate: dueDate || undefined });
    };
    
    const handleOpenPartyModal = (type: PartyType) => {
        setPartyTypeToAdd(type);
        setIsPartyModalOpen(true);
    };

    const handleSaveNewParty = (newParty: Party) => {
        dispatch({ type: 'ADD_PARTY', payload: newParty });
        setPartyId(newParty.id); // Auto-select the newly created party
        setIsPartyModalOpen(false);
    };

    const commonInputClass = "mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500";
    const btnPrimary = "px-4 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500";
    const btnSecondary = "px-4 py-1.5 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500";

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-md">
                <div><label className="block text-sm font-medium text-slate-700">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={commonInputClass} required /></div>
                <div><label className="block text-sm font-medium text-slate-700">Details</label><input type="text" value={details} onChange={e => setDetails(e.target.value)} className={commonInputClass} required placeholder="e.g., Cash received from sale" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700">Cash In</label><input type="number" value={cashIn} onChange={e => setCashIn(e.target.value)} className={commonInputClass} min="0" /></div>
                    <div><label className="block text-sm font-medium text-slate-700">Cash Out</label><input type="number" value={cashOut} onChange={e => setCashOut(e.target.value)} className={commonInputClass} min="0" /></div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Party (Optional)</label>
                    <select value={partyId} onChange={e => setPartyId(e.target.value)} className={`${commonInputClass} bg-white`}>
                        <option value="">Select Party</option>
                        {state.parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                    </select>
                    <div className="mt-2 flex gap-4">
                        <button type="button" onClick={() => handleOpenPartyModal('Customer')} className="text-xs text-teal-600 font-semibold hover:underline">+ Add Customer</button>
                        <button type="button" onClick={() => handleOpenPartyModal('Supplier')} className="text-xs text-teal-600 font-semibold hover:underline">+ Add Supplier</button>
                    </div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700">Due Date (Optional)</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={commonInputClass} /></div>
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button><button type="submit" className={btnPrimary}>Save</button></div>
            </form>
            <Modal isOpen={isPartyModalOpen} onClose={() => setIsPartyModalOpen(false)} title={`Add New ${partyTypeToAdd}`}>
                <PartyForm
                    partyType={partyTypeToAdd}
                    onSave={handleSaveNewParty}
                    onCancel={() => setIsPartyModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default DayBookForm;