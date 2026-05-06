const PREFIX = "5EC1:";

const isEmpty = (v: unknown): boolean => {
  if (v === null || v === undefined || v === "" || v === 0 || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
};

const prune = (input: unknown): unknown => {
  if (Array.isArray(input)) return input.map(prune);
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const pv = prune(v);
      if (!isEmpty(pv)) out[k] = pv;
    }
    return out;
  }
  return input;
};

const toBase64Url = (bytes: Uint8Array): string => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (s: string): Uint8Array => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const deflate = async (data: Uint8Array): Promise<Uint8Array> => {
  const cs = new CompressionStream("deflate-raw");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(cs);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
};

const inflate = async (data: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
};

export const encodeShareCode = async (data: unknown): Promise<string> => {
  const pruned = prune(data);
  const json = JSON.stringify(pruned);
  const bytes = new TextEncoder().encode(json);
  const compressed = await deflate(bytes);
  return PREFIX + toBase64Url(compressed);
};

export const decodeShare = async <T = unknown>(input: string): Promise<T> => {
  const trimmed = input.trim();
  if (trimmed.startsWith(PREFIX)) {
    const bytes = fromBase64Url(trimmed.slice(PREFIX.length));
    const out = await inflate(bytes);
    return JSON.parse(new TextDecoder().decode(out)) as T;
  }
  return JSON.parse(trimmed) as T;
};
