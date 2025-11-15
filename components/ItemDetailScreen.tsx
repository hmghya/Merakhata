import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
// Fix: Added .js extension to imports
import { Screen, StockTransaction, StockItem } from '../types.js';
import Header from './common/Header';
import { PencilIcon, TrashIcon, ArchiveIcon } from './Icons.js';

interface ItemDetailScreenProps {
  itemId: string;
}

const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({ itemId }) => {
  const { state, dispatch } = useContext(AppContext);
  const { stockItems, stockTransactions, parties } = state;

  const item = stockItems.find(i => i.id === itemId);
  const transactions = stockTransactions.filter(t => t.itemId === itemId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Error" backScreen={Screen.StockBook} />
        <p className="p-4 text-center text-slate-500">Item not found.</p>
      </div>
    );
  }

  const getItemTotalQuantity = (item: StockItem): number => item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalQuantity = getItemTotalQuantity(item);
  
  const handleNavigate = (screen: Screen, payload?: any) => {
    dispatch({ type: 'NAVIGATE', payload: { screen, payload } });
  }

  const handleDeleteItem = () => {
    dispatch({ type: 'DELETE_STOCK_ITEM', payload: item.id });
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.StockBook } });
  }

  const handleDeleteTransaction = (transactionId: string) => {
    dispatch({ type: 'DELETE_STOCK_TRANSACTION', payload: transactionId });
  }

  const getPartyName = (partyId?: string) => parties.find(p => p.id === partyId)?.name || 'N/A';

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <Header title="Item Details" backScreen={Screen.AllItems} />
      <main id="item-detail-content" className="flex-grow overflow-y-auto p-4 space-y-4">
        <section className="p-4 bg-sky-50 shadow-sm rounded-lg">
          <div className="flex gap-4">
             {item.image ? (
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-200" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                   <ArchiveIcon className="h-10 w-10" />
                </div>
              )}
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-slate-800">{item.name}</h2>
              <p className="text-slate-500">{item.category}</p>
              <div className={`mt-2 text-base font-bold ${totalQuantity <= item.lowStockLimit ? 'text-rose-500' : 'text-emerald-600'}`}>
                {totalQuantity} {item.unit} in stock
              </div>
            </div>
            <div className="flex flex-col gap-1">
                <button onClick={() => handleNavigate(Screen.EditItem, { itemId: item.id })} className="p-2 text-slate-500 hover:text-teal-600 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                <button onClick={handleDeleteItem} className="p-2 text-slate-500 hover:text-rose-600 rounded-full"><TrashIcon className="h-5 w-5"/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm border-t border-slate-200 pt-3">
            <div><span className="font-semibold text-slate-600">Sale Price:</span> PKR {item.salesPrice.toFixed(2)}</div>
            <div><span className="font-semibold text-slate-600">Purchase Price:</span> PKR {item.purchasePrice.toFixed(2)}</div>
            <div><span className="font-semibold text-slate-600">Code (Barcode/QR):</span> {item.barcode || 'N/A'}</div>
            <div><span className="font-semibold text-slate-600">Low Stock:</span> {item.lowStockLimit} {item.unit}</div>
          </div>
        </section>
        
        <section className="p-4 bg-indigo-50 shadow-sm rounded-lg">
            <h3 className="text-base font-semibold mb-2 text-slate-700">Batch Details</h3>
            {item.batches.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Batch No.</th>
                                <th className="px-4 py-2 text-right font-medium text-slate-600">Quantity</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-600">Expiry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {item.batches.map(batch => {
                                const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                let expiryClass = 'text-slate-700';
                                if (expiryDate) {
                                    if (expiryDate < today) {
                                        expiryClass = 'text-rose-600 font-bold';
                                    } else if ((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 30) {
                                        expiryClass = 'text-amber-600 font-semibold';
                                    }
                                }

                                return (
                                    <tr key={batch.batchNumber}>
                                        <td className="px-4 py-2 whitespace-nowrap">{batch.batchNumber}</td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap">{batch.quantity} {item.unit}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap ${expiryClass}`}>
                                            {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-slate-500 text-center p-4 bg-white rounded-lg shadow-sm">No batch information available.</p>
            )}
        </section>

        <section className="p-4 grid grid-cols-2 gap-4 bg-emerald-50 rounded-lg shadow-sm">
            <button onClick={() => handleNavigate(Screen.StockTransaction, { transactionType: 'Buy', itemId: item.id })} className="w-full py-3 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-semibold">Buy Item</button>
            <button onClick={() => handleNavigate(Screen.StockTransaction, { transactionType: 'Sell', itemId: item.id })} className="w-full py-3 px-4 bg-rose-600 text-white rounded-md hover:bg-rose-700 font-semibold">Sell Item</button>
        </section>

        <section className="p-4 bg-yellow-50 rounded-lg shadow-sm">
            <h3 className="text-base font-semibold mb-2 text-slate-700">Transaction History</h3>
            <div className="space-y-2">
                {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`font-bold ${t.type === 'Buy' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {t.type} ({t.quantity} {item.unit})
                                </p>
                                <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                                {t.partyId && <p className="text-xs text-slate-600">Party: {getPartyName(t.partyId)}</p>}
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-800">PKR {t.totalAmount.toFixed(2)}</p>
                                <p className="text-xs text-slate-500">@ PKR {t.price.toFixed(2)}</p>
                            </div>
                        </div>
                        {(t.details || t.attachment) && (
                            <div className="mt-1 border-t border-slate-100 pt-1">
                                {t.details && <p className="text-sm text-slate-600">{t.details}</p>}
                                {t.attachment && (
                                    <a href={t.attachment} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-xs font-semibold flex items-center gap-1 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        View Attachment
                                    </a>
                                )}
                            </div>
                        )}
                         <div className="flex justify-end mt-1 gap-1">
                             <button onClick={() => handleNavigate(Screen.StockTransaction, { transactionType: t.type, itemId: item.id, transactionId: t.id })} className="p-1 text-slate-400 hover:text-teal-600 text-xs rounded-full"><PencilIcon className="h-4 w-4" /></button>
                             <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-rose-600 text-xs rounded-full"><TrashIcon className="h-4 w-4" /></button>
                         </div>
                    </div>
                )) : <p className="text-slate-500 text-center p-4">No transactions recorded.</p>}
            </div>
        </section>
      </main>
    </div>
  );
};

export default ItemDetailScreen;