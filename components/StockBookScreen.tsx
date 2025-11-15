import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen, StockItem } from '../types.js';
import Header from './common/Header.js';
import Footer from './common/Footer.js';
import FAB from './common/FAB.js';
import { ChartBarIcon, DocumentChartBarIcon, ArchiveIcon, ExclamationTriangleIcon } from './Icons.js';

const StockBookScreen: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { stockItems } = state;
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  const navigateTo = (screen: Screen, payload?: any) => {
    dispatch({ type: 'NAVIGATE', payload: { screen, payload } });
  };
  
  const getItemTotalQuantity = (item: StockItem): number => item.batches.reduce((sum, batch) => sum + batch.quantity, 0);

  const stockValue = useMemo(() => {
    return stockItems.reduce((total, item) => total + item.purchasePrice * getItemTotalQuantity(item), 0);
  }, [stockItems]);

  const lowStockCount = useMemo(() => {
    return stockItems.filter(item => getItemTotalQuantity(item) <= item.lowStockLimit).length;
  }, [stockItems]);
  
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
  
  const SummaryCard: React.FC<{title: string; value: string; icon: React.FC<{className?: string;}>; color: string}> = ({title, value, icon: Icon, color}) => (
      <div className="bg-white p-3 rounded-lg shadow-sm flex-1">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${color}`}>
                  <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                  <p className="text-xs text-slate-500">{title}</p>
                  <p className="font-bold text-sm text-slate-800">{value}</p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <Header title="Stock Book" backScreen={Screen.Home} />
      <div id="stockbook-content" className="flex-grow flex flex-col">
          {/* Summary Section */}
          <div className="p-3 bg-slate-100 space-y-3">
              <div className="flex gap-3">
                  <SummaryCard title="Stock Value" value={`PKR ${stockValue.toFixed(2)}`} icon={ChartBarIcon} color="bg-sky-500" />
                  <SummaryCard title="Low Stock Items" value={`${lowStockCount}`} icon={ExclamationTriangleIcon} color="bg-rose-500" />
              </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => navigateTo(Screen.StockInReport)} className="p-2 bg-white text-slate-700 font-semibold rounded-md hover:bg-slate-50 text-xs shadow-sm flex items-center justify-center gap-2">
                      <DocumentChartBarIcon className="h-4 w-4" /> Stock In Report
                  </button>
                  <button onClick={() => navigateTo(Screen.StockOutReport)} className="p-2 bg-white text-slate-700 font-semibold rounded-md hover:bg-slate-50 text-xs shadow-sm flex items-center justify-center gap-2">
                      <DocumentChartBarIcon className="h-4 w-4" /> Stock Out Report
                  </button>
              </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-2 bg-white border-b border-slate-200">
              <div className="flex justify-center rounded-md shadow-sm" role="group">
                  <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white text-slate-700'} border border-slate-200 rounded-l-lg hover:bg-slate-200 focus:z-10 focus:ring-2 focus:ring-teal-500 transition-colors duration-150`}
                  >
                      All Items ({stockItems.length})
                  </button>
                  <button
                      type="button"
                      onClick={() => setFilter('low')}
                      className={`px-4 py-2 text-sm font-medium ${filter === 'low' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white text-slate-700'} border border-slate-200 rounded-r-md hover:bg-slate-200 focus:z-10 focus:ring-2 focus:ring-teal-500 transition-colors duration-150`}
                  >
                      Low Stock ({lowStockCount})
                  </button>
              </div>
          </div>
          
          {/* Item List */}
          <main className="flex-grow p-4 overflow-y-auto pb-44">
              {filteredItems.length === 0 ? (
                <div className="text-center text-slate-500 p-10">
                  <ArchiveIcon className="h-16 w-16 mx-auto text-slate-400" />
                  <p className="mt-2 font-semibold">No items to display.</p>
                  {filter === 'low' && <p className="text-sm">You have no items marked as low stock.</p>}
                </div>
              ) : (
                <div className="space-y-2">
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
              )}
          </main>
      </div>
      <FAB onClick={() => navigateTo(Screen.AddItem)} ariaLabel="Add new stock item" />
      <Footer currentScreen={Screen.StockBook} />
    </div>
  );
};

export default StockBookScreen;