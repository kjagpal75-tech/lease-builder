import { LandlordProfile, Party } from '@/types/lease';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'lease_builder_landlord_profiles';

export const landlordProfilesService = {
  getAll(): LandlordProfile[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading landlord profiles:', error);
      return [];
    }
  },

  save(profile: Partial<LandlordProfile> & { id?: string }): LandlordProfile {
    const profiles = landlordProfilesService.getAll();
    const now = new Date().toISOString();
    const existingIndex = profile.id ? profiles.findIndex((p) => p.id === profile.id) : -1;

    const saved: LandlordProfile = {
      id: profile.id || uuidv4(),
      name: profile.name || '',
      address: profile.address || '',
      phone: profile.phone || '',
      email: profile.email || '',
      createdAt: existingIndex >= 0 ? profiles[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = saved;
    } else {
      profiles.push(saved);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return saved;
  },

  delete(id: string): void {
    const filtered = landlordProfilesService.getAll().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getById(id: string): LandlordProfile | null {
    return landlordProfilesService.getAll().find((p) => p.id === id) || null;
  },

  toParty(profile: LandlordProfile): Party {
    return {
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
    };
  },
};