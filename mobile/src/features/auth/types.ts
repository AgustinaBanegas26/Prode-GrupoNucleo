export type CustomerNumber = string;

export type AuthUser = {
  customerNumber: CustomerNumber;
  email: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  customerNumber: CustomerNumber;
  password: string;
};

export type CreatePasswordInput = {
  customerNumber: CustomerNumber;
  email: string;
  password: string;
};

export type RequestPasswordResetInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
};

