import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext.js';
// Fix: Added .js extension to imports
import { StockItem, Batch } from '../../types.js';
import { CameraIcon, BarcodeIcon, QrcodeIcon, PlusIcon } from '../Icons.js';
import BarcodeScannerModal from '../common/BarcodeScannerModal.js';
import Modal from '../common/Modal.js';

interface ItemFormProps {
  itemToEdit?: StockItem | null;
  onSave: (item: StockItem) => void;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ itemToEdit, onSave, onCancel }) => {
  const { state, dispatch } = useContext(AppContext);
  const { itemCategories } = state;
  const isEditing = !!itemToEdit;
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [item, setItem] = useState<Omit<StockItem, 'id' | 'batches'>>({
    name: '',
    category: '',
    unit: '',
    salesPrice: 0,
    purchasePrice: 0,
    barcode: '',
    lowStockLimit: 0,
    image: undefined
  });
  
  // State for the optional initial batch for new items
  const [initialQuantity, setInitialQuantity] = useState('');
  const [initialBatchNumber, setInitialBatchNumber] = useState('');
  const [initialExpiryDate, setInitialExpiryDate] = useState('');


  useEffect(() => {
    if (itemToEdit) {
      setItem(itemToEdit);
    }
  }, [itemToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: name.endsWith('Price') || name.endsWith('Limit') ? parseFloat(value) || 0 : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setItem(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleScanSuccess = (decodedText: string) => {
    setItem(prev => ({ ...prev, barcode: decodedText }));
    setIsScannerOpen(false);
  };

  const handleAddNewCategory = () => {
    const trimmedCategory = newCategoryName.trim();
    if (trimmedCategory) {
        dispatch({ type: 'ADD_ITEM_CATEGORY', payload: trimmedCategory });
        setItem(prev => ({ ...prev, category: trimmedCategory }));
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem: StockItem = {
      id: itemToEdit?.id || Date.now().toString(),
      batches: itemToEdit?.batches || [],
      ...item,
    };
    
    // If creating a new item, check for and add the initial batch
    const initialQtyNum = parseFloat(initialQuantity) || 0;
    if (!isEditing && initialQtyNum > 0) {
        const newBatch: Batch = {
            quantity: initialQtyNum,
            batchNumber: initialBatchNumber.trim() || 'default',
            expiryDate: initialExpiryDate || undefined,
        };
        finalItem.batches.push(newBatch);
    }

    onSave(finalItem);
  };
  
  const formFields = [
    { name: 'name', label: 'Item Name', type: 'text', required: true },
    { name: 'unit', label: 'Unit (e.g., pcs, kg)', type: 'text' },
    { name: 'salesPrice', label: 'Sales Price', type: 'number', required: true },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number' },
    { name: 'lowStockLimit', label: 'Low Stock Limit', type: 'number' },
  ];

  return (
    <>
        <div className="bg-white p-4 rounded-md">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
                <label htmlFor="itemImage" className="cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                    {item.image ? (
                    <img src={item.image} alt="Item" className="w-full h-full object-cover" />
                    ) : (
                    <CameraIcon className="h-10 w-10" />
                    )}
                </div>
                </label>
                <input type="file" id="itemImage" className="hidden" accept="image/*" onChange={handleImageChange} />
                <label htmlFor="itemImage" className="cursor-pointer px-4 py-1.5 text-sm bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors">
                    Upload Picture
                </label>
            </div>

            {formFields.map(field => (
                <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
                    <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={item[field.name as keyof Omit<StockItem, 'id' | 'batches'>] as string || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        required={field.required}
                        step={field.type === 'number' ? '0.01' : undefined}
                        min={field.type === 'number' ? '0' : undefined}
                    />
                </div>
            ))}

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <select
                            id="category"
                            name="category"
                            value={item.category}
                            onChange={handleChange}
                            className="focus:ring-teal-500 focus:border-teal-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-slate-300 bg-white"
                        >
                            <option value="">Select a category</option>
                            {itemCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-slate-500 text-sm hover:bg-slate-200"
                            aria-label="Add new category"
                        >
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-slate-700">Item Code (Barcode/QR)</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" name="barcode" id="barcode" value={item.barcode} onChange={handleChange} className="focus:ring-teal-500 focus:border-teal-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-slate-300" placeholder="Scan or enter code" />
                        <button type="button" onClick={handleOpenScanner} className="inline-flex items-center px-3 border border-l-0 border-slate-300 bg-slate-100 text-slate-500 text-sm hover:bg-slate-200">
                            <BarcodeIcon className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={handleOpenScanner} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-slate-500 text-sm hover:bg-slate-200">
                            <QrcodeIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                {!isEditing && (
                    <div className="p-4 border-t border-dashed border-slate-300 mt-4 space-y-4 bg-slate-50 rounded-md">
                        <h3 className="text-md font-semibold text-slate-700">Initial Stock (Optional)</h3>
                        <p className="text-xs text-slate-500">You can add the first batch of stock for this new item. More can be added later via a 'Buy' transaction.</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Initial Quantity</label>
                            <input type="number" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" min="0" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Batch Number</label>
                                <input type="text" value={initialBatchNumber} onChange={e => setInitialBatchNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="Optional (e.g., B001)" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Expiry Date</label>
                                <input type="date" value={initialExpiryDate} onChange={e => setInitialExpiryDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>
                )}

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700">
                    {isEditing ? 'Save Changes' : 'Add Item'}
                </button>
            </div>
            </form>
        </div>

        <BarcodeScannerModal 
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={handleScanSuccess}
        />
        <Modal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            title="Add New Category"
        >
            <div className="space-y-4">
                <div>
                <label htmlFor="newCategoryName" className="block text-sm font-medium text-slate-700">Category Name</label>
                <input
                    type="text"
                    id="newCategoryName"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                />
                </div>
                <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                <button type="button" onClick={handleAddNewCategory} className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700">Add</button>
                </div>
            </div>
        </Modal>
    </>
  );
};

// Fix: Add missing default export.
export default ItemForm;
