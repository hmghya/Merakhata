import React, { useContext } from 'react';
// Fix: Added .js extension to imports
import { Screen } from '../types.js';
import Header from './common/Header.js';
import { EnvelopeIcon, GlobeAltIcon } from './Icons.js';
import { AppContext } from '../context/AppContext.js';

const PrivacyPolicyScreen: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { screenPayload } = state;
    const registrationData = screenPayload?.name && screenPayload?.email ? screenPayload : null;

    const handleAccept = () => {
        if (registrationData) {
            dispatch({ type: 'LOGIN', payload: registrationData });
            // The LOGIN action already navigates to the Home screen, so this second dispatch is redundant and can cause race conditions.
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-100">
            <Header title="Privacy Policy" backScreen={registrationData ? undefined : Screen.Home} />
            <main id="privacy-policy-content" className="flex-grow p-4 space-y-4 overflow-y-auto pb-44">
                
                <section className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <h1 className="text-xl font-bold text-slate-800">Privacy Policy for Mayra Khata</h1>
                    <p className="text-slate-500 mt-1">Last Updated: {new Date().toLocaleDateString()}</p>
                </section>

                <section className="bg-white p-4 rounded-lg shadow-sm text-sm text-slate-600 space-y-3">
                    <h2 className="text-base font-semibold text-slate-700">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, manage your business data (customers, suppliers, transactions), or contact us for support. This data is stored locally on your device.</p>
                    
                    <h2 className="text-base font-semibold text-slate-700">2. How We Use Your Information</h2>
                    <p>Your data is used solely for the functionality of the Mayra Khata application. We do not transmit your personal business data to our servers. It remains on your device unless you choose to use the backup/restore features with Google Drive.</p>
                    
                    <h2 className="text-base font-semibold text-slate-700">3. Data Storage and Security</h2>
                    <p>All your business data is stored in your browser's local storage. While this is convenient, please be aware that clearing your browser's data may result in the loss of your information. We recommend using the backup feature regularly.</p>
                    
                    <h2 className="text-base font-semibold text-slate-700">4. Google Drive Integration</h2>
                    <p>If you choose to use the "Backup to Google Drive" or "Restore from Google Drive" features, we will request permission to access your Google Drive for the sole purpose of creating and reading backup files for this application. We do not access any other files on your Drive.</p>
                    
                    <h2 className="text-base font-semibold text-slate-700">5. Changes to This Policy</h2>
                    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                </section>

                <section className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-base font-semibold text-slate-700 mb-3 border-b pb-2">Contact Us</h2>
                    <p className="text-sm text-slate-600">
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <div className="space-y-3 mt-3">
                        <p className="text-sm text-slate-800 font-semibold">
                            Apps Talk SMC Private Limited (Kahror Pakka)
                        </p>
                        <a href="mailto:Appstalk3@gmail.com" className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors">
                            <EnvelopeIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <span>Appstalk3@gmail.com</span>
                        </a>
                        <a href="https://appstalk.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-purple-600 transition-colors">
                            <GlobeAltIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <span>appstalk.online</span>
                        </a>
                    </div>
                </section>
            </main>
            {registrationData && (
                <footer className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10">
                    <button
                        onClick={handleAccept}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 font-semibold"
                    >
                        Accept & Continue
                    </button>
                </footer>
            )}
    </div>
  );
};

export default PrivacyPolicyScreen;