import axios from "axios";

const API_URL = "https://anabot.my.id/api/search/pinterest";
const API_KEY = "freeApikey";

const DEFAULT_PINTEREST_QUERIES = ["cyrene honkai star rail icon", "Japonesas icon"];

function pickRandomQuery(): string {
  const queries = global.pinterestQueries?.length ? global.pinterestQueries : DEFAULT_PINTEREST_QUERIES;
  return queries[Math.floor(Math.random() * queries.length)];
}

function pickImageUrl(pin: any): string {
  return pin?.images?.["736x"]?.url || pin?.images?.["345x"]?.url || pin?.images?.["236x"]?.url || "";
}

export async function searchPinterestImages(query: string = pickRandomQuery()): Promise<string[]> {
  const { data } = await axios.get(`${API_URL}?query=${encodeURIComponent(query)}&apikey=${API_KEY}`, {
    timeout: 15000,
  });

  if (!data?.success || !data?.data?.result?.length) {
    throw new Error(`Pinterest no devolvió resultados para "${query}"`);
  }

  const urls: string[] = data.data.result.map(pickImageUrl).filter((u: string) => !!u);

  if (!urls.length) {
    throw new Error(`Pinterest no devolvió imágenes válidas para "${query}"`);
  }

  return urls;
}

export async function fetchRandomPinterestImage(query: string = pickRandomQuery()): Promise<Buffer> {
  const urls = await searchPinterestImages(query);
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];

  const res = await axios.get(randomUrl, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(res.data);
}
