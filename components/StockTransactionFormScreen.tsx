import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext.js';
// Fix: Added .js extension to import.
import { Party, Screen, StockTransaction, StockTransactionType, StockItem } from '../../types.js';
import Header from './common/Header.js';
import Modal from './common/Modal.js';
import PartyForm from './forms/PartyForm.js';
import { PlusIcon } from './Icons.js';

interface StockTransactionFormScreenProps {
  itemId: string;
  transactionType: StockTransactionType;
  transactionId?: string; // For editing
}

const StockTransactionFormScreen: React.FC<StockTransactionFormScreenProps> = ({ itemId, transactionType, transactionId }) => {
  const { state, dispatch } = useContext(AppContext);
  const { stockItems, parties, stockTransactions } = state;
  const item = stockItems.find(i => i.id === itemId);
  const isEditing = !!transactionId;

  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNumber, setBillNumber] = useState('');
  const [partyId, setPartyId] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>();
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isNewPartyModalOpen, setIsNewPartyModalOpen] = useState(false);
  
  useEffect(() => {
    if (isEditing) {
        const transaction = stockTransactions.find(t => t.id === transactionId);
        if (transaction) {
            setQuantity(String(transaction.quantity));
            setPrice(String(transaction.price));
            setDetails(transaction.details);
            setDate(transaction.date);
            setBillNumber(transaction.billNumber);
            setPartyId(transaction.partyId || '');
            setAttachment(transaction.attachment);
            setBatchNumber(transaction.batchNumber);
            setExpiryDate(transaction.expiryDate || '');
        }
    } else if (item) {
        setPrice(transactionType === 'Buy' ? String(item.purchasePrice) : String(item.salesPrice));
    }
  }, [isEditing, transactionId, stockTransactions, item, transactionType]);
  
  if (!item) return <p>Item not found</p>;

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);
  const title = isEditing ? `Edit ${transactionType} Transaction` : `${transactionType} Item`;
  
  const handleBack = () => dispatch({ type: 'NAVIGATE', payload: { screen: Screen.ItemDetail, payload: { itemId } } });

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setAttachment(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveNewParty = (newParty: Party) => {
    dispatch({ type: 'ADD_PARTY', payload: newParty });
    setPartyId(newParty.id); // Auto-select the newly created party
    setIsNewPartyModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (!quantity || !price || qtyNum <= 0) {
        alert("Please enter a valid quantity and price.");
        return;
    }
    
    let batchToProcess = batchNumber;

    if (transactionType === 'Sell') {
        if (!batchToProcess) { // If user did not select a batch
            // If there's only one batch, use it automatically
            if (item.batches.length === 1 && item.batches[0].quantity >= qtyNum) {
                 batchToProcess = item.batches[0].batchNumber;
            } else {
                // Otherwise, try to find a suitable batch, prioritizing 'default'
                const defaultBatch = item.batches.find(b => b.batchNumber === 'default' && b.quantity >= qtyNum);
                if (defaultBatch) {
                    batchToProcess = defaultBatch.batchNumber;
                } else {
                    const firstSufficientBatch = item.batches.find(b => b.quantity >= qtyNum);
                    if (firstSufficientBatch) {
                        batchToProcess = firstSufficientBatch.batchNumber;
                    } else {
                        // Handle insufficient stock
                        const totalQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
                        if (qtyNum > totalQuantity) {
                            alert(`Not enough stock. Total available: ${totalQuantity}. Required: ${qtyNum}.`);
                        } else {
                            alert(`No single batch has enough quantity (${qtyNum}). Please select a batch or split the sale.`);
                        }
                        return;
                    }
                }
            }
        }
        
        const selectedBatch = item.batches.find(b => b.batchNumber === batchToProcess);
        
        // START FIX: Improved validation for editing transactions
        let availableQuantity = selectedBatch ? selectedBatch.quantity : 0;
        if (isEditing) {
            const originalTransaction = stockTransactions.find(t => t.id === transactionId);
            // If the transaction is on the same batch, we add back its original quantity for the check,
            // because the reducer will revert it before applying the new transaction.
            if (originalTransaction && originalTransaction.batchNumber === batchToProcess) {
                availableQuantity += originalTransaction.quantity;
            }
        }

        if (qtyNum > availableQuantity) {
            alert(`Not enough stock in batch '${batchToProcess}'. Required: ${qtyNum}, Available for this transaction: ${availableQuantity}.`);
            return;
        }
        // END FIX
    }


    const transactionData: StockTransaction = {
      id: transactionId || `st-${Date.now().toString()}`,
      itemId: item.id,
      type: transactionType,
      quantity: qtyNum,
      price: parseFloat(price),
      totalAmount,
      details,
      date,
      billNumber,
      partyId: partyId || undefined,
      attachment,
      batchNumber: transactionType === 'Buy' ? (batchNumber.trim() || 'default') : batchToProcess,
      expiryDate: expiryDate || undefined,
    };

    if (isEditing) {
        dispatch({ type: 'EDIT_STOCK_TRANSACTION', payload: transactionData });
    } else {
        dispatch({ type: 'ADD_STOCK_TRANSACTION', payload: transactionData });
    }
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.ItemDetail, payload: { itemId: item.id } } });
  };
  
  const getItemTotalQuantity = (item: StockItem): number => item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const buttonColor = transactionType === 'Buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={title} onBack={handleBack} />
      <main id="stock-transaction-form-content" className="flex-grow p-4 overflow-y-auto">
        <div className="bg-white p-4 rounded-md shadow-sm border">
            <div className="mb-4 bg-slate-50 p-3 rounded-lg border">
                <h3 className="font-bold text-base text-slate-800">{item.name}</h3>
                <p className="text-sm text-slate-500">Current Stock: {getItemTotalQuantity(item)} {item.unit}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700">Quantity</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700">Price per {item.unit}</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required step="0.01"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Total Amount</label>
                <input type="text" value={`PKR ${totalAmount.toFixed(2)}`} readOnly className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-100" />
            </div>

            {transactionType === 'Buy' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Batch Number</label>
                        <input type="text" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Expiry Date</label>
                        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                    </div>
                </div>
            ) : ( // Sell transaction
                <div>
                    <label className="block text-sm font-medium text-slate-700">Select Batch (Optional)</label>
                    <select value={batchNumber} onChange={e => setBatchNumber(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md bg-white">
                        <option value="">Auto-select from available stock</option>
                        {item.batches.map(batch => (
                            <option key={batch.batchNumber} value={batch.batchNumber}>
                                {batch.batchNumber} (Qty: {batch.quantity}, Exp: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700">Details</label>
                <input type="text" value={details} onChange={e => setDetails(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700">Bill Number</label>
                <input type="text" value={billNumber} onChange={e => setBillNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Add Party (Optional)</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <select value={partyId} onChange={e => setPartyId(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-none rounded-l-md bg-white">
                        <option value="">Select Party</option>
                        {parties.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setIsNewPartyModalOpen(true)} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200">
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700">Attachment</label>
                <div className="mt-1">
                {attachment ? (
                    <div className="flex items-center gap-4 p-2 border border-slate-300 rounded-md bg-white">
                    <div className="flex-shrink-0">
                        {attachment.startsWith('data:image/') ? (
                        <img src={attachment} alt="Attachment preview" className="h-16 w-16 rounded-md object-cover" />
                        ) : (
                        <div className="h-16 w-16 rounded-md bg-slate-200 flex flex-col items-center justify-center text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="text-xs text-slate-500">File</span>
                        </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm text-slate-600 truncate">
                        {attachment.startsWith('data:image/') ? 'Image attached' : 'File attached'}
                        </p>
                        <div className="flex gap-2 mt-1">
                        <label htmlFor="attachment-input" className="cursor-pointer text-sm font-medium text-teal-600 hover:text-teal-500">
                            Change
                        </label>
                        <input type="file" id="attachment-input" onChange={handleAttachmentChange} className="hidden" />
                        <button
                            type="button"
                            onClick={() => setAttachment(undefined)}
                            className="text-sm font-medium text-rose-600 hover:text-rose-500"
                        >
                            Remove
                        </button>
                        </div>
                    </div>
                    </div>
                ) : (
                    <label htmlFor="attachment-input" className="w-full cursor-pointer relative block px-4 py-6 border-2 border-slate-300 border-dashed rounded-md text-center hover:border-teal-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="mt-2 block text-sm font-medium text-slate-600">
                        Add Photo or PDF
                    </span>
                    <input type="file" id="attachment-input" onChange={handleAttachmentChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </label>
                )}
                </div>
            </div>

            <button type="submit" className={`w-full py-3 px-4 text-white rounded-md font-semibold ${buttonColor}`}>Save Transaction</button>
            </form>
        </div>
        <Modal isOpen={isNewPartyModalOpen} onClose={() => setIsNewPartyModalOpen(false)} title={`Add New ${transactionType === 'Buy' ? 'Supplier' : 'Customer'}`}>
            <PartyForm
                partyType={transactionType === 'Buy' ? 'Supplier' : 'Customer'}
                onSave={handleSaveNewParty}
                onCancel={() => setIsNewPartyModalOpen(false)}
            />
        </Modal>
      </main>
    </div>
  );
};

export default StockTransactionFormScreen;