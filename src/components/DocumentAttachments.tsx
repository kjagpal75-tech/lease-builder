'use client';

import { useState, useRef } from 'react';
import { Attachment } from '@/types/lease';

interface DocumentAttachmentsProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export default function DocumentAttachments({ 
  attachments, 
  onAttachmentsChange 
}: DocumentAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Convert file to base64 for local storage
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const base64 = await base64Promise;
        newAttachments.push({
          data: base64,
          filename: file.name,
          title: file.name,
        });
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const updateTitle = (index: number, value: string) => {
    const updated = [...attachments];
    updated[index] = { ...updated[index], title: value };
    onAttachmentsChange(updated);
  };

  const downloadAttachment = (attachment: Attachment, index: number) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.filename || `attachment-${index + 1}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const getFileInfo = (base64: string) => {
    const matches = base64.match(/^data:([^;]+);base64,/);
    if (matches && matches[1]) {
      const mimeType = matches[1];
      const size = Math.round((base64.length * 3) / 4) - 2; // Approximate size
      const sizeKB = (size / 1024).toFixed(2);
      return { type: mimeType, size: `${sizeKB} KB` };
    }
    return { type: 'Unknown', size: 'Unknown' };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Document Attachments</h3>
      
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Add Attachments'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB per file)
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Attached Documents ({attachments.length})</h4>
          {attachments.map((attachment, index) => {
            const info = getFileInfo(attachment.data);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={attachment.title}
                      onChange={(e) => updateTitle(index, e.target.value)}
                      className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Document title"
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate" title={attachment.filename}>
                    File: {attachment.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {info.type} • {info.size}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(attachment.data)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(attachment, index)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h4 className="font-semibold">Document Preview</h4>
              <button onClick={() => setPreviewUrl(null)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe src={previewUrl} className="w-full h-[84vh]" title="Preview" />
            </div>
          </div>
        </div>
      )}
      {attachments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs mt-1">Click "Add Attachments" to upload supporting documents</p>
        </div>
      )}
    </div>
  );
}
