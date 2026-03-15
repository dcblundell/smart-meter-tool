import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import xClacksOverhead from "vite-clacks-overhead";

const clacks_opts = {
  // The in memoriam part of the clacks.  Defaults to "GNU"
  memoriam: "GNU",
  // Array of the names of those you wish to remember.
  names: ["Terry Pratchett"],
  // The seperator between the names for the header.
  seperator: ", ",
  // Custom message (string) in case you don't want to follow the
  // <memoriam> <name>, <name>, <name>... template (defaults to null)
  custom: null,
};

export default defineConfig({
  base: "/smart-meter-tool/",
  plugins: [solid(), xClacksOverhead(clacks_opts)],
});
