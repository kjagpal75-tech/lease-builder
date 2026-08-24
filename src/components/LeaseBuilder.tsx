'use client';

import { useEffect, useState } from 'react';
import { LeaseDocument, Signature, defaultDisclosureFlags } from '@/types/lease';
import { storageService, formatRentSummary, formatLocalDate } from '@/lib/storage';
import { downloadPDF, previewPDF } from '@/lib/pdfGenerator';
import { getApplicableDisclosures } from '@/lib/stateRequirements';
import LeaseForm from './LeaseForm';
import SignatureCanvasComponent from './SignatureCanvas';
import DocumentAttachments from './DocumentAttachments';

export default function LeaseBuilder() {
  const [currentLease, setCurrentLease] = useState<LeaseDocument | null>(null);
  const [view, setView] = useState<'form' | 'review' | 'sign' | 'dashboard'>('dashboard');
  const [savedLeases, setSavedLeases] = useState<LeaseDocument[]>([]);

  const loadSavedLeases = () => {
    setSavedLeases(storageService.getAllLeases());
  };

  useEffect(() => {
    loadSavedLeases();
  }, []);

  const goToDashboard = () => {
    loadSavedLeases();
    setCurrentLease(null);
    setView('dashboard');
  };

  const handleSaveLease = (lease: LeaseDocument) => {
    storageService.saveLease(lease);
    setCurrentLease(lease);
    setView('review');
    loadSavedLeases();
  };

  const handleLoadLease = (lease: LeaseDocument) => {
    setCurrentLease(lease);
    setView('review');
  };

  const handleEditLease = () => {
    setView('form');
  };

  const handleSignLease = () => {
    setView('sign');
  };

  const handleLandlordSignature = (landlordIndex: number, signature: Signature) => {
    if (currentLease) {
      const updatedSignatures = [...(currentLease.landlordSignatures || [])];
      updatedSignatures[landlordIndex] = signature;
      
      const updatedLease = {
        ...currentLease,
        landlordSignatures: updatedSignatures,
        updatedAt: new Date().toISOString()
      };
      setCurrentLease(updatedLease);
      storageService.saveLease(updatedLease);
    }
  };

  const handleTenantSignature = (tenantIndex: number, signature: Signature) => {
    if (currentLease) {
      const updatedSignatures = [...(currentLease.tenantSignatures || [])];
      updatedSignatures[tenantIndex] = signature;
      
      const updatedLease = {
        ...currentLease,
        tenantSignatures: updatedSignatures,
        updatedAt: new Date().toISOString()
      };
      setCurrentLease(updatedLease);
      storageService.saveLease(updatedLease);
    }
  };

  const handleAttachmentsChange = (attachments: import('@/types/lease').Attachment[]) => {
    if (currentLease) {
      const updatedLease = {
        ...currentLease,
        attachments,
        updatedAt: new Date().toISOString()
      };
      setCurrentLease(updatedLease);
      storageService.saveLease(updatedLease);
    }
  };

  const handleDownloadPDF = async () => {
    if (currentLease) {
      try {
        await downloadPDF(currentLease);
      } catch (error) {
        alert('Error generating PDF. Please try again.');
      }
    }
  };

  const handleDeleteLease = (id: string) => {
    if (confirm('Are you sure you want to delete this lease?')) {
      storageService.deleteLease(id);
      if (currentLease?.id === id) {
        goToDashboard();
      } else {
        loadSavedLeases();
      }
    }
  };

  const handleUtilityCheck = (utility: string, checked: boolean) => {
    if (!currentLease) return;
    const currentChecked = currentLease.terms.checkedUtilities || [];
    const updated = checked
      ? [...currentChecked, utility]
      : currentChecked.filter(u => u !== utility);
    const updatedLease = {
      ...currentLease,
      terms: {
        ...currentLease.terms,
        checkedUtilities: updated,
      },
      updatedAt: new Date().toISOString(),
    };
    setCurrentLease(updatedLease);
    storageService.saveLease(updatedLease);
  };

  const handleNewLease = () => {
    setCurrentLease(null);
    setView('form');
  };

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              type="button"
              onClick={goToDashboard}
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Dashboard
            </button>
            <LeaseForm 
              onSave={handleSaveLease} 
              initialData={currentLease || undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'sign' && currentLease) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('review')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Review
          </button>
          
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Sign Lease Agreement</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Property:</strong> {currentLease.property.address}, {currentLease.property.city}, {currentLease.property.state}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Rent:</strong> {formatRentSummary(currentLease.terms)}
              </p>
            </div>

            {currentLease.landlords.map((landlord, index) => (
              <SignatureCanvasComponent
                key={`landlord-${index}`}
                signerName={landlord.name}
                onSignatureComplete={(signature) => handleLandlordSignature(index, signature)}
                existingSignature={currentLease.landlordSignatures?.[index]}
              />
            ))}

            {currentLease.tenants.map((tenant, index) => (
              <SignatureCanvasComponent
                key={`tenant-${index}`}
                signerName={tenant.name}
                onSignatureComplete={(signature) => handleTenantSignature(index, signature)}
                existingSignature={currentLease.tenantSignatures?.[index]}
              />
            ))}

            {currentLease.landlordSignatures && 
             currentLease.landlordSignatures.length === currentLease.landlords.length &&
             currentLease.landlordSignatures.every(sig => sig !== undefined) &&
             currentLease.tenantSignatures &&
             currentLease.tenantSignatures.length === currentLease.tenants.length &&
             currentLease.tenantSignatures.every(sig => sig !== undefined) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ All parties have signed this lease agreement
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Download Signed PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Review a specific lease
  if (view === 'review' && currentLease) {
    return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              type="button"
              onClick={goToDashboard}
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Lease Review</h1>
          </div>
          <button
            type="button"
            onClick={handleNewLease}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Lease
          </button>
        </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentLease.property.address}
                  </h2>
                  <p className="text-gray-600">
                    {currentLease.property.city}, {currentLease.property.state} {currentLease.property.zipCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditLease}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLease(currentLease.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Landlord(s):</p>
                  {currentLease.landlords.map((landlord, index) => (
                    <div key={index} className="text-gray-600">
                      <p>{landlord.name}</p>
                      <p className="text-xs">{landlord.phone}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-gray-700">Tenant(s):</p>
                  {currentLease.tenants.map((tenant, index) => (
                    <div key={index} className="text-gray-600">
                      <p>{tenant.name}</p>
                      <p className="text-xs">{tenant.phone}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-gray-700">Term:</p>
                  <p className="text-gray-600">
                    {formatLocalDate(currentLease.terms.startDate)} - {formatLocalDate(currentLease.terms.endDate)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Rent:</p>
                  <p className="text-gray-600">{formatRentSummary(currentLease.terms)}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSignLease}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {(currentLease.landlordSignatures && currentLease.landlordSignatures.some(sig => sig !== undefined)) || 
                   (currentLease.tenantSignatures && currentLease.tenantSignatures.some(sig => sig !== undefined)) ? 'Update Signatures' : 'Sign Lease'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Download PDF
                </button>
                <button
                  onClick={async () => {
                    if (currentLease) {
                      try {
                        await previewPDF(currentLease);
                      } catch (error) {
                        alert('Error previewing PDF. Please try again.');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Preview PDF
                </button>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong> {new Date(currentLease.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> {new Date(currentLease.updatedAt).toLocaleString()}
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Signatures:</p>
                  {currentLease.landlords.map((landlord, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      Landlord {index + 1}: {currentLease.landlordSignatures?.[index] ? '✓ Signed' : 'Not signed'}
                    </p>
                  ))}
                  {currentLease.tenants.map((tenant, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      Tenant {index + 1}: {currentLease.tenantSignatures?.[index] ? '✓ Signed' : 'Not signed'}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Applicable disclosures ({currentLease.property.state})
                </p>
                <ul className="space-y-1">
                  {getApplicableDisclosures({
                    ...currentLease.property,
                    disclosureFlags: {
                      ...defaultDisclosureFlags(),
                      ...(currentLease.property.disclosureFlags || {}),
                    },
                  }).map((d) => (
                    <li key={d.id} className="text-sm text-blue-800">
                      • {d.title}
                      {d.statute ? ` — ${d.statute}` : ''}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-base font-semibold text-green-900 mb-3">Utility Company Checklist</h3>
                <p className="text-xs text-green-700 mb-3">Applicable for Reno NV and Truckee CA — verify contact info and set up accounts before move-in.</p>
                
                <div>
                  <h4 className="text-sm font-bold text-green-800 mb-2">{currentLease?.property?.city === 'Truckee' ? 'Truckee, CA' : 'Reno, NV'}</h4>
                  <ul className="text-sm text-green-800 space-y-2">
                    {currentLease?.property?.city === 'Truckee' ? (
                      <>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Tahoe Public Utility District (Electric)')} onChange={(e) => handleUtilityCheck('Tahoe Public Utility District (Electric)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Tahoe Public Utility District (Electric)</span>
                            <p className="text-xs text-green-600">Phone: (530) 587-3896 | www.tdpud.org</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Truckee Donner PUD (Water)')} onChange={(e) => handleUtilityCheck('Truckee Donner PUD (Water)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Truckee Donner PUD (Water)</span>
                            <p className="text-xs text-green-600">Phone: (530) 587-3896 | www.tdpud.org</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Southwest Gas (Gas)')} onChange={(e) => handleUtilityCheck('Southwest Gas (Gas)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Southwest Gas (Gas)</span>
                          <p className="text-xs text-green-600">Phone: (877) 860-6020 | www.swgas.com</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Tahoe Truckee Sierra Disposal (Trash)')} onChange={(e) => handleUtilityCheck('Tahoe Truckee Sierra Disposal (Trash)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Tahoe Truckee Sierra Disposal (Trash)</span>
                            <p className="text-xs text-green-600">Phone: (530) 583-7800 | www.tahoetruckeesierradisposal.com</p>
                          </div>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('NV Energy (Electric & Gas)')} onChange={(e) => handleUtilityCheck('NV Energy (Electric & Gas)', e.target.checked)} />
                          <div>
                            <span className="font-medium">NV Energy (Electric & Gas)</span>
                            <p className="text-xs text-green-600">Phone: (775) 834-4444 | www.nvenergy.com</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Truckee Meadows Water Authority (Water)')} onChange={(e) => handleUtilityCheck('Truckee Meadows Water Authority (Water)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Truckee Meadows Water Authority (Water)</span>
                            <p className="text-xs text-green-600">Phone: (775) 834-8080 | www.tmwa.com</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5" checked={currentLease?.terms?.checkedUtilities?.includes('Waste Management (Trash)')} onChange={(e) => handleUtilityCheck('Waste Management (Trash)', e.target.checked)} />
                          <div>
                            <span className="font-medium">Waste Management (Trash)</span>
                            <p className="text-xs text-green-600">Phone: (775) 329-8822 | www.wm.com</p>
                          </div>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <DocumentAttachments
              attachments={currentLease.attachments}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </div>
      </div>
    </div>
    );
  }

  // Dashboard — list of saved leases
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lease Builder Dashboard</h1>
          <button
            type="button"
            onClick={handleNewLease}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Lease
          </button>
        </div>

        <div className="space-y-6">
          {savedLeases.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Leases</h2>
                <div className="space-y-3">
                  {savedLeases.map((lease) => (
                    <div
                      key={lease.id}
                      onClick={() => handleLoadLease(lease)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{lease.property.address}</p>
                          <p className="text-sm text-gray-600">
                            {lease.property.city}, {lease.property.state}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lease.tenants.map(t => t.name).join(', ')} • {formatRentSummary(lease.terms)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(lease.createdAt).toLocaleDateString()}
                          </p>
                          <div className="mt-1">
                            {lease.landlordSignatures &&
                             lease.landlordSignatures.length === lease.landlords.length &&
                             lease.landlordSignatures.every(sig => sig !== undefined) &&
                             lease.tenantSignatures &&
                             lease.tenantSignatures.length === lease.tenants.length &&
                             lease.tenantSignatures.every(sig => sig !== undefined) ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Fully Signed
                              </span>
                            ) : (lease.landlordSignatures && lease.landlordSignatures.some(sig => sig !== undefined)) ||
                                  (lease.tenantSignatures && lease.tenantSignatures.some(sig => sig !== undefined)) ? (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Partially Signed
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Not Signed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leases yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first lease agreement</p>
              <button
                type="button"
                onClick={handleNewLease}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create New Lease
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}