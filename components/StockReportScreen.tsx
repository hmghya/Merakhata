import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext.js';
import { Screen, StockTransactionType } from '../types.js';
import Header from './common/Header.js';
import { DocumentChartBarIcon } from './Icons.js';

interface StockReportScreenProps {
  reportType: StockTransactionType;
}

const StockReportScreen: React.FC<StockReportScreenProps> = ({ reportType }) => {
  const { state } = useContext(AppContext);
  const { stockTransactions, stockItems, parties } = state;

  const title = reportType === 'Buy' ? 'Stock In Report' : 'Stock Out Report';

  const reportData = useMemo(() => {
    return stockTransactions
      .filter(t => t.type === reportType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockTransactions, reportType]);

  const getItemName = (itemId: string) => stockItems.find(i => i.id === itemId)?.name || 'Unknown Item';
  const getPartyName = (partyId?: string) => parties.find(p => p.id === partyId)?.name || 'N/A';
  const totalAmount = useMemo(() => reportData.reduce((sum, t) => sum + t.totalAmount, 0), [reportData]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={title} backScreen={Screen.Reports} />
      <main className="flex-grow overflow-y-auto p-4 space-y-3 pb-20">
        {reportData.length === 0 ? (
          <div className="text-center text-slate-500 p-10">
            <DocumentChartBarIcon className="h-16 w-16 mx-auto text-slate-400" />
            <p className="mt-2 font-semibold">No transactions to report.</p>
            <p className="text-sm">There are no '{reportType}' transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reportData.map(t => (
              <div key={t.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800">{getItemName(t.itemId)}</p>
                    <p className="text-sm text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                    {t.partyId && <p className="text-xs text-slate-600">Party: {getPartyName(t.partyId)}</p>}
                    {t.billNumber && <p className="text-xs text-slate-600">Bill: #{t.billNumber}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">PKR {t.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{t.quantity} @ PKR {t.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
        <div className="flex justify-between items-center font-bold text-lg text-slate-800">
          <span>Total Amount</span>
          <span>PKR {totalAmount.toFixed(2)}</span>
        </div>
      </footer>
    </div>
  );
};

export default StockReportScreen;