import axios from "axios";
import http from "http";
import https from "https";

const API_URL = "https://anabot.my.id/api/search/pinterest";
const API_KEY = "freeApikey";

const DEFAULT_PINTEREST_QUERIES = ["cyrene honkai star rail icon", "Japonesas icon"];

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

const client = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
});

const CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map<string, { urls: string[]; expires: number }>();

function pickRandomQuery(): string {
  const queries = global.pinterestQueries?.length ? global.pinterestQueries : DEFAULT_PINTEREST_QUERIES;
  return queries[Math.floor(Math.random() * queries.length)];
}

function pickImageUrl(pin: any): string {
  return pin?.images?.["736x"]?.url || pin?.images?.["345x"]?.url || pin?.images?.["236x"]?.url || "";
}

function getFromCache(query: string): string[] | undefined {
  const entry = searchCache.get(query);
  if (entry && entry.expires > Date.now()) {
    return entry.urls;
  }
  if (entry) searchCache.delete(query);
  return undefined;
}

export async function searchPinterestImages(query: string = pickRandomQuery()): Promise<string[]> {
  const cached = getFromCache(query);
  if (cached) return cached;

  const { data } = await client.get(`${API_URL}?query=${encodeURIComponent(query)}&apikey=${API_KEY}`);

  if (!data?.success || !data?.data?.result?.length) {
    throw new Error(`Pinterest no devolvió resultados para "${query}"`);
  }

  const urls: string[] = data.data.result.map(pickImageUrl).filter((u: string) => !!u);

  if (!urls.length) {
    throw new Error(`Pinterest no devolvió imágenes válidas para "${query}"`);
  }

  searchCache.set(query, { urls, expires: Date.now() + CACHE_TTL_MS });

  return urls;
}

async function downloadImageBuffer(url: string): Promise<Buffer> {
  const res = await client.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

export async function getRandomPinterestImage(
  query: string = pickRandomQuery()
): Promise<{ buffer: Buffer; url: string }> {
  const urls = await searchPinterestImages(query);
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];
  const buffer = await downloadImageBuffer(randomUrl);
  return { buffer, url: randomUrl };
}

export async function fetchRandomPinterestImage(query: string = pickRandomQuery()): Promise<Buffer> {
  const { buffer } = await getRandomPinterestImage(query);
  return buffer;
}
