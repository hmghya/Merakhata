import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Added .js extension to imports
import { Screen, StockItem } from '../types.js';
import Header from './common/Header.js';
import { ArchiveIcon } from './Icons.js';

interface ItemListScreenProps {
  filter: 'all' | 'low';
}

const ItemListScreen: React.FC<ItemListScreenProps> = ({ filter }) => {
  const { state, dispatch } = useContext(AppContext);
  const { stockItems } = state;

  const title = filter === 'all' ? 'All Items' : 'Low Stock Items';

  const getItemTotalQuantity = (item: StockItem): number => item.batches.reduce((sum, batch) => sum + batch.quantity, 0);

  const filteredItems = useMemo(() => {
    const sorted = [...stockItems].sort((a,b) => a.name.localeCompare(b.name));
    if (filter === 'low') {
      return sorted.filter(item => getItemTotalQuantity(item) <= item.lowStockLimit);
    }
    return sorted;
  }, [stockItems, filter]);
  
  const handleItemClick = (item: StockItem) => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.ItemDetail, payload: { itemId: item.id } } });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={title} backScreen={Screen.StockBook} />
      <main id="item-list-content" className="flex-grow p-4 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center text-slate-500 p-10">
            <ArchiveIcon className="h-16 w-16 mx-auto text-slate-400" />
            <p className="mt-2">No items to display.</p>
          </div>
        ) : (
          <div className="p-0.5 bg-gradient-to-br from-orange-400 to-indigo-500 rounded-lg">
            <div className="bg-slate-50 p-2 rounded-md space-y-2">
                {filteredItems.map(item => {
                    const totalQuantity = getItemTotalQuantity(item);
                    return (
                    <div key={item.id} onClick={() => handleItemClick(item)} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                        {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md bg-slate-200" />
                        ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                            <ArchiveIcon className="h-8 w-8" />
                        </div>
                        )}
                        <div className="flex-grow">
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-sm text-slate-500">
                            Qty: <span className={`font-semibold ${totalQuantity <= item.lowStockLimit ? 'text-rose-500' : 'text-emerald-600'}`}>{totalQuantity}</span> {item.unit}
                        </p>
                        <p className="text-sm text-slate-500">Price: PKR {item.salesPrice.toFixed(2)}</p>
                        </div>
                    </div>
                    )
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ItemListScreen;