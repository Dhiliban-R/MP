export type UserRole = 'admin' | 'donor' | 'recipient';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface User {
  emailVerified: boolean;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organizationName?: string;
  phoneNumber?: string;
  address?: Address;
  createdAt: Date;
  lastLogin: Date;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  getIdToken: () => Promise<string>;
}
