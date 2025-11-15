

import React, { useState, useContext, ChangeEvent, useEffect, useRef } from 'react';
import { AppContext, AppState } from '../../context/AppContext.js';
import Modal from './Modal.js';
// Fix: Added .js extension to import.
import { DocumentArrowUpIcon, ExclamationTriangleIcon, GoogleDriveIcon } from '../Icons.js';

// These are placeholder values. Replace with your actual Google Cloud credentials.
const GOOGLE_DRIVE_API_KEY = "YOUR_GOOGLE_DRIVE_API_KEY";
const GOOGLE_DRIVE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

declare const gapi: any;
declare const google: any;

// FIX: Augment the global Window interface for GAPI (Drive) and GIS (Auth).
// Fix: Updated the type for `window.google` to be consistent with other declarations in the app, resolving a TypeScript error.
declare global {
    interface Window {
        gapi: any;
        google: {
            accounts: {
                id: any;
                oauth2: any;
            };
            picker: any;
        };
    }
}

const RestoreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { dispatch } = useContext(AppContext);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [driveLoadingMessage, setDriveLoadingMessage] = useState('');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const tokenClient = useRef<any>(null);
    const gapiInited = useRef(false);
    const gisInited = useRef(false); // Represents if the client is *successfully* initialized

    useEffect(() => {
        if (isOpen) {
            // Initialize Google APIs if not already done. Scripts are loaded from index.html.
            if (window.gapi && !gapiInited.current) {
                gapi.load('client:picker', initializeGapiClient);
            }
            if (window.google && !gisInited.current) {
                initializeGisClient();
            }
        }
    }, [isOpen]);

    const initializeGapiClient = async () => {
        await gapi.client.init({
            apiKey: GOOGLE_DRIVE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
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
        } catch (error) {
            console.error("Failed to initialize Google GIS Client:", error);
            gisInited.current = false;
        }
    };
    
    const processRestoreData = (fileContent: string) => {
        try {
            if (typeof fileContent !== 'string') throw new Error("File content is invalid.");
            
            const parsedData = JSON.parse(fileContent) as Partial<AppState>;
            const requiredKeys: (keyof AppState)[] = ['parties', 'dayBookEntries', 'stockItems', 'stockTransactions'];
            const hasRequiredKeys = requiredKeys.every(key => key in parsedData);
            
            if (!hasRequiredKeys) {
                throw new Error("Invalid backup file. The file is missing essential data sections.");
            }

            dispatch({ type: 'RESTORE_STATE', payload: parsedData });
            alert("Data restored successfully!");
            onClose();

        } catch (error) {
            console.error("Restore failed:", error);
            alert(`Restore failed: ${error instanceof Error ? error.message : "Unknown error"}. Please make sure you are using a valid backup file.`);
        } finally {
            setIsLoading(false);
            setDriveLoadingMessage('');
            setSelectedFile(null);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleLocalRestore = async () => {
        if (!selectedFile) {
            alert("Please select a file to restore.");
            return;
        }
        if (!window.confirm("Are you absolutely sure? This will overwrite all current data.")) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => processRestoreData(e.target?.result as string);
        reader.onerror = () => {
             alert("Failed to read the file.");
             setIsLoading(false);
        };
        reader.readAsText(selectedFile);
    };
    
    const handleDriveRestore = () => {
        if (GOOGLE_DRIVE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID")) {
            setIsConfigModalOpen(true);
            return;
        }
        if (!gapiInited.current || !gisInited.current) {
            alert('Google Drive service is not ready yet. Please wait a moment and try again.');
            return;
        }
        if (!window.confirm("Are you absolutely sure? This will overwrite all current data.")) return;
        
        setIsLoading(true);
        setDriveLoadingMessage('Connecting to Google Drive...');
        
        tokenClient.current.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                setIsLoading(false);
                setDriveLoadingMessage('');
                throw (resp);
            }
            setDriveLoadingMessage('Opening file picker...');
            createPicker();
        };

        if (gapi.client.getToken() === null) {
            tokenClient.current.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.current.requestAccessToken({ prompt: '' });
        }
    };
    
    const createPicker = () => {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("application/json");
        const picker = new google.picker.PickerBuilder()
            .setAppId(null) // Not needed for this flow
            .setOAuthToken(gapi.client.getToken().access_token)
            .setDeveloperKey(GOOGLE_DRIVE_API_KEY)
            .addView(view)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
        setDriveLoadingMessage('');
        setIsLoading(false);
    }
    
    const pickerCallback = async (data: any) => {
        if (data.action === google.picker.Action.PICKED) {
            setIsLoading(true);
            setDriveLoadingMessage('Downloading and processing file...');
            const doc = data.docs[0];
            const fileId = doc.id;
            
            try {
                const response = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                processRestoreData(response.body);
            } catch (error) {
                console.error("Error fetching file from Drive:", error);
                alert("Could not retrieve the file from Google Drive.");
                setIsLoading(false);
                setDriveLoadingMessage('');
            }
        } else if (data.action === google.picker.Action.CANCEL) {
            setIsLoading(false);
            setDriveLoadingMessage('');
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Restore Data">
                <div className="space-y-6">
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-amber-700">
                                    <span className="font-bold">Warning:</span> Restoring data will <span className="font-bold">completely replace</span> all current data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-slate-700 mb-2">1. Select Backup Source</h3>
                        <div className="space-y-3">
                            <label htmlFor="restore-file-input" className="w-full cursor-pointer relative block px-4 py-6 border-2 border-slate-300 border-dashed rounded-md text-center hover:border-teal-400 bg-slate-50">
                                <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-slate-400" />
                                <span className="mt-2 block text-sm font-medium text-slate-600">
                                    {selectedFile ? selectedFile.name : 'Click to select a local .json backup'}
                                </span>
                                <input 
                                    type="file" 
                                    id="restore-file-input" 
                                    onChange={handleFileChange} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    accept=".json"
                                />
                            </label>

                            <div className="flex items-center">
                               <hr className="flex-grow border-slate-300" />
                               <span className="px-2 text-sm text-slate-500">OR</span>
                               <hr className="flex-grow border-slate-300" />
                            </div>
                            
                            <button
                                onClick={handleDriveRestore}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-md font-semibold transition-colors duration-200 bg-[#4285F4] hover:bg-[#357ae8] disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <GoogleDriveIcon className="h-5 w-5" />
                                <span>Restore from Google Drive</span>
                            </button>
                            {driveLoadingMessage && <p className="text-xs text-center text-slate-600 mt-1">{driveLoadingMessage}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={handleLocalRestore}
                            disabled={!selectedFile || isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-md font-semibold transition-colors duration-200 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoading && !driveLoadingMessage ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Restoring...</span>
                                </>
                            ) : (
                                <span>Restore Local File & Overwrite</span>
                            )}
                        </button>
                        {!selectedFile && <p className="text-xs text-center text-slate-500 mt-2">Select a local file to enable this button.</p>}
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Feature Not Configured">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Google Drive Restore</h3>
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
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
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

export default RestoreModal;