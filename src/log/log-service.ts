import axios from 'axios';

const API_PATH = process.env.REACT_APP_LOG_ENDPOINT_URI;
const BEARER_TOKEN = process.env.REACT_APP_LOG_API_KEY;

export type LogRequest = {
  level?: 'error' | 'warn' | 'info' | 'debug';
  event?: string;
  page?: string;
  message: string;
  resourceCount?: any;
}

export type LogResponse = {
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly body: any;
}

export const doLog = async (request: LogRequest): Promise<LogResponse | null> => {
  // Determine if logging
  const isLogging = process.env.REACT_APP_LOG_ENABLED && process.env.REACT_APP_LOG_ENABLED === 'true'
  if (!isLogging) {
    return null
  }

  // We are logging...
  const url = `${API_PATH}/log/do-log`
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    }

    const response = await axios.post(url, request, config)
    return (response.data)
  } catch (error) {
    // Should continue with the app even if logging fails
    console.error(error);
    return ({
      url: '/log/do-log',
      ok: false,
      status: 0,
      statusText: 'Error',
      body: error
    })
  }
}
