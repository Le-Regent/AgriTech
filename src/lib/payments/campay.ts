const CAMPAY_BASE_URL = process.env.CAMPAY_ENVIRONMENT === 'prod' 
  ? 'https://www.campay.net/api' 
  : 'https://demo.campay.net/api';

export async function getCampayToken() {
  // If a permanent token is provided, use it directly
  if (process.env.CAMPAY_PERMANENT_TOKEN) {
    return process.env.CAMPAY_PERMANENT_TOKEN;
  }

  const response = await fetch(`${CAMPAY_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.CAMPAY_APP_USERNAME,
      password: process.env.CAMPAY_APP_PASSWORD,
    }),
  });
  
  if (!response.ok) {
    const err = await response.text();
    console.error('Campay Auth Error:', err);
    throw new Error('Failed to get Campay token');
  }
  const data = await response.json();
  return data.token;
}

export async function initiateCollect(amount: number, phoneNumber: string, externalId: string) {
  const token = await getCampayToken();
  const response = await fetch(`${CAMPAY_BASE_URL}/collect/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XAF',
      from: phoneNumber,
      description: `Payment for Order ${externalId}`,
      external_reference: externalId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Campay Collect Error:', error);
    throw new Error(`Failed to initiate collect: ${error}`);
  }
  return response.json();
}

export async function checkTransactionStatus(reference: string) {
  const token = await getCampayToken();
  const response = await fetch(`${CAMPAY_BASE_URL}/transaction/${reference}/`, {
    headers: {
      'Authorization': `Token ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to check transaction status');
  return response.json();
}

export async function initiateWithdrawal(amount: number, phoneNumber: string, externalId: string) {
  const token = await getCampayToken();
  const response = await fetch(`${CAMPAY_BASE_URL}/withdraw/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XAF',
      to: phoneNumber,
      description: `Withdrawal for Order ${externalId}`,
      external_reference: externalId,
    }),
  });

  if (!response.ok) throw new Error('Failed to initiate withdrawal');
  return response.json();
}
