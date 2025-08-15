const userAgentTemplates: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_{RAND}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.{RAND} Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 13; Pixel {RAND}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_{RAND} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.{RAND} Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{FIREFOX_VERSION}) Gecko/20100101 Firefox/{FIREFOX_VERSION}",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Safari/537.36"
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomUserAgent(): string {
  const chromeVersion = `${getRandomInt(113, 120)}.0.${getRandomInt(5000, 5999)}.${getRandomInt(100, 999)}`;
  const firefoxVersion = `${getRandomInt(100, 120)}.0`;
  const rand = getRandomInt(1, 9);

  return getRandom(userAgentTemplates)
    .replace(/{CHROME_VERSION}/g, chromeVersion)
    .replace(/{FIREFOX_VERSION}/g, firefoxVersion)
    .replace(/{RAND}/g, String(rand));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithProxy(
  url: string,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    const userAgent = generateRandomUserAgent();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Connection": "keep-alive"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      console.log(`✅ Success | UA: ${userAgent}`);
      return response;
    } catch (error: any) {
      console.warn(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
      lastError = error;
      attempt++;
      if (attempt < maxRetries) {
        await delay(retryDelay);
      }
    }
  }

  throw lastError;
}