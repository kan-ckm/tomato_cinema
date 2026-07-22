/* @type {import("prettier").config}*/
import { createRequire } from "module";
const require = createRequire(import.meta.url);
export default {
    trailingComma: "none",
    tabWidth:4,
    useTabs:true,
    semi:false,
    singleQuote:true,
    jsxSingleQuote:true,
    arrowParens:"avoid",
    importOrderSortSpecifiers:true,
    importOrderCaseInsensitive:true,
    importOrderParserPlugins: [
        "classProperties",
        "decorators-legacy",
        "typescript"
],
importOrder: ["<THIRD_PARTY_MODULES>","^@/(.*)$", "^../(.*)", "^./(.*)"],
plugins: [require.resolve("@trivago/prettier-plugin-sort-imports")],
}