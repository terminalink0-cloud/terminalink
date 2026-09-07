export interface Driver {
  id: string;

  licenseNumber: string;
  licenseExpiry: string;

  emergencyContact: string;
  emergencyPhone: string;

  isActive: boolean;

  user?: {
    id: string;
    username: string;
    displayName: string;
    phone?: string;
  };
}