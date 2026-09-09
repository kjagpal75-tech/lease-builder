import React, { useState, useEffect, useCallback } from 'react';
import { Property, MoveInChecklistData, MoveInChecklistItem, Attachment } from '@/types/lease';
import DocumentAttachments from './DocumentAttachments';

interface MoveInConditionChecklistProps {
  property: Property;
  initialData?: MoveInChecklistData;
  onSave?: (data: MoveInChecklistData) => void;
}

interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  garage: boolean;
  basement: boolean;
  fireplace: boolean;
  deck: boolean;
  pool: boolean;
}

const DEFAULT_DESCRIPTION = 'Click to add a description or notes about the condition of this item.';

const DEFAULT_FEATURES: PropertyFeatures = {
  bedrooms: 0,
  bathrooms: 0,
  kitchen: false,
  garage: false,
  basement: false,
  fireplace: false,
  deck: false,
  pool: false,
};

export default function MoveInConditionChecklist({ property, initialData, onSave }: MoveInConditionChecklistProps) {
  const [features, setFeatures] = useState<PropertyFeatures>(() => {
    if (initialData?.features) {
      return { ...DEFAULT_FEATURES, ...initialData.features };
    }
    return {
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      kitchen: property.kitchen || false,
      garage: property.garage || false,
      basement: property.basement || false,
      fireplace: property.fireplace || false,
      deck: property.deck || false,
      pool: property.pool || false,
    };
  });

  const [items, setItems] = useState<MoveInChecklistItem[]>([]);
  const [explanations, setExplanations] = useState<Record<string, string>>(
    initialData?.explanations || {}
  );
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  const generateItems = useCallback((feats: PropertyFeatures): MoveInChecklistItem[] => {
    const checklist: MoveInChecklistItem[] = [];
    let id = 0;

    // General
    checklist.push({ id: `g-${id++}`, category: 'General', item: 'Overall exterior condition', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: `g-${id++}`, category: 'General', item: 'Yard/garden condition', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: `g-${id++}`, category: 'General', item: 'Pest or rodent activity', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: `g-${id++}`, category: 'General', item: 'Mold or water damage visible', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: `g-${id++}`, category: 'General', item: 'Smoke/CO detector present and working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });

    // Bedrooms
    for (let i = 1; i <= feats.bedrooms; i++) {
      checklist.push({ id: `br-${i}-1`, category: `Bedroom ${i}`, item: 'Walls - no holes, cracks, or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-2`, category: `Bedroom ${i}`, item: 'Ceiling - no water stains or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-3`, category: `Bedroom ${i}`, item: 'Flooring - no stains, tears, or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-4`, category: `Bedroom ${i}`, item: 'Windows - glass intact, screens present', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-5`, category: `Bedroom ${i}`, item: 'Doors - locks and hinges working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-6`, category: `Bedroom ${i}`, item: 'Closet - rod and shelves intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-7`, category: `Bedroom ${i}`, item: 'Light fixtures and outlets working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `br-${i}-8`, category: `Bedroom ${i}`, item: 'Carpet/pad condition (if applicable)', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Bathrooms
    for (let i = 1; i <= feats.bathrooms; i++) {
      checklist.push({ id: `ba-${i}-1`, category: `Bathroom ${i}`, item: 'Toilet - bowl, seat, and tank working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-2`, category: `Bathroom ${i}`, item: 'Sink - faucet and drain working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-3`, category: `Bathroom ${i}`, item: 'Shower/tub - no cracks, grout intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-4`, category: `Bathroom ${i}`, item: 'Caulking - no mold or gaps', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-5`, category: `Bathroom ${i}`, item: 'Ventilation fan working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-6`, category: `Bathroom ${i}`, item: 'Mirrors and fixtures intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-7`, category: `Bathroom ${i}`, item: 'Floor - no tiles loose or cracked', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: `ba-${i}-8`, category: `Bathroom ${i}`, item: 'Towel bars and accessories secure', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Kitchen
    if (feats.kitchen) {
      checklist.push({ id: 'kt-1', category: 'Kitchen', item: 'Cabinets - doors and hinges intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-2', category: 'Kitchen', item: 'Countertops - no cracks or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-3', category: 'Kitchen', item: 'Sink - faucet and drain working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-4', category: 'Kitchen', item: 'Refrigerator - working and clean', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-5', category: 'Kitchen', item: 'Oven/stove - burners and oven working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-6', category: 'Kitchen', item: 'Microwave - working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-7', category: 'Kitchen', item: 'Dishwasher - working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-8', category: 'Kitchen', item: 'Backsplash - no damage or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-9', category: 'Kitchen', item: 'Flooring - no damage or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'kt-10', category: 'Kitchen', item: 'Garbage disposal - working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Living Areas
    checklist.push({ id: 'lv-1', category: 'Living Areas', item: 'Walls - no holes, cracks, or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-2', category: 'Living Areas', item: 'Ceiling - no water stains or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-3', category: 'Living Areas', item: 'Flooring - no stains, tears, or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-4', category: 'Living Areas', item: 'Windows - glass intact, screens present', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-5', category: 'Living Areas', item: 'Doors - locks and hinges working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-6', category: 'Living Areas', item: 'Light fixtures and outlets working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'lv-7', category: 'Living Areas', item: 'Baseboards - no damage or missing pieces', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });

    // Garage
    if (feats.garage) {
      checklist.push({ id: 'gr-1', category: 'Garage', item: 'Garage door - opener and manual working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'gr-2', category: 'Garage', item: 'Floor - no cracks or stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'gr-3', category: 'Garage', item: 'Walls - no damage or water stains', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'gr-4', category: 'Garage', item: 'Electrical outlets working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'gr-5', category: 'Garage', item: 'Storage areas - shelves and hooks intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Basement
    if (feats.basement) {
      checklist.push({ id: 'bs-1', category: 'Basement', item: 'Walls - no cracks, water stains, or dampness', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'bs-2', category: 'Basement', item: 'Floor - no cracks or water damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'bs-3', category: 'Basement', item: 'Sump pump - working (if applicable)', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'bs-4', category: 'Basement', item: 'HVAC vents and registers intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'bs-5', category: 'Basement', item: 'Electrical panel - accessible and labeled', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Fireplace
    if (feats.fireplace) {
      checklist.push({ id: 'fp-1', category: 'Fireplace', item: 'Firebox - no cracks or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'fp-2', category: 'Fireplace', item: 'Chimney damper - working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'fp-3', category: 'Fireplace', item: 'Fireplace door/glass - intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'fp-4', category: 'Fireplace', item: 'Screen or gate - secure', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Deck/Patio
    if (feats.deck) {
      checklist.push({ id: 'dk-1', category: 'Deck/Patio', item: 'Deck surface - no rot or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'dk-2', category: 'Deck/Patio', item: 'Railings - secure and intact', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'dk-3', category: 'Deck/Patio', item: 'Stairs - no loose boards', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'dk-4', category: 'Deck/Patio', item: 'Furniture - condition noted', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Pool
    if (feats.pool) {
      checklist.push({ id: 'pl-1', category: 'Pool', item: 'Pool shell - no cracks or damage', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'pl-2', category: 'Pool', item: 'Pool equipment - pump, filter, heater working', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'pl-3', category: 'Pool', item: 'Pool cover - working (if applicable)', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
      checklist.push({ id: 'pl-4', category: 'Pool', item: 'Safety features - fence, gate, alarms', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    }

    // Exterior
    checklist.push({ id: 'ex-1', category: 'Exterior', item: 'Roof - no missing shingles or leaks', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-2', category: 'Exterior', item: 'Gutters and downspouts - clear and secure', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-3', category: 'Exterior', item: 'Siding - no damage or peeling paint', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-4', category: 'Exterior', item: 'Foundation - no cracks or settling', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-5', category: 'Exterior', item: 'Driveway/walkways - no cracks or tripping hazards', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-6', category: 'Exterior', item: 'Mailbox - intact and secure', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });
    checklist.push({ id: 'ex-7', category: 'Exterior', item: 'Landscaping - condition noted', description: DEFAULT_DESCRIPTION, checked: false, attachments: [] });

    return checklist;
  }, []);

  // Initialize items from initialData or generate fresh
  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) {
      setItems(initialData.items);
    } else {
      setItems(generateItems(features));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate items when features change (only if no initial data was provided)
  useEffect(() => {
    if (!initialData?.items || initialData.items.length === 0) {
      setItems(generateItems(features));
    }
  }, [features, generateItems, initialData?.items]);

  const saveChecklistData = useCallback((updatedItems: MoveInChecklistItem[], updatedFeatures: PropertyFeatures, updatedExplanations: Record<string, string>, updatedAttachments: Attachment[]) => {
    if (onSave) {
      onSave({
        features: updatedFeatures,
        items: updatedItems,
        explanations: updatedExplanations,
        attachments: updatedAttachments,
      });
    }
  }, [onSave]);

  const toggleItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      saveChecklistData(updated, features, explanations, attachments);
      return updated;
    });
  };

  const updateExplanation = (id: string, explanation: string) => {
    setExplanations(prev => {
      const updated = { ...prev, [id]: explanation };
      saveChecklistData(items, features, updated, attachments);
      return updated;
    });
  };

  const updateItemDescription = (id: string, description: string) => {
    setItems(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, description } : item));
      saveChecklistData(updated, features, explanations, attachments);
      return updated;
    });
  };

  const updateFeatures = (newFeatures: Partial<PropertyFeatures>) => {
    const updated = { ...features, ...newFeatures };
    setFeatures(updated);
    if (initialData?.items && initialData.items.length > 0) {
      saveChecklistData(items, updated, explanations, attachments);
    }
  };

  const handleAttachmentsChange = (newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
    saveChecklistData(items, features, explanations, newAttachments);
  };

  const downloadReport = () => {
    let content = `# Move-In Condition Report\n\n`;
    content += `Property: ${property.address || ''} ${property.city || ''}, ${property.state || ''} ${property.zipCode || ''}\n`;
    content += `Bedrooms: ${features.bedrooms}\n`;
    content += `Bathrooms: ${features.bathrooms}\n`;
    content += `Kitchen: ${features.kitchen ? 'Yes' : 'No'}\n`;
    content += `Garage: ${features.garage ? 'Yes' : 'No'}\n`;
    content += `Basement: ${features.basement ? 'Yes' : 'No'}\n`;
    content += `Fireplace: ${features.fireplace ? 'Yes' : 'No'}\n`;
    content += `Deck: ${features.deck ? 'Yes' : 'No'}\n`;
    content += `Pool: ${features.pool ? 'Yes' : 'No'}\n`;
    content += `\nDate: ${new Date().toLocaleDateString()}\n\n`;
    content += `---\n\n`;

    const categories: Record<string, MoveInChecklistItem[]> = {};
    items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    Object.entries(categories).forEach(([category, catItems]) => {
      content += `## ${category}\n\n`;
      catItems.forEach(item => {
        const mark = item.checked ? '[X]' : '[ ]';
        content += `${mark} ${item.item}\n`;
        if (item.description && item.description !== DEFAULT_DESCRIPTION) {
          content += `   Description: ${item.description}\n`;
        }
        if (!item.checked && explanations[item.id]) {
          content += `   Note: ${explanations[item.id]}\n`;
        }
      });
      content += '\n';
    });

    content += `\n---\n\n`;
    content += `## SIGNATURES\n\n`;
    content += `By signing below, both parties acknowledge they have reviewed the condition checklist and agree on the documented condition of the property.\n\n`;
    
    // Landlord signatures (2)
    content += `### LANDLORD SIGNATURES\n\n`;
    content += `Landlord 1 Signature: ________________________\n`;
    content += `Landlord 1 Name: ________________________\n`;
    content += `Landlord 1 Date: ________________________\n\n`;
    content += `Landlord 2 Signature: ________________________\n`;
    content += `Landlord 2 Name: ________________________\n`;
    content += `Landlord 2 Date: ________________________\n\n`;
    
    // Tenant signatures (5)
    content += `### TENANT SIGNATURES\n\n`;
    content += `Tenant 1 Signature: ________________________\n`;
    content += `Tenant 1 Name: ________________________\n`;
    content += `Tenant 1 Date: ________________________\n\n`;
    content += `Tenant 2 Signature: ________________________\n`;
    content += `Tenant 2 Name: ________________________\n`;
    content += `Tenant 2 Date: ________________________\n\n`;
    content += `Tenant 3 Signature: ________________________\n`;
    content += `Tenant 3 Name: ________________________\n`;
    content += `Tenant 3 Date: ________________________\n\n`;
    content += `Tenant 4 Signature: ________________________\n`;
    content += `Tenant 4 Name: ________________________\n`;
    content += `Tenant 4 Date: ________________________\n\n`;
    content += `Tenant 5 Signature: ________________________\n`;
    content += `Tenant 5 Name: ________________________\n`;
    content += `Tenant 5 Date: ________________________\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `move-in-condition-report-${property.address?.replace(/\s+/g, '-') || 'property'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    const html = '<html><head><meta charset="UTF-8"><title>Report</title></head><body><h1>Move-In Condition Report</h1><p>Property: ' + (property.address || '') + '</p></body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const itemsByCategory: Record<string, MoveInChecklistItem[]> = {};
  items.forEach(item => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Move-In Condition Checklist</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadReport}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download as TXT
          </button>
          <button
            onClick={downloadAsPDF}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Preview as PDF
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Property Features</h3>
        <p className="text-xs text-gray-600 mb-3">Enter your property details to build the checklist template.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Bedrooms</label>
            <input
              type="number"
              min={0}
              max={10}
              value={features.bedrooms}
              onChange={e => updateFeatures({ bedrooms: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Bathrooms</label>
            <input
              type="number"
              min={0}
              max={10}
              value={features.bathrooms}
              onChange={e => updateFeatures({ bathrooms: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="kitchen"
              checked={features.kitchen}
              onChange={e => updateFeatures({ kitchen: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="kitchen" className="text-xs text-gray-700">Kitchen</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="garage"
              checked={features.garage}
              onChange={e => updateFeatures({ garage: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="garage" className="text-xs text-gray-700">Garage</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="basement"
              checked={features.basement}
              onChange={e => updateFeatures({ basement: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="basement" className="text-xs text-gray-700">Basement</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fireplace"
              checked={features.fireplace}
              onChange={e => updateFeatures({ fireplace: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="fireplace" className="text-xs text-gray-700">Fireplace</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deck"
              checked={features.deck}
              onChange={e => updateFeatures({ deck: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="deck" className="text-xs text-gray-700">Deck</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pool"
              checked={features.pool}
              onChange={e => updateFeatures({ pool: e.target.checked })}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="pool" className="text-xs text-gray-700">Pool</label>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        This checklist is generated based on your property features. Check off items as you complete them.
      </p>

      <div className="space-y-4">
        {Object.entries(itemsByCategory).map(([category, catItems]) => (
          <div key={category} className="border border-gray-200 rounded-md p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{category}</h3>
            <ul className="space-y-2 w-full">
              {catItems.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.item}
                    </span>
                  </div>
                  <textarea
                    value={item.description}
                    onChange={e => updateItemDescription(item.id, e.target.value)}
                    placeholder="Add a description for this item..."
                    className="ml-6 w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-y"
                    rows={2}
                  />
                  <div className="ml-6 flex items-center gap-2 mt-1">
                    <label className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200">
                      + Attach Photo
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const newAtt: Attachment = {
                                data: reader.result as string,
                                filename: file.name,
                                title: file.name,
                              };
                              const updated = items.map(it =>
                                it.id === item.id
                                  ? { ...it, attachments: [...it.attachments, newAtt] }
                                  : it
                              );
                              setItems(updated);
                              saveChecklistData(updated, features, explanations, attachments);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {item.attachments.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {item.attachments.length} attached
                      </span>
                    )}
                  </div>
                  {item.attachments.length > 0 && (
                    <div className="ml-6 flex gap-2 flex-wrap">
                      {item.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.data}
                          download={att.filename}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {att.title || att.filename}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
        <p className="font-semibold mb-1">Important:</p>
        <p>Complete this checklist together with the landlord/property manager before move-in. Both parties should sign the report to document the property condition. This protects both the tenant and landlord regarding security deposit deductions.</p>
      </div>

      <div className="mt-4">
        <DocumentAttachments
          attachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
        />
      </div>
    </div>
  );
}
