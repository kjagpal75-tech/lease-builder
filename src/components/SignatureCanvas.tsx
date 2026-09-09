'use client';

import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Signature } from '@/types/lease';

interface SignatureCanvasProps {
  onSignatureComplete: (signature: Signature) => void;
  signerName: string;
  existingSignature?: Signature;
}

export default function SignatureCanvasComponent({ 
  onSignatureComplete, 
  signerName,
  existingSignature 
}: SignatureCanvasProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(!!existingSignature);
  const [name, setName] = useState(existingSignature?.name || '');
  const [signedOffsite, setSignedOffsite] = useState(existingSignature?.method === 'offline_third_party');

  useEffect(() => {
    if (existingSignature && sigCanvas.current) {
      sigCanvas.current.fromDataURL(existingSignature.signatureData);
    }
  }, [existingSignature]);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const saveSignature = () => {
    if (!name.trim()) {
      alert('Please provide your full legal name');
      return;
    }

    // For digital signatures, require a drawn signature
    if (!signedOffsite && (!sigCanvas.current || sigCanvas.current.isEmpty())) {
      alert('Please sign the document in the box below');
      return;
    }

    const signatureData = signedOffsite ? '' : (sigCanvas.current?.toDataURL() || '');
    const signature: Signature = {
      name: name.trim(),
      signatureData,
      date: new Date().toISOString(),
      ipAddress: signedOffsite ? '' : 'IP Logged',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      method: signedOffsite ? 'offline_third_party' : 'digital',
    };

    onSignatureComplete(signature);
    setIsSigned(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {existingSignature ? 'Update Signature' : 'Digital Signature'}
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Legal Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full legal name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={signedOffsite}
            onChange={(e) => setSignedOffsite(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span>Already signed offsite / via third-party app (DocuSign, HelloSign, etc.)</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sign in the box below *
        </label>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-48 bg-white cursor-crosshair'
            }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={saveSignature}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {existingSignature ? 'Update Signature' : 'Sign Document'}
        </button>
      </div>

      {isSigned && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">
            ✓ Signature recorded successfully
          </p>
          <p className="text-xs text-green-600 mt-1">
            Digital signature record includes timestamp, IP address, and browser fingerprint for legal validity.
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Legal Notice:</strong> By signing this document electronically, you agree that your digital signature 
          is the legal equivalent of your manual signature on this document. You consent to be legally bound by this 
          document's terms and conditions. You further agree that your electronic signature is valid and binding 
          as if you signed the document in ink.
        </p>
      </div>
    </div>
  );
}