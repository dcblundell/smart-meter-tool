declare module 'vite-clacks-overhead' {
  interface ClacksOptions {
    memoriam?: string;
    names?: string[];
    seperator?: string;
    custom?: string | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default function xClacksOverhead(options?: ClacksOptions): any;
}
