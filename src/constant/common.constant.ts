import { ITrxCharges } from '../interfaces';

export const DEFAULT_LIMIT = 50;
export const DEFAULT_SALT_ROUND = 10;
export const DEFAULT_INTERNAL_TRX_CHARGES: ITrxCharges = {
  vat: 5,
  fees: 5,
  stampDuty: 40,
};
export const DEFAULT_EXTERNAL_TRX_CHARGES: ITrxCharges = {
  vat: 10,
  fees: 10,
  stampDuty: 50,
};
