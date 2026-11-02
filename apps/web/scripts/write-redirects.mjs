// Writes out/_redirects after the Next.js build. Cloudflare Workers redirects
// /index.html, /404.html and /page to /page/ with a temporary 307; Cloudflare
// Pages, which hosted this site before, sent a permanent 308, which search
// engines treat as a stronger signal. List every page with a 308 instead.
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const lines = [];
const pages = readdirSync(OUT, { recursive: true })
	.map((file) => file.split("\\").join("/"))
	.filter((file) => file.endsWith(".html") && !file.startsWith("_next/"))
	.sort();
for (const file of pages) {
	if (file === "index.html" || file.endsWith("/index.html")) {
		// out/page/index.html is served at /page/.
		const dir = file.slice(0, -"index.html".length);
		lines.push(`/${file} /${dir} 308`, `/${dir}index /${dir} 308`);
		if (dir && !existsSync(join(OUT, `${dir.slice(0, -1)}.html`))) {
			lines.push(`/${dir.slice(0, -1)} /${dir} 308`);
		}
	} else {
		// out/page.html is served at /page.
		const page = file.slice(0, -".html".length);
		lines.push(`/${file} /${page} 308`);
		if (!existsSync(join(OUT, page, "index.html"))) {
			lines.push(`/${page}/ /${page} 308`);
		}
	}
}
writeFileSync(join(OUT, "_redirects"), `${lines.join("\n")}\n`);
console.log(`Wrote ${lines.length} redirects to ${OUT}/_redirects`);
