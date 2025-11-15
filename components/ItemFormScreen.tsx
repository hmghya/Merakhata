import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Added .js extension to import.
import { Screen, StockItem } from '../types.js';
import Header from './common/Header.js';
import ItemForm from './forms/ItemForm.js';

interface ItemFormScreenProps {
  itemId?: string; // For editing
}

const ItemFormScreen: React.FC<ItemFormScreenProps> = ({ itemId }) => {
  const { state, dispatch } = useContext(AppContext);
  const { stockItems } = state;
  const isEditing = !!itemId;
  const itemToEdit = isEditing ? stockItems.find(i => i.id === itemId) : undefined;
  const title = isEditing ? "Edit Item" : "Add New Item";

  const handleSave = (item: StockItem) => {
    if (isEditing) {
      dispatch({ type: 'EDIT_STOCK_ITEM', payload: item });
    } else {
      dispatch({ type: 'ADD_STOCK_ITEM', payload: item });
    }
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.StockBook } });
  };

  const handleCancel = () => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.StockBook } });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={title} backScreen={Screen.StockBook} />
      <main id="item-form-content" className="flex-grow p-4 overflow-y-auto">
        <ItemForm
          itemToEdit={itemToEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
};

export default ItemFormScreen;