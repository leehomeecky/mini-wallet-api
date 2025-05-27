import { PAYSTACK_BASE_URL, PAYSTACK_SECRET_KEY } from '../config';
import {
  Currency,
  PaystackAccountVerification,
  PaystackBank,
  PaystackRecipientResponse,
  PaystackTransferResponse,
  PaystackTransferVerification,
} from '../interfaces';
import { axiosRequest } from './common.util';

export interface IPaystackUtil {
  createTransferRecipient(args: {
    name: string;
    bankCode: string;
    currency?: Currency;
    accountNumber: string;
  }): Promise<PaystackRecipientResponse>;

  initiateTransfer(
    amount: number,
    recipientCode: string,
    reason?: string
  ): Promise<PaystackTransferResponse>;

  listBanks(): Promise<PaystackBank[]>;

  verifyAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<PaystackAccountVerification>;

  verifyTransfer(reference: string): Promise<PaystackTransferVerification>;
}

export class PaystackUtil implements IPaystackUtil {
  private readonly baseUrl = PAYSTACK_BASE_URL;

  private readonly paths = {
    listBanks: 'bank',
    initiateTransfer: 'transfer',
    verifyAccount: 'bank/resolve',
    verifyTransfer: 'transfer/verify',
    createRecipient: 'transferrecipient',
  };

  private readonly defaultHeader = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  private request = axiosRequest(this.defaultHeader, undefined, this.baseUrl);

  async createTransferRecipient(args: {
    name: string;
    bankCode: string;
    currency?: Currency;
    accountNumber: string;
  }): Promise<PaystackRecipientResponse> {
    const { name, accountNumber, bankCode, currency } = args;
    const result: PaystackRecipientResponse = await this.request(
      this.paths.createRecipient,
      {
        name,
        type: 'nuban',
        bank_code: bankCode,
        account_number: accountNumber,
        currency: currency || Currency.NGN,
      },
      'POST'
    );

    return result;
  }

  async initiateTransfer(
    amount: number,
    recipientCode: string,
    reason?: string
  ): Promise<PaystackTransferResponse> {
    const result: PaystackTransferResponse = await this.request(
      this.paths.initiateTransfer,
      {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reason,
      },
      'POST'
    );

    return result;
  }

  async listBanks(): Promise<PaystackBank[]> {
    const result: PaystackBank[] = await this.request(
      this.paths.listBanks,
      {},
      'GET'
    );

    return result;
  }

  async verifyAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<PaystackAccountVerification> {
    const result: PaystackAccountVerification = await this.request(
      this.paths.verifyAccount,
      { account_number: accountNumber, bank_code: bankCode },
      'GET'
    );

    return result;
  }

  async verifyTransfer(
    reference: string
  ): Promise<PaystackTransferVerification> {
    const result: PaystackTransferVerification = await this.request(
      `${this.paths.verifyTransfer}/${reference}`,
      {},
      'GET'
    );

    return result;
  }
}
