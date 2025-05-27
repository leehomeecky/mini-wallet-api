export interface PaystackRecipientResponse {
  id: number;
  name: string;
  type: string;
  domain: string;
  active: boolean;
  currency: string;
  integration: number;
  recipient_code: string;

  details: {
    bank_code: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    authorization_code?: string;
  };
}

export interface PaystackTransferResponse {
  id: number;
  amount: number;
  source: string;
  status: string;
  reason: string;
  currency: string;
  createdAt: string;
  recipient: number;
  reference: string;
  transfer_code: string;
}

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  type?: string;
  active: boolean;
  country: string;
  gateway?: string;
  currency: string;
  longcode?: string;
  pay_with_bank?: boolean;
}

export interface PaystackAccountVerification {
  account_name: string;
  account_number: string;
}

export interface PaystackTransferVerification {
  status: string;
  amount: number;
  reason: string;
  currency: string;
  reference: string;
  transfer_code: string;

  recipient: {
    type: string;
    name: string;
    recipient_code: string;
  };
}
