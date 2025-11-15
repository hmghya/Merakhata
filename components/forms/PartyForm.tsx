import React, { useState, useEffect } from 'react';
import { Party, PartyType } from '../../types.js';

interface PartyFormProps {
  party?: Party | null;
  partyType?: PartyType; // Prop is now optional
  onSave: (party: Party) => void;
  onCancel: () => void;
}

const PartyForm: React.FC<PartyFormProps> = ({ party, partyType, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    alternatePhone: '',
    address: '',
    email: '',
    cnic: '',
    balance: 0,
  });
  const [type, setType] = useState<PartyType>(partyType || 'Customer');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name,
        businessName: party.businessName || '',
        phone: party.phone || '',
        alternatePhone: party.alternatePhone || '',
        address: party.address || '',
        email: party.email || '',
        cnic: party.cnic || '',
        balance: party.balance,
      });
      setType(party.type);
    } else {
      // Reset for new party
      setFormData({
        name: '',
        businessName: '',
        phone: '',
        alternatePhone: '',
        address: '',
        email: '',
        cnic: '',
        balance: 0,
      });
      setType(partyType || 'Customer');
    }
  }, [party, partyType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
      if (!phone.trim()) return true; // Optional field is valid if empty
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!validatePhoneNumber(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number (7-15 digits).';
    }
    if (!validatePhoneNumber(formData.alternatePhone)) {
        newErrors.alternatePhone = 'Please enter a valid phone number (7-15 digits).';
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    
    setErrors({});
    const partyData: Party = {
      id: party?.id || Date.now().toString(),
      type: type,
      ...formData,
      balance: party ? formData.balance : 0 // Ensure new party starts with 0 balance
    };
    onSave(partyData);
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500";
  const labelClass = "block text-sm font-medium text-slate-700";
  
  return (
    <div className="bg-white p-4 rounded-md">
        <form onSubmit={handleSubmit} className="space-y-4">
        {!party && !partyType && (
            <div>
                <label className={labelClass}>Party Type</label>
                <div className="mt-2 flex gap-4">
                    <label className="flex items-center">
                        <input type="radio" name="partyType" value="Customer" checked={type === 'Customer'} onChange={() => setType('Customer')} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-slate-300" />
                        <span className="ml-2 text-sm text-slate-700">Customer</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="partyType" value="Supplier" checked={type === 'Supplier'} onChange={() => setType('Supplier')} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-slate-300" />
                        <span className="ml-2 text-sm text-slate-700">Supplier</span>
                    </label>
                </div>
            </div>
        )}
        <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`${commonInputClass} border-slate-300`} required />
        </div>
        <div>
            <label htmlFor="businessName" className={labelClass}>Business Name (Optional)</label>
            <input type="text" name="businessName" id="businessName" value={formData.businessName} onChange={handleChange} className={`${commonInputClass} border-slate-300`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="phone" className={labelClass}>Phone</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={`${commonInputClass} ${errors.phone ? 'border-rose-500' : 'border-slate-300'}`} />
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
            </div>
            <div>
                <label htmlFor="alternatePhone" className={labelClass}>Other Number</label>
                <input type="tel" name="alternatePhone" id="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className={`${commonInputClass} ${errors.alternatePhone ? 'border-rose-500' : 'border-slate-300'}`} />
                {errors.alternatePhone && <p className="mt-1 text-xs text-rose-600">{errors.alternatePhone}</p>}
            </div>
        </div>
        <div>
            <label htmlFor="address" className={labelClass}>Address</label>
            <textarea name="address" id="address" value={formData.address} onChange={handleChange} className={`${commonInputClass} border-slate-300`} rows={2}></textarea>
        </div>
        <div>
            <label htmlFor="email" className={labelClass}>Email (Optional)</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`${commonInputClass} border-slate-300`} />
        </div>
        <div>
            <label htmlFor="cnic" className={labelClass}>CNIC No. (Optional)</label>
            <input type="text" name="cnic" id="cnic" value={formData.cnic} onChange={handleChange} className={`${commonInputClass} border-slate-300`} />
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700">Save</button>
        </div>
        </form>
    </div>
  );
};

export default PartyForm;