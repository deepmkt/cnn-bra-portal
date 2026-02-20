import axios from "axios";

const SENDPULSE_API_URL = "https://api.sendpulse.com";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Authenticate with SendPulse API and get an access token.
 * Tokens are cached until they expire.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SendPulse credentials not configured (SENDPULSE_CLIENT_ID / SENDPULSE_CLIENT_SECRET)");
  }

  const response = await axios.post(`${SENDPULSE_API_URL}/oauth/access_token`, {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  cachedToken = response.data.access_token;
  // Token expires in 1 hour, refresh 5 minutes early
  tokenExpiry = now + (response.data.expires_in - 300) * 1000;

  return cachedToken!;
}

/**
 * Get all address books (mailing lists) from SendPulse.
 */
export async function getAddressBooks(): Promise<any[]> {
  const token = await getAccessToken();
  const response = await axios.get(`${SENDPULSE_API_URL}/addressbooks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Create a new address book (mailing list) in SendPulse.
 */
export async function createAddressBook(name: string): Promise<{ id: number }> {
  const token = await getAccessToken();
  const response = await axios.post(
    `${SENDPULSE_API_URL}/addressbooks`,
    { bookName: name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Get or create the CNN BRA Newsletter address book.
 */
let cachedBookId: number | null = null;

export async function getOrCreateNewsletterBook(): Promise<number> {
  // Check env first
  const envBookId = process.env.SENDPULSE_ADDRESS_BOOK_ID;
  if (envBookId) return parseInt(envBookId, 10);

  if (cachedBookId) return cachedBookId;

  const books = await getAddressBooks();
  const existing = books.find((b: any) => b.name === "CNN BRA Newsletter");
  if (existing) {
    cachedBookId = existing.id;
    return cachedBookId!;
  }

  const created = await createAddressBook("CNN BRA Newsletter");
  cachedBookId = created.id;
  return cachedBookId!;
}

/**
 * Add a subscriber to the CNN BRA Newsletter address book.
 */
export async function addSubscriber(email: string, name: string): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getAccessToken();
    const bookId = await getOrCreateNewsletterBook();

    const response = await axios.post(
      `${SENDPULSE_API_URL}/addressbooks/${bookId}/emails`,
      {
        emails: [
          {
            email,
            variables: {
              Nome: name,
              Source: "CNN BRA Portal",
              SubscribedAt: new Date().toISOString(),
            },
          },
        ],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, message: "Subscriber added to SendPulse" };
  } catch (error: any) {
    console.error("[SendPulse] Failed to add subscriber:", error?.response?.data || error.message);
    return { success: false, message: error?.response?.data?.message || error.message };
  }
}

/**
 * Validate SendPulse credentials by attempting to get an access token.
 */
export async function validateCredentials(): Promise<{ valid: boolean; message: string }> {
  try {
    const token = await getAccessToken();
    if (token) {
      return { valid: true, message: "SendPulse credentials are valid" };
    }
    return { valid: false, message: "Failed to obtain access token" };
  } catch (error: any) {
    return { valid: false, message: error?.response?.data?.error_description || error.message };
  }
}
