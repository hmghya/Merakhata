import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Added .js extension to imports
import { Party, PartyType, Screen } from '../types.js';
import Header from './common/Header.js';
import FAB from './common/FAB.js';
import Modal from './common/Modal.js';
import PartyForm from './forms/PartyForm.js';
import { TrashIcon, PencilIcon, UsersIcon, TruckIcon } from './Icons.js';
import Footer from './common/Footer.js';

interface PartyManagementScreenProps {
  partyType: PartyType;
}

const PartyManagementScreen: React.FC<PartyManagementScreenProps> = ({ partyType }) => {
  const { state, dispatch } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'receivable' | 'payable'>('all');

  const title = partyType === 'Customer' ? 'Customers' : 'Suppliers';
  const addPartyLabel = `Add new ${partyType.toLowerCase()}`;
  const currentScreen = partyType === 'Customer' ? Screen.Customers : Screen.Suppliers;

  const filteredParties = useMemo(() => {
    return state.parties
        .filter(p => p.type === partyType)
        .filter(p => {
            if (balanceFilter === 'receivable') return p.balance >= 0;
            if (balanceFilter === 'payable') return p.balance < 0;
            return true; // 'all'
        });
  }, [state.parties, partyType, balanceFilter]);

  const handleOpenModal = (party?: Party) => {
    setEditingParty(party || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingParty(null);
  };

  const handleSave = (party: Party) => {
    if (editingParty) {
      dispatch({ type: 'EDIT_PARTY', payload: party });
    } else {
      dispatch({ type: 'ADD_PARTY', payload: party });
    }
    handleCloseModal();
  };

  const handleDelete = (partyId: string) => {
    dispatch({ type: 'DELETE_PARTY', payload: partyId });
  };
  
  const handlePartyClick = (partyId: string) => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.PartyDetail, payload: { partyId } } });
  };


  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={title} backScreen={Screen.Home} />
      
      <div id="party-management-content" className="flex-grow flex flex-col">
        <div className="p-2 bg-slate-100 border-b border-slate-200">
            <div className="flex justify-center rounded-md shadow-sm" role="group">
                <button
                    type="button"
                    onClick={() => setBalanceFilter('all')}
                    className={`px-4 py-2 text-sm font-medium ${balanceFilter === 'all' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white text-slate-700'} border border-slate-200 rounded-l-lg hover:bg-slate-200 focus:z-10 focus:ring-2 focus:ring-teal-500 transition-colors duration-150`}
                >
                    All
                </button>
                <button
                    type="button"
                    onClick={() => setBalanceFilter('receivable')}
                    className={`px-4 py-2 text-sm font-medium ${balanceFilter === 'receivable' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white text-slate-700'} border-t border-b border-slate-200 hover:bg-slate-200 focus:z-10 focus:ring-2 focus:ring-teal-500 transition-colors duration-150`}
                >
                    Receivable
                </button>
                <button
                    type="button"
                    onClick={() => setBalanceFilter('payable')}
                    className={`px-4 py-2 text-sm font-medium ${balanceFilter === 'payable' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' : 'bg-white text-slate-700'} border border-slate-200 rounded-r-md hover:bg-slate-200 focus:z-10 focus:ring-2 focus:ring-teal-500 transition-colors duration-150`}
                >
                    Payable
                </button>
            </div>
        </div>
        
        <main className="flex-grow p-4 overflow-y-auto pb-44">
            {filteredParties.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
                {partyType === 'Customer' ? 
                <UsersIcon className="h-16 w-16 mx-auto text-slate-400" /> :
                <TruckIcon className="h-16 w-16 mx-auto text-slate-400" />
                }
                <p className="mt-2">No {title.toLowerCase()} found.</p>
                {balanceFilter !== 'all' && <p>Try a different filter.</p>}
            </div>
            ) : (
            <div className="bg-white p-2 rounded-md space-y-3 shadow-sm border">
                {filteredParties.map((party) => (
                    <div key={party.id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                    <div className="flex-grow cursor-pointer" onClick={() => handlePartyClick(party.id)}>
                        <p className="font-semibold text-sm text-slate-800">{party.name}</p>
                        {party.businessName && <p className="text-xs text-slate-600">{party.businessName}</p>}
                        {party.phone && <p className="text-xs text-slate-500 mt-1">{party.phone}</p>}
                        <p className={`text-xs mt-1 font-medium ${party.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Balance: PKR {Math.abs(party.balance).toFixed(2)} {party.balance >= 0 ? '(Receivable)' : '(Payable)'}
                        </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleOpenModal(party)} className="p-2 text-slate-500 hover:text-teal-600 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                        <button onClick={() => handleDelete(party.id)} className="p-2 text-slate-500 hover:text-rose-600 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                    </div>
                ))}
            </div>
            )}
        </main>
      </div>
      <FAB onClick={() => handleOpenModal()} ariaLabel={addPartyLabel} />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingParty ? `Edit ${partyType}` : `Add ${partyType}`}>
        <PartyForm 
          party={editingParty}
          partyType={partyType}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
      <Footer currentScreen={currentScreen} />
    </div>
  );
};

export default PartyManagementScreen;