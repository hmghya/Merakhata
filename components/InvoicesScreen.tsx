import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Added .js extension to imports
import { Screen, StockTransaction, Party, StockTransactionType } from '../types.js';
import Header from './common/Header.js';
import Footer from './common/Footer.js';
import FAB from './common/FAB.js';
import Modal from './common/Modal.js';
import BillForm from './forms/BillForm.js';
import { DocumentTextIcon } from './Icons.js';

interface InvoiceGroup {
  billNumber: string;
  transactions: StockTransaction[];
  party?: Party;
  date: string;
  total: number;
  type: StockTransactionType;
}

const InvoicesScreen: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { stockTransactions, parties } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const invoices = useMemo<InvoiceGroup[]>(() => {
    const groups: { [key: string]: InvoiceGroup } = {};

    stockTransactions.forEach(t => {
      if (t.billNumber) {
        if (!groups[t.billNumber]) {
          groups[t.billNumber] = {
            billNumber: t.billNumber,
            transactions: [],
            party: parties.find(p => p.id === t.partyId),
            date: t.date,
            total: 0,
            type: t.type,
          };
        }
        groups[t.billNumber].transactions.push(t);
        groups[t.billNumber].total += t.totalAmount;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockTransactions, parties]);
  
  const handleInvoiceClick = (billNumber: string) => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.InvoiceDetail, payload: { billNumber } } });
  };
  
  const handleSaveBill = () => {
    // The BillForm will dispatch the save action, we just need to close the modal.
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title="Invoices & Bills" backScreen={Screen.Home} />
      <main id="invoices-content" className="flex-grow p-4 overflow-y-auto pb-44">
        {invoices.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <DocumentTextIcon className="h-16 w-16 mx-auto text-slate-400" />
            <p className="mt-2">No invoices or bills found.</p>
            <p>Create one by using the '+' button.</p>
          </div>
        ) : (
          <div className="p-0.5 bg-gradient-to-br from-orange-400 to-indigo-500 rounded-lg">
            <div className="bg-slate-50 p-2 rounded-md space-y-2">
              {invoices.map(invoice => (
                <div
                  key={invoice.billNumber}
                  onClick={() => handleInvoiceClick(invoice.billNumber)}
                  className="bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-teal-700">#{invoice.billNumber}</p>
                      <p className="text-sm text-slate-600">{invoice.party?.name || 'N/A'}</p>
                      <p className="text-xs text-slate-400">{new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${invoice.type === 'Sell' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        PKR {invoice.total.toFixed(2)}
                      </p>
                      <p className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                          invoice.type === 'Sell' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {invoice.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <FAB onClick={() => setIsModalOpen(true)} ariaLabel="Create new bill or invoice" />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Bill / Invoice ۔">
        <BillForm onSave={handleSaveBill} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      {/* No footer needed as this is not a main screen, but keeping it consistent with others */}
      <Footer currentScreen={Screen.Invoices} />
    </div>
  );
};

export default InvoicesScreen;