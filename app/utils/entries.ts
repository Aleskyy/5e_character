export const stripTags = (text: string): string =>
  text.replace(/\{@\w+\s+([^|}]+)(?:\|[^}]*)?\}/g, "$1");

export type Entry =
  | string
  | {
      type?: string;
      name?: string;
      caption?: string;
      entries?: Entry[];
      items?: Entry[];
      colLabels?: string[];
      rows?: unknown[][];
      [key: string]: unknown;
    };
