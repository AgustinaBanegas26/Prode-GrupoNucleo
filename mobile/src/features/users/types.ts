export type UserStatus = 'active' | 'inactive' | 'blocked';

export type UserRole = 'user' | 'admin';

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  customerNumber: string;
  status: UserStatus;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
};

export type StoredUser = AppUser & {
  password: string;
};

