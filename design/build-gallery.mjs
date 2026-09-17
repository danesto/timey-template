/**
 * Turns the canvas artboards into one standalone page that opens in any
 * browser straight from the repository.
 *
 *   node design/build-gallery.mjs            rebuild
 *   node design/build-gallery.mjs --open     rebuild and open it
 */
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { platform } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const PAGES = [
  {
    id: "desktop",
    name: "Desktop",
    note: "1120 × 760 — mali laptop, ne pun ekran.",
    frames: [
      ["Main.dc.html", "1 · Izbor usluge"],
      ["Barber.dc.html", "2 · Izbor berberina"],
      ["Calendar.dc.html", "3 · Datum i termin"],
      ["Form.dc.html", "4 · Podaci"],
      ["Confirmation.dc.html", "5 · Potvrda"],
      ["Manage.dc.html", "6 · Upravljanje terminom"],
      ["States.dc.html", "Stanja"],
    ],
  },
  {
    id: "telefon",
    name: "Telefon",
    note: "390 × 844 — ista hijerarhija, skupljena.",
    frames: [
      ["PhoneMain.dc.html", "1 · Izbor usluge"],
      ["PhoneBarber.dc.html", "2 · Izbor berberina"],
      ["PhoneCalendar.dc.html", "3 · Datum i termin"],
      ["PhoneForm.dc.html", "4 · Podaci"],
      ["PhoneConfirmation.dc.html", "5 · Potvrda"],
      ["PhoneManage.dc.html", "6 · Upravljanje terminom"],
      ["PhoneStates.dc.html", "Stanja"],
    ],
  },
];

/** Pulls the drawing out of an artboard, leaving the canvas machinery behind. */
function extract(source) {
  const body = source.match(/<\/helmet>([\s\S]*?)<\/x-dc>/);
  if (!body) throw new Error("no artboard body found");

  const fonts = [...source.matchAll(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g)]
    .map((match) => match[1]);

  return { markup: body[1].trim(), fonts };
}

const fonts = new Set();
const sections = [];

for (const page of PAGES) {
  const frames = [];
  for (const [file, title] of page.frames) {
    const { markup, fonts: found } = extract(await readFile(join(here, file), "utf8"));
    found.forEach((href) => fonts.add(href));
    frames.push(`      <figure class="frame">
        <figcaption>${title}</figcaption>
        <div class="stage">${markup}</div>
      </figure>`);
  }

  sections.push(`    <section id="${page.id}">
      <h2>${page.name}</h2>
      <p class="note">${page.note}</p>
      <div class="frames">
${frames.join("\n")}
      </div>
    </section>`);
}

const html = `<!doctype html>
<html lang="sr-Latn-RS">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Timey — skice ekrana</title>
${[...fonts].map((href) => `  <link rel="stylesheet" href="${href}">`).join("\n")}
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e8e8e5;
      color: #2b2b2b;
      font-family: system-ui, sans-serif;
      padding: 40px 32px 80px;
    }
    header { max-width: 760px; margin: 0 auto 48px; }
    h1 { font-size: 28px; margin: 0 0 12px; }
    header p { font-size: 14px; line-height: 1.6; color: #5a5a5c; margin: 0 0 8px; }
    nav { display: flex; gap: 16px; margin-top: 20px; }
    nav a { font-size: 14px; color: #2b2b2b; }
    section { max-width: 1400px; margin: 0 auto 64px; }
    h2 { font-size: 20px; margin: 0 0 6px; }
    .note { font-size: 13px; color: #5a5a5c; margin: 0 0 24px; }
    .frames { display: flex; flex-direction: column; gap: 40px; }
    .frame { margin: 0; }
    figcaption {
      font-size: 13px; color: #5a5a5c; margin-bottom: 10px;
      font-variant-numeric: tabular-nums;
    }
    .stage {
      display: inline-block; overflow: auto; max-width: 100%;
      border: 1px solid #c8c8c6; background: #f4f4f2;
    }
  </style>
</head>
<body>
  <header>
    <h1>Timey — skice ekrana</h1>
    <p>Namerno sive i grube. Raspored, hijerarhija i to koji podatak stoji gde su odluka; boje, tipografija i vizuelni jezik nisu.</p>
    <p>Uz svaki ekran, sa strane, stoji koji ga poziv hrani.</p>
    <nav>
${PAGES.map((page) => `      <a href="#${page.id}">${page.name}</a>`).join("\n")}
    </nav>
  </header>
${sections.join("\n")}
</body>
</html>
`;

const out = join(here, "index.html");
await writeFile(out, html);
console.log(`design/index.html — ${PAGES.reduce((n, p) => n + p.frames.length, 0)} ekrana`);

if (process.argv.includes("--open")) {
  const opener =
    platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  execFile(opener, [out], (error) => {
    if (error) console.log(`Otvori ručno: ${out}`);
  });
}
