import * as bcrypt from 'bcrypt';
import axios from 'axios';
import * as qs from 'querystring';
import { DEFAULT_SALT_ROUND } from '../constant';

export const hashValue = async (data: {
  value: string;
  saltRounds?: number;
}): Promise<string> => {
  const { value, saltRounds } = data;

  return await bcrypt.hash(value, saltRounds || DEFAULT_SALT_ROUND);
};

export const generateToken = (length: number): string => {
  const minArray = Array(length).fill(0);
  const maxArray = Array(length + 1).fill(0);
  minArray[0] = maxArray[0] = 1;
  const minVal = minArray.join('');
  const maxVal = maxArray.join('');
  return (Math.random() * (+maxVal - +minVal) + +minVal).toFixed(0);
};

export const generateRandomString = (data: {
  size: number;
  withSpecials?: boolean;
}): string => {
  const { size, withSpecials } = data;
  let result = '';
  let maxCount = size * 3;

  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (withSpecials) characters = characters.concat('*^%$&#@)(<>/?:-');

  const charactersLength = characters.length - 1;

  const getRandomChar = () =>
    characters.charAt(Math.floor(Math.random() * charactersLength));

  while (result.length < size && maxCount > 0) {
    --maxCount;
    result += getRandomChar();
  }

  return result;
};

export const generateTransactionRef = (): string => {
  const timestamp = Date.now();
  return `TRX_${timestamp}_${generateRandomString({ size: 6 })}`;
};

export function axiosRequest(
  defaultHeader = {},
  options?: { isEncodedParams?: boolean },
  baseUrl?: string
) {
  return (
    url,
    payload = {},
    method: 'POST' | 'GET' | 'PUT' = 'GET',
    header?: Record<string, any>
  ) => {
    console.log('method: ', method);
    console.log(
      'payload: ',
      options?.isEncodedParams ? qs.stringify(payload) : payload
    );
    console.log('header: ', Object.assign(defaultHeader, header || {}));

    if (baseUrl) {
      baseUrl = baseUrl.trim().replace(/\/$/, '');
      url = url.trim().replace(/^\//, '');
      url = `${baseUrl}/${url}`;
    }

    if (/GET/g.test(method)) {
      const genUrl = () => {
        const payloadKeys = Object.keys(payload);
        return payloadKeys.length === 0
          ? url
          : payloadKeys.reduce(
              (initial, val, index) =>
                `${initial}${val}=${payload[val]}${
                  index === payloadKeys.length - 1 ? '' : '&'
                }`,
              `${url}?`
            );
      };

      url = genUrl();
      console.log('URL: ', url);
      return axios({
        url,
        method,
        headers: Object.assign(defaultHeader, header || {}),
        timeout: 140000,
      })
        .then((jsonResponse) => {
          return jsonResponse?.data;
        })
        .catch((exp) => console.log('ERROR: ', exp));
    } else if (method === 'PUT') {
      console.log('URL: ', url);
      return axios({
        url,
        method,
        data: payload,
        headers: Object.assign(defaultHeader, header || {}),
        timeout: 140000,
      })
        .then((jsonResponse) => {
          return jsonResponse?.data;
        })
        .catch((exp) => console.log('ERROR: ', exp));
    } else {
      console.log('URL: ', url);
      return axios({
        url,
        method,
        data: options?.isEncodedParams ? qs.stringify(payload) : payload,
        headers: Object.assign(defaultHeader, header || {}),
        timeout: 140000,
      })
        .then((jsonResponse) => {
          return jsonResponse?.data;
        })
        .catch((exp) => console.log('ERROR: ', { ...exp }));
    }
  };
}
