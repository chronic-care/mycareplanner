import axios from 'axios';

const API_PATH = process.env.REACT_APP_LOG_ENDPOINT_URI;
const BEARER_TOKEN = process.env.REACT_APP_LOG_API_KEY;

export type LogRequest = {
  level?: 'error' | 'warn' | 'info' | 'debug';
  event?: string;
  page?: string;
  message: string;
}

export type LogResponse = {
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly body: any;
}

export const doLog = async (request: LogRequest): Promise<LogResponse> => new Promise(async (resolve) => {
  const url = `${API_PATH}/log/do-log`;
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    }

    const response = await axios.post(url, request, config);
    console.log("Checking logging by Sai");
    resolve(response.data)
  } catch (error) {
    // Should continue with the app even if logging fails
    console.error(error);
    resolve({
      url: '/log/do-log',
      ok: false,
      status: 0,
      statusText: 'Error',
      body: error
    })
  }
})
