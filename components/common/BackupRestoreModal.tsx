import React, { useState, useContext, ChangeEvent, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext.js';
import Modal from './Modal.js';
import { FileCsvIcon, FileXlsxIcon, DocumentArrowDownIcon, GoogleDriveIcon, ExclamationTriangleIcon } from '../Icons.js';
import { StockItem } from '../../types.js';

// Declare global variables from CDN scripts for TypeScript
declare const XLSX: any;
declare const gapi: any;
declare const google: any;

// These are placeholder values. Replace with your actual Google Cloud credentials.
const GOOGLE_DRIVE_API_KEY = "YOUR_GOOGLE_DRIVE_API_KEY";
const GOOGLE_DRIVE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// jsPDF and jsPDF-AutoTable are loaded from the CDN and attach to the window object.
// We need to declare them on the global scope for TypeScript to recognize them.
// FIX: Augment the global Window interface for jsPDF, GAPI (Drive) and GIS (Auth).
// Fix: Updated the type for `window.google` to be consistent with other declarations in the app, resolving a TypeScript error.
declare global {
    interface Window {
        jspdf: any;
        jsPDF: any; // The global constructor patched by plugins
        gapi: any;
        google: {
            accounts: {
                id: any;
                oauth2: any;
            };
            // Fix: Add picker property to match declaration in RestoreModal.tsx to resolve type conflicts.
            picker: any;
        };
    }
}

const BackupRestoreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { state } = useContext(AppContext);
    const { parties, dayBookEntries, stockItems, stockTransactions } = state;
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [selectedData, setSelectedData] = useState({
        parties: true,
        dayBook: true,
        stockItems: true,
        stockTransactions: true,
    });
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
    const tokenClient = useRef<any>(null);
    const gapiInited = useRef(false);
    const gisInited = useRef(false); // Represents if the client is *successfully* initialized

    useEffect(() => {
        if (isOpen) {
            // Initialize Google APIs if not already done. Scripts are loaded from index.html.
            if (window.gapi && !gapiInited.current) {
                gapi.load('client', initializeGapiClient);
            }
            if (window.google && !gisInited.current) {
                initializeGisClient();
            }
        }
    }, [isOpen]);

    const initializeGapiClient = async () => {
        await gapi.client.init({ apiKey: GOOGLE_DRIVE_API_KEY });
        gapiInited.current = true;
    };

    const initializeGisClient = () => {
        if (GOOGLE_DRIVE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
            console.warn("Google Drive Client ID is not configured. Google Drive features will be disabled.");
            gisInited.current = false;
            return;
        }
        try {
            tokenClient.current = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_DRIVE_CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined later
            });
            gisInited.current = true;
        } catch(error) {
            console.error("Failed to initialize Google GIS client:", error);
            gisInited.current = false;
        }
    };


    const handleSelectionChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setSelectedData(prev => ({ ...prev, [name]: checked }));
    };
    
    const hasSelection = Object.values(selectedData).some(v => v);

    const handleButtonClick = (format: 'xlsx' | 'csv' | 'json' | 'drive') => {
        if (format === 'drive') {
            handleDriveBackup();
        } else {
            handleExport(format);
        }
    };

    const handleExport = async (format: 'xlsx' | 'csv' | 'json') => {
        if (!hasSelection) {
            alert("Please select at least one data type to export.");
            return;
        }
        setIsLoading(format);
        // Add a small delay to allow UI to update to loading state
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            switch (format) {
                case 'xlsx': exportToXlsx(); break;
                case 'csv': exportToCsv(); break;
                case 'json': exportToJson(); break;
            }
        } catch (error) {
            console.error(`Error exporting to ${format}:`, error);
            alert(`An error occurred while exporting to ${format}. Please check the console for details.`);
        } finally {
            setIsLoading(null);
        }
    };

    const handleDriveBackup = async () => {
        if (GOOGLE_DRIVE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
            setIsConfigModalOpen(true);
            return;
        }
        if (!hasSelection) {
            alert("Please select at least one data type to back up.");
            return;
        }
        if (!gapiInited.current || !gisInited.current) {
            alert('Google Drive service is not ready yet. Please wait a moment and try again.');
            return;
        }
        
        setIsLoading('drive');

        tokenClient.current.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                setIsLoading(null);
                console.error('Google Auth Error:', resp);
                alert("Google Drive authentication failed. Please try again.");
                return;
            }

            const dataToBackup = getJsonData();
            const jsonString = JSON.stringify(dataToBackup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `mayra-khata-backup-${new Date().toISOString().split('T')[0]}.json`;
            const metadata = { 'name': fileName, 'mimeType': 'application/json' };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            try {
                const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
                    body: form,
                });

                if (uploadResponse.ok) {
                    alert("Backup successful! File saved to your Google Drive.");
                } else {
                    const errorBody = await uploadResponse.json();
                    console.error("Google Drive upload error:", errorBody);
                    alert(`Failed to save backup to Google Drive: ${errorBody.error.message}`);
                }
            } catch (error) {
                console.error("Error during Google Drive backup:", error);
                alert("An unexpected error occurred during the backup process.");
            } finally {
                setIsLoading(null);
            }
        };

        if (gapi.client.getToken() === null) {
            tokenClient.current.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.current.requestAccessToken({ prompt: '' });
        }
    };

    const exportToXlsx = () => {
        const wb = XLSX.utils.book_new();
        if (selectedData.parties) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parties), "Parties");
        if (selectedData.dayBook) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayBookEntries), "DayBookEntries");
        if (selectedData.stockItems) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockItems), "StockItems");
        if (selectedData.stockTransactions) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockTransactions), "StockTransactions");
        XLSX.writeFile(wb, `mayra-khata-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    const downloadCsv = (filename: string, data: any[]) => {
        if (data.length === 0) return;
        const csvContent = [ Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).map(v => JSON.stringify(v)).join(',')) ].join('\n');
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        link.download = filename;
        link.click();
    }

    const exportToCsv = () => {
        if (selectedData.parties) downloadCsv('parties.csv', parties);
        if (selectedData.dayBook) downloadCsv('daybook_entries.csv', dayBookEntries);
        if (selectedData.stockItems) downloadCsv('stock_items.csv', stockItems);
        if (selectedData.stockTransactions) downloadCsv('stock_transactions.csv', stockTransactions);
    };
    
    const getJsonData = () => {
        const dataToBackup: { [key: string]: any } = {};
        if (selectedData.parties) dataToBackup.parties = parties;
        if (selectedData.dayBook) dataToBackup.dayBookEntries = dayBookEntries;
        if (selectedData.stockItems) dataToBackup.stockItems = stockItems;
        if (selectedData.stockTransactions) dataToBackup.stockTransactions = stockTransactions;
        return dataToBackup;
    };

    const exportToJson = () => {
        const jsonString = JSON.stringify(getJsonData(), null, 2);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
        link.download = `mayra-khata-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const dataOptions = [
        { key: 'parties', label: `Parties (${parties.length})` },
        { key: 'dayBook', label: `Day Book Entries (${dayBookEntries.length})` },
        { key: 'stockItems', label: `Stock Items (${stockItems.length})` },
        { key: 'stockTransactions', label: `Stock Transactions (${stockTransactions.length})` },
    ];
    
    const exportButtons = [
        { format: 'json', label: 'JSON (for Restore)', icon: DocumentArrowDownIcon, color: 'bg-gradient-to-r from-teal-600 to-cyan-600' },
        { format: 'drive', label: 'Backup to Google Drive', icon: GoogleDriveIcon, color: 'bg-[#4285F4] hover:bg-[#357ae8]' },
        { format: 'xlsx', label: 'Excel (XLSX)', icon: FileXlsxIcon, color: 'bg-emerald-600 hover:bg-emerald-700' },
        { format: 'csv', label: 'CSV', icon: FileCsvIcon, color: 'bg-sky-600 hover:bg-sky-700' },
    ] as const;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Backup Data">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-md font-semibold text-slate-700 mb-2">1. Select Data to Backup</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-slate-100 rounded-md">
                            {dataOptions.map(opt => (
                                <label key={opt.key} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox" name={opt.key}
                                        checked={selectedData[opt.key as keyof typeof selectedData]}
                                        onChange={handleSelectionChange}
                                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm text-slate-800">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-md font-semibold text-slate-700 mb-2">2. Choose Export Format</h3>
                        <div className="space-y-3">
                            {exportButtons.map(({format, label, icon: Icon, color}) => (
                                <button
                                    key={format}
                                    onClick={() => handleButtonClick(format)}
                                    disabled={!hasSelection || !!isLoading}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-md font-semibold transition-colors duration-200 ${color} disabled:bg-slate-400 disabled:cursor-not-allowed`}
                                >
                                    {isLoading === format ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon className="h-5 w-5" />
                                            <span>{label}</span>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                        {!hasSelection && <p className="text-xs text-center text-rose-600 mt-2">Please select at least one data type to enable export.</p>}
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Feature Not Configured">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Google Drive Backup</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      This feature is currently unavailable.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      A developer needs to configure the following to enable it: <br />
                      <strong className="font-semibold text-gray-700">Google Drive API Key &amp; Client ID</strong>
                    </p>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-base font-medium text-white hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                    onClick={() => setIsConfigModalOpen(false)}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </Modal>
        </>
    );
};

export default BackupRestoreModal;