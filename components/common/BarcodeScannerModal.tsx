import React, { useEffect, useRef } from 'react';

// This will be a global from the script tag in index.html
declare const Html5Qrcode: any;

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        onScanSuccess(decodedText);
      };
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      // Prefer back camera
      html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
        .catch((err: any) => {
          console.error("Failed to start scanner with back camera, trying default", err);
          // Fallback to default camera if environment is not available
          html5QrCode.start({ }, config, qrCodeSuccessCallback, undefined)
            .catch((err: any) => console.error("Failed to start scanner", err));
        });

    } else {
      // Cleanup
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch((err: any) => console.error("Failed to stop scanner", err));
      }
    }

    // Cleanup on component unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => console.error("Failed to stop scanner on unmount", err));
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Scan Code</h2>
        </div>
        <div id="reader" className="w-full"></div>
        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;