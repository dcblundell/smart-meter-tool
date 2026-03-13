declare module "vite-clacks-overhead" {
  interface ClacksOptions {
    memoriam?: string;
    names?: string[];
    seperator?: string;
    custom?: string | null;
  }
  export default function xClacksOverhead(options?: ClacksOptions): any;
}
