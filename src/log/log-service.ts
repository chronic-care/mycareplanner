import axios from 'axios';
import { getSessionId, isSessionId, saveSessionId } from '../data-services/persistenceService';

const API_PATH = process.env.REACT_APP_LOG_ENDPOINT_URI;
const BEARER_TOKEN = process.env.REACT_APP_LOG_API_KEY;

export type LogRequest = {
  level?: 'error' | 'warn' | 'info' | 'debug';
  event?: string;
  page?: string;
  message: string;
  resourceCount?: number;
  sessionId?: string;
}

export type LogResponse = {
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly body: any;
}

// Variable to store the session ID
let sessionId: string | null = null;

const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const initializeSession = (): string => {
  sessionId = generateSessionId();
  return sessionId;
}

export const clearSession = (): void => {
  sessionId = null;
}

const ensureSessionId = async (): Promise<void> => {
  if (await isSessionId()) {
    const retrievedSessionId = await getSessionId();
    if (retrievedSessionId) {
      sessionId = retrievedSessionId;
    }
  } else {
    sessionId = initializeSession();
    await saveSessionId(sessionId);
  }
}

export const doLog = async (request: LogRequest): Promise<LogResponse | null> => {
  const isLoggingEnabled = process.env.REACT_APP_LOG_ENABLED === 'true';
  if (!isLoggingEnabled) {
    return null;
  }

  await ensureSessionId();

  if (!sessionId) {
    console.error('Session ID is not initialized. Make sure to call initializeSession() on user login.');
    return null;
  }

  const url = `${API_PATH}/log/do-log`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  };

  const logRequest = { ...request, sessionId };

  try {
    const response = await axios.post(url, logRequest, config);
    return response.data as LogResponse;
  } catch (error) {
    console.error('Error logging event:', error);
    return {
      url: '/log/do-log',
      ok: false,
      status: 0,
      statusText: 'Error',
      body: error
    } as LogResponse;
  }
}
