import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../../context/AppContext.js';
import { DayBookEntry, Party, PartyType, StockItem, StockTransaction, Screen, StockTransactionType as TxnType } from '../../types.js';
import { TrashIcon, PlusIcon, PrinterIcon } from '../Icons.js';
import Modal from '../common/Modal.js';
import PartyForm from './PartyForm.js';
import ItemForm from './ItemForm.js';

interface LineItem {
    id: string;
    itemId: string;
    batchNumber: string;
    quantity: number;
    price: number;
    total: number;
}

interface BillFormProps {
    onSave: () => void;
    onCancel: () => void;
    fixedPartyId?: string;
    defaultTransactionType?: TxnType;
}

// Sub-component for item selection
const ItemSelectionModal: React.FC<{
    stockItems: StockItem[];
    onClose: () => void;
    onAddItems: (itemIds: string[]) => void;
}> = ({ stockItems, onClose, onAddItems }) => {
    const { dispatch } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

    const filteredItems = useMemo(() => {
        return stockItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [stockItems, searchTerm]);

    const toggleSelection = (itemId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };
    
    const handleSaveNewItem = (newItem: StockItem) => {
        dispatch({ type: 'ADD_STOCK_ITEM', payload: newItem });
        setIsNewItemModalOpen(false);
        // Optionally, auto-select the new item
        toggleSelection(newItem.id);
    };

    const handleAddSelected = () => {
        onAddItems(Array.from(selectedIds));
        onClose();
    };

    return (
        <>
            <div className="flex flex-col h-[70vh]">
                <div className="p-2 border-b">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {filteredItems.map(item => (
                        <label key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>{item.name}</span>
                        </label>
                    ))}
                </div>
                <div className="p-2 border-t space-y-2">
                    <button type="button" onClick={() => setIsNewItemModalOpen(true)} className="w-full py-2 text-sm text-teal-600 font-semibold border-2 border-dashed border-teal-300 rounded-md hover:bg-teal-50">
                        + Add New Item
                    </button>
                    <button type="button" onClick={handleAddSelected} className="w-full py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700">
                        Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Selected Items
                    </button>
                </div>
            </div>
            <Modal isOpen={isNewItemModalOpen} onClose={() => setIsNewItemModalOpen(false)} title="Add New Item">
                <ItemForm onSave={handleSaveNewItem} onCancel={() => setIsNewItemModalOpen(false)} />
            </Modal>
        </>
    );
};


const BillForm: React.FC<BillFormProps> = ({ onSave, onCancel, fixedPartyId, defaultTransactionType }) => {
    const { state, dispatch } = useContext(AppContext);
    const { parties, stockItems } = state;

    const [partyId, setPartyId] = useState(fixedPartyId || '');
    const [transactionType, setTransactionType] = useState<PartyType | ''>('');
    const [billNumber, setBillNumber] = useState(`INV-${Date.now()}`);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState<string | undefined>();
    const [cashReceived, setCashReceived] = useState('');
    const [cashPaid, setCashPaid] = useState('');
    
    const [isNewPartyModalOpen, setIsNewPartyModalOpen] = useState(false);
    const [isItemSelectionOpen, setIsItemSelectionOpen] = useState(false);
    const [printAfterSave, setPrintAfterSave] = useState(false);

    useEffect(() => {
        let partyType: PartyType | '' = '';
        if (defaultTransactionType) {
            partyType = defaultTransactionType === 'Sell' ? 'Customer' : 'Supplier';
        } else {
            const party = parties.find(p => p.id === partyId);
            partyType = party ? party.type : '';
        }
        setTransactionType(partyType);

        // Only reset items if the party is not fixed and changes
        if (!fixedPartyId) {
            setLineItems([]);
        }
    }, [partyId, parties, defaultTransactionType, fixedPartyId]);

    const handleAddItems = (itemIds: string[]) => {
        const type = defaultTransactionType || (transactionType === 'Customer' ? 'Sell' : 'Buy');
        const newItems = itemIds.map(id => {
            const stockItem = stockItems.find(si => si.id === id);
            if (!stockItem) return null;
            const price = type === 'Sell' ? stockItem.salesPrice : stockItem.purchasePrice;
            return {
                id: `${Date.now()}-${id}`,
                itemId: id,
                batchNumber: '',
                quantity: 1,
                price: price,
                total: price,
            };
        }).filter((item): item is LineItem => item !== null);
        setLineItems(prev => [...prev, ...newItems]);
    };

    const handleRemoveLineItem = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };

    const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                 if (field === 'itemId') {
                    const stockItem = stockItems.find(si => si.id === value);
                    if (stockItem) {
                        const type = defaultTransactionType || (transactionType === 'Customer' ? 'Sell' : 'Buy');
                        updatedItem.price = type === 'Sell' ? stockItem.salesPrice : stockItem.purchasePrice;
                        updatedItem.batchNumber = '';
                    }
                }
                updatedItem.total = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.price) || 0);
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => setAttachment(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSaveNewParty = (newParty: Party) => {
        dispatch({ type: 'ADD_PARTY', payload: newParty });
        setPartyId(newParty.id);
        setIsNewPartyModalOpen(false);
    };

    const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!partyId || !billNumber) {
            alert("Please select a party and enter a bill number.");
            return;
        }
        
        const cashReceivedAmount = parseFloat(cashReceived) || 0;
        const cashPaidAmount = parseFloat(cashPaid) || 0;

        if (lineItems.length === 0 && cashReceivedAmount <= 0 && cashPaidAmount <= 0) {
            alert("Please add at least one item or enter a cash amount to save.");
            return;
        }

        if (lineItems.length > 0 && lineItems.some(li => !li.itemId || li.quantity <= 0)) {
            alert("Please ensure all added items have a valid quantity.");
            return;
        }
        
        const type: TxnType = defaultTransactionType || (transactionType === 'Customer' ? 'Sell' : 'Buy');

        if (type === 'Sell' && lineItems.length > 0) {
            const batchQuantities: Record<string, { required: number, name: string }> = {}; // key: `itemId-batchNumber`

            for (const lineItem of lineItems) {
                const stockItem = stockItems.find(si => si.id === lineItem.itemId);
                if (!lineItem.batchNumber) {
                    alert(`Please select a batch for ${stockItem?.name || 'an item'}.`);
                    return;
                }
                const key = `${lineItem.itemId}-${lineItem.batchNumber}`;
                if (!batchQuantities[key]) {
                    batchQuantities[key] = { required: 0, name: stockItem?.name || 'item' };
                }
                batchQuantities[key].required += lineItem.quantity;
            }

            for (const key in batchQuantities) {
                const [itemId, batchNumber] = key.split('-');
                const { required, name } = batchQuantities[key];
                const stockItem = stockItems.find(si => si.id === itemId);
                const batch = stockItem?.batches.find(b => b.batchNumber === batchNumber);

                if (!batch || batch.quantity < required) {
                    alert(`Not enough stock for ${name} in batch ${batchNumber}. Required: ${required}, Available: ${batch?.quantity || 0}`);
                    return;
                }
            }
        }
        
        // Data Preparation
        const stockTransactions: StockTransaction[] = [];
        const dayBookEntries: DayBookEntry[] = [];
        
        // Create Stock Transactions if items exist
        if (lineItems.length > 0) {
            lineItems.forEach(li => {
                stockTransactions.push({
                    id: `txn-${li.id}`,
                    itemId: li.itemId,
                    type,
                    quantity: Number(li.quantity),
                    price: Number(li.price),
                    totalAmount: li.total,
                    details: `Part of bill #${billNumber}`,
                    date,
                    billNumber,
                    partyId,
                    attachment,
                    batchNumber: type === 'Buy' ? (li.batchNumber.trim() || 'default') : li.batchNumber,
                    expiryDate: type === 'Buy' ? undefined : stockItems.find(si => si.id === li.itemId)?.batches.find(b => b.batchNumber === li.batchNumber)?.expiryDate
                });
            });
        }

        // Create DayBook Entry for Items Total if items exist
        if (grandTotal > 0) {
            dayBookEntries.push({
                id: `db-bill-${Date.now()}`,
                date,
                details: details || `Bill #${billNumber}`,
                cashIn: type === 'Sell' ? grandTotal : 0,
                cashOut: type === 'Buy' ? grandTotal : 0,
                partyId,
            });
        }
        
        const netCash = cashReceivedAmount - cashPaidAmount;
        
        // Create DayBook Entry for Cash Adjustment if it exists
        if (netCash !== 0) {
            const cashDetails = grandTotal > 0 
                ? `Payment for Bill #${billNumber}`
                : details || `Cash Transaction`;

            dayBookEntries.push({
                id: `db-cash-${Date.now()}`,
                date,
                details: cashDetails,
                cashIn: netCash > 0 ? netCash : 0,
                cashOut: netCash < 0 ? -netCash : 0,
                partyId,
            });
        }
        
        // Dispatch
        dispatch({ type: 'SAVE_ITEM_BILL', payload: { stockTransactions, dayBookEntries } });
        
        if (printAfterSave && lineItems.length > 0) {
            dispatch({
                type: 'NAVIGATE',
                payload: {
                    screen: Screen.InvoiceDetail,
                    payload: { billNumber, autoPrint: true }
                }
            });
        } else {
            onSave();
        }
    };
    
    const getAvailableBatches = (itemId: string): StockItem['batches'] => {
        return stockItems.find(si => si.id === itemId)?.batches || [];
    };

    const effectiveTransactionType = defaultTransactionType || (transactionType === 'Customer' ? 'Sell' : 'Buy');
    
    const cashReceivedAmount = parseFloat(cashReceived) || 0;
    const cashPaidAmount = parseFloat(cashPaid) || 0;
    const netAmount = (effectiveTransactionType === 'Sell' ? grandTotal : -grandTotal) - cashReceivedAmount + cashPaidAmount;


    const commonInputClass = "block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500";
    const btnPrimary = "px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500";
    const btnSecondary = "px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500";

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Party</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <select value={partyId} onChange={e => setPartyId(e.target.value)} disabled={!!fixedPartyId} className={`${commonInputClass} flex-grow rounded-none rounded-l-md bg-white disabled:bg-slate-200`} required>
                                <option value="">Select a party...</option>
                                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsNewPartyModalOpen(true)} disabled={!!fixedPartyId} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:bg-slate-200 disabled:cursor-not-allowed"><PlusIcon className="h-5 w-5"/></button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Type</label>
                        <input type="text" value={transactionType ? (transactionType === 'Customer' ? 'Sale / Invoice' : 'Purchase / Bill') : 'Select a party first'} readOnly className={`mt-1 ${commonInputClass} bg-slate-100`} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Bill Number</label>
                        <input type="text" value={billNumber} onChange={e => setBillNumber(e.target.value)} className={`mt-1 ${commonInputClass}`} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`mt-1 ${commonInputClass}`} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-semibold text-slate-700">Items</h3>
                        <button type="button" onClick={() => setIsItemSelectionOpen(true)} disabled={!partyId} className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 disabled:bg-slate-200 disabled:cursor-not-allowed">
                            <PlusIcon className="h-4 w-4 inline-block mr-1" /> Add Item
                        </button>
                    </div>
                    <div className="space-y-2">
                        {lineItems.map((item, index) => {
                            const stockItem = stockItems.find(si => si.id === item.itemId);
                            const availableBatches = stockItem ? getAvailableBatches(item.itemId) : [];
                            return (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-2 bg-slate-50 rounded-md">
                                    <div className="col-span-12 md:col-span-4">
                                        <label className="text-xs font-medium text-slate-500">Item</label>
                                        <p className="font-semibold text-slate-800">{stockItem?.name || 'Select an item'}</p>
                                    </div>

                                    {effectiveTransactionType === 'Sell' ? (
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="text-xs font-medium text-slate-500">Batch</label>
                                            <select value={item.batchNumber} onChange={(e) => handleLineItemChange(item.id, 'batchNumber', e.target.value)} className={`${commonInputClass} py-1 text-xs bg-white`} required>
                                                <option value="">Select</option>
                                                {availableBatches.map(b => <option key={b.batchNumber} value={b.batchNumber}>{b.batchNumber} (Qty: {b.quantity})</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="text-xs font-medium text-slate-500">Batch No.</label>
                                            <input type="text" value={item.batchNumber} onChange={(e) => handleLineItemChange(item.id, 'batchNumber', e.target.value)} className={`${commonInputClass} py-1 text-xs`} placeholder="Optional" />
                                        </div>
                                    )}

                                    <div className="col-span-6 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500">Quantity</label>
                                        <input type="number" value={item.quantity} onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)} className={`${commonInputClass} py-1 text-xs`} min="0.01" step="0.01" required />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500">Price</label>
                                        <input type="number" value={item.price} onChange={(e) => handleLineItemChange(item.id, 'price', e.target.value)} className={`${commonInputClass} py-1 text-xs`} min="0" step="0.01" required />
                                    </div>
                                    <div className="col-span-10 md:col-span-1 flex items-end">
                                        <p className="font-semibold text-slate-800 text-sm py-1 w-full text-right"> {item.total.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex items-end">
                                        <button type="button" onClick={() => handleRemoveLineItem(item.id)} className="p-2 text-rose-500 hover:text-rose-700"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-end mb-4">
                         <div className="w-full max-w-sm space-y-1 text-right text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Items Total:</span>
                                <span className="font-medium text-slate-700">PKR {grandTotal.toFixed(2)}</span>
                            </div>
                            {cashReceivedAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cash Received:</span>
                                    <span className="font-medium text-emerald-600">- PKR {cashReceivedAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {cashPaidAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cash Paid:</span>
                                    <span className="font-medium text-rose-600">+ PKR {cashPaidAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-1 border-t">
                                <span className="font-bold text-slate-800">Net Amount:</span>
                                <span className={`text-xl font-bold ${netAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    PKR {Math.abs(netAmount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Cash Received</label>
                            <input 
                                type="number" 
                                value={cashReceived} 
                                onChange={e => setCashReceived(e.target.value)} 
                                className={`${commonInputClass} bg-white`} 
                                placeholder="e.g., 5000"
                                min="0" 
                                step="0.01" 
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Cash Paid</label>
                            <input 
                                type="number" 
                                value={cashPaid} 
                                onChange={e => setCashPaid(e.target.value)} 
                                className={`${commonInputClass} bg-white`} 
                                placeholder="e.g., 1000"
                                min="0" 
                                step="0.01" 
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700">Details / Notes</label>
                        <input type="text" value={details} onChange={e => setDetails(e.target.value)} className={`${commonInputClass} bg-white`} placeholder="Optional notes about the transaction" />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700">Attachment</label>
                        <input type="file" onChange={handleAttachmentChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
                    </div>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={printAfterSave}
                            onChange={(e) => setPrintAfterSave(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-700 flex items-center gap-1"><PrinterIcon className="h-4 w-4" /> Print after saving</span>
                    </label>
                    <div className="flex gap-2">
                        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
                        <button type="submit" className={btnPrimary}>Save</button>
                    </div>
                </div>
            </form>

            <Modal isOpen={isNewPartyModalOpen} onClose={() => setIsNewPartyModalOpen(false)} title="Add New Party">
                <PartyForm
                    partyType={transactionType || undefined}
                    onSave={handleSaveNewParty}
                    onCancel={() => setIsNewPartyModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isItemSelectionOpen} onClose={() => setIsItemSelectionOpen(false)} title="Select Items">
                <ItemSelectionModal
                    stockItems={stockItems}
                    onClose={() => setIsItemSelectionOpen(false)}
                    onAddItems={handleAddItems}
                />
            </Modal>

        </>
    );
};

export default BillForm;