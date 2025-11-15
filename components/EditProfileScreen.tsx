import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext.js';
// Fix: Added .js extension to imports
import { Screen, User } from '../types.js';
import Header from './common/Header.js';
import { CameraIcon } from './Icons.js';

const EditProfileScreen: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { user } = state;

  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  if (!profile) {
    // This should ideally not happen if the user is logged in.
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <Header title="Edit Profile" backScreen={Screen.Home} />
        <p className="p-4 text-center">Loading user data...</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => prev ? { ...prev, photoUrl: event.target?.result as string } : null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: profile });
      alert("Profile updated successfully!");
      dispatch({ type: 'NAVIGATE', payload: { screen: Screen.Home } });
    }
  };
  
  const commonInputClass = "mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500";
  const labelClass = "block text-sm font-medium text-slate-700";

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'text', required: false },
    { name: 'phone', label: 'Phone', type: 'tel', required: false },
    { name: 'alternatePhone', label: 'Other Number', type: 'tel', required: false },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'cnic', label: 'CNIC No. (Optional)', type: 'text', required: false },
    { name: 'businessName', label: 'Business Name (Optional)', type: 'text', required: false },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title="Edit Profile" backScreen={Screen.Home} />
      <main id="edit-profile-content" className="flex-grow p-4 overflow-y-auto pb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="profileImage" className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <CameraIcon className="h-10 w-10" />
                )}
              </div>
            </label>
            <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={handleImageChange} />
             <label htmlFor="profileImage" className="cursor-pointer px-4 py-1.5 text-sm bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors">
                Change Picture
            </label>
          </div>

          {formFields.map(field => (
             <div key={field.name}>
                <label htmlFor={field.name} className={labelClass}>{field.label}</label>
                <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={profile[field.name as keyof User] as string || ''}
                    onChange={handleChange}
                    className={commonInputClass}
                    required={field.required}
                />
            </div>
          ))}

          <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-md hover:from-teal-700 hover:to-cyan-700 font-semibold mt-4">
            Update Profile
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditProfileScreen;