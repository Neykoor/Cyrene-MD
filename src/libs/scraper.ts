import axios from "axios";

export const PINTEREST_QUERIES = ["cyrene honkai star rail icon", "Japonesas icon"];

function pickRandomQuery(): string {
  return PINTEREST_QUERIES[Math.floor(Math.random() * PINTEREST_QUERIES.length)];
}

const PINTEREST_APIS = [
  (query: string) =>
    axios
      .get(`https://api.stellarwa.xyz/search/pinterest?query=${encodeURIComponent(query)}&key=api-7dSKm`, { timeout: 8000 })
      .then((r) => r.data?.data || r.data?.data?.data),
  (query: string) =>
    axios
      .get(`https://rest.apicausas.xyz/api/v1/buscadores/pinterest?apikey=oboe&q=${encodeURIComponent(query)}`, { timeout: 8000 })
      .then((r) => r.data?.data),
  (query: string) =>
    axios
      .get(`https://api.delirius.store/search/pinterestv2?text=${encodeURIComponent(query)}`, { timeout: 8000 })
      .then((r) => r.data?.data),
];

export async function searchPinterestImages(query: string = pickRandomQuery()): Promise<string[]> {
  const errors: Error[] = [];

  for (const call of PINTEREST_APIS) {
    try {
      const data = await call(query);
      const urls: string[] = (data || [])
        .map((item: any) => item.hd || item.image || item.image_small || "")
        .filter((u: string) => !!u);

      if (urls.length) return urls;
    } catch (e) {
      errors.push(e as Error);
    }
  }

  throw new Error(`Todas las APIs de Pinterest fallaron: ${errors.map((e) => e.message).join(", ")}`);
}

export async function fetchRandomPinterestImage(query: string = pickRandomQuery()): Promise<Buffer> {
  const urls = await searchPinterestImages(query);
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];

  const res = await axios.get(randomUrl, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(res.data);
}
