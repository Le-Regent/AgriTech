/**
 * AI Error Helper
 * Normalizes Gemini API and model errors on the server side to protect secrets 
 * while returning highly clear, descriptive, and actionable error messages to the frontend.
 */
export interface FriendlyAiError {
  error: string;
  friendlyMessage: string;
  isQuotaExceeded: boolean;
  code: string;
  status: number;
  technicalDetails?: string;
}

export function getFriendlyAiError(error: any): FriendlyAiError {
  // Try to extract text logs from error
  let errorMsg = '';
  try {
    if (typeof error === 'object' && error !== null) {
      errorMsg = error.message || error.statusText || JSON.stringify(error);
    } else {
      errorMsg = String(error);
    }
  } catch (err) {
    errorMsg = 'Unknown AI generation error';
  }

  // Debug logging but keep logs clean
  console.error('[AI Error Helper - Original Matcher]:', error);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let friendlyMessage = 'An unexpected error occurred in our AI analysis service. Please try retrying in a moment.';
  let mainError = 'AI Service Encountered an Issue';

  // 1. Quota Exceeded / Rate Limit Errors
  if (
    errorMsg.includes('429') ||
    errorMsg.includes('RESOURCE_EXHAUSTED') ||
    errorMsg.includes('quota') ||
    errorMsg.includes('rate limit') ||
    errorMsg.includes('exceeded') ||
    errorMsg.includes('exhausted') ||
    error.status === 429 ||
    error.statusCode === 429
  ) {
    status = 429;
    code = 'RESOURCE_EXHAUSTED';
    mainError = 'AI Clinic is Fully Booked (Quota Reached)';
    friendlyMessage = 'Our free-tier AI consultation service has reached its temporary request limit. Please wait 30 to 45 seconds while the engine cools down, and then tap analyze/generate again.';
  }
  // 2. Invalid API Key
  else if (
    errorMsg.includes('API_KEY_INVALID') ||
    errorMsg.includes('API key not valid') ||
    errorMsg.includes('not valid API key') ||
    errorMsg.includes('invalid key') ||
    error.status === 401
  ) {
    status = 401;
    code = 'API_KEY_INVALID';
    mainError = 'Invalid API Credentials';
    friendlyMessage = 'The AI server credentials are misconfigured. If you are the system administrator, please verify your GEMINI_API_KEY in Settings.';
  }
  // 3. Flagged Content / Safety Policies
  else if (
    errorMsg.includes('safety') ||
    errorMsg.includes('blocked') ||
    errorMsg.includes('SAFETY') ||
    errorMsg.includes('candidate') // blocked by candidate safety filters
  ) {
    status = 400;
    code = 'SAFETY_BLOCKED';
    mainError = 'Content Filter Notice';
    friendlyMessage = 'The uploaded leaf image or prompt was flagged by the automated safety system. Please retry with a clear, direct, well-lit photo of plant leaves or agricultural crops.';
  }
  // 4. Missing API Key on server setup
  else if (
    errorMsg.includes('not configured') ||
    errorMsg.includes('missing API key') ||
    errorMsg.includes('API key is not configured')
  ) {
    status = 500;
    code = 'API_KEY_MISSING';
    mainError = 'AI Server Setup Required';
    friendlyMessage = 'The Google Gemini API key is missing on the server. Please add your GEMINI_API_KEY under Settings or in your .env configuration.';
  }

  return {
    error: mainError,
    friendlyMessage,
    isQuotaExceeded: status === 429,
    code,
    status,
    technicalDetails: errorMsg.substring(0, 400) // Keep the original error snippet under 400 chars for developer inspections
  };
}
