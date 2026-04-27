import axios from 'axios';

const GLOBAL_CONFIG_KEY = '__otakudesuAxiosConfigured__';

const globalState = globalThis as typeof globalThis & {
  [GLOBAL_CONFIG_KEY]?: boolean;
};

if (!globalState[GLOBAL_CONFIG_KEY]) {
  const resolvedBaseUrl = process.env.BASEURL?.replace(/\/+$/, '') || 'https://otakudesu.blog';
  process.env.BASEURL = resolvedBaseUrl;

  const baseUrl = resolvedBaseUrl;
  const timeout = Number(process.env.REQUEST_TIMEOUT_MS || '15000');

  axios.defaults.timeout = Number.isFinite(timeout) ? timeout : 15000;
  axios.defaults.maxRedirects = 5;
  axios.defaults.headers.common['User-Agent'] =
    process.env.REQUEST_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  axios.defaults.headers.common.Accept =
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
  axios.defaults.headers.common['Accept-Language'] = 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7';
  axios.defaults.headers.common.Referer = `${baseUrl}/`;

  console.log(`[scraper] BASEURL=${baseUrl}`);

  globalState[GLOBAL_CONFIG_KEY] = true;
}

export default axios;