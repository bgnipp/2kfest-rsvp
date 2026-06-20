/**
 * 2K Fest — WhatsApp group member exporter
 * ----------------------------------------------------------------------------
 * Pulls every member of a WhatsApp group (name + phone number) into a CSV so
 * you can text out invites / match against the invitee list.
 *
 * USAGE
 *   cd tools/whatsapp-export
 *   npm install
 *   npm start
 *
 * Then:
 *   1. Scan the QR code with your phone: WhatsApp → Settings → Linked Devices
 *      → "Link a Device".
 *   2. It prints a numbered list of your groups. Type the number of the 2K
 *      group and press Enter.
 *   3. It writes whatsapp-members.csv in this folder.
 *
 * HEADS-UP: whatsapp-web.js is an UNOFFICIAL library and using it is technically
 * against WhatsApp's Terms of Service. For a single, read-only export of your
 * own group the risk is low, but it is not sanctioned by WhatsApp. Use your
 * judgment. This script never sends messages — it only reads the member list.
 */

const fs = require("fs");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const OUT_FILE = path.join(__dirname, "whatsapp-members.csv");

// Non-interactive selection: `--group N` exports group #N; otherwise we just
// list the groups and exit (so you can re-run with the right number). Login is
// cached, so the second run won't ask you to scan again.
const groupArgIdx = process.argv.indexOf("--group");
const SELECTED = groupArgIdx !== -1 ? Number(process.argv[groupArgIdx + 1]) : null;

// Optional: select a group by (case-insensitive substring of its) name, e.g.
//   node pull-numbers.js --name "2K Fest"
const nameArgIdx = process.argv.indexOf("--name");
const NAME_MATCH = nameArgIdx !== -1 ? String(process.argv[nameArgIdx + 1] || "") : null;

const client = new Client({
  authStrategy: new LocalAuth(), // caches login so you don't re-scan every run
  puppeteer: {
    headless: true,
    // Chrome runs under Rosetta on this machine (x64 Node on arm64), so every
    // DevTools-protocol call is slow. Bump the timeout well past the default
    // 30s so injection/version checks don't time out before the QR appears.
    protocolTimeout: 240000,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("\nScan this QR code in WhatsApp → Linked Devices → Link a Device:\n");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => console.log("✓ Authenticated."));
client.on("auth_failure", (m) => console.error("✗ Auth failure:", m));

client.on("ready", async () => {
  try {
    console.log("\n✓ Connected. Loading your chats…");
    const chats = await client.getChats();
    const groups = chats.filter((c) => c.isGroup);

    if (groups.length === 0) {
      console.log("No groups found on this account.");
      return shutdown();
    }

    console.log("\nYour groups:\n");
    groups.forEach((g, i) => {
      const count = g.participants ? g.participants.length : "?";
      console.log(`  [${i}] ${g.name}  (${count} members)`);
    });

    let group = null;
    if (NAME_MATCH) {
      const needle = NAME_MATCH.toLowerCase();
      const matches = groups.filter(
        (g) => g.name && g.name.toLowerCase().includes(needle)
      );
      if (matches.length === 0) {
        console.log(`\nNo group name contains "${NAME_MATCH}".`);
        return shutdown();
      }
      if (matches.length > 1) {
        console.log(
          `\nMultiple groups match "${NAME_MATCH}":\n` +
            matches.map((g) => `   • ${g.name}`).join("\n") +
            "\nBe more specific.\n"
        );
        return shutdown();
      }
      group = matches[0];
    } else if (SELECTED === null || Number.isNaN(SELECTED)) {
      console.log(
        "\nNo group selected. Re-run with the number you want, e.g.:\n" +
          "    node pull-numbers.js --group 0\n" +
          "  or by name:\n" +
          '    node pull-numbers.js --name "2K Fest"\n'
      );
      return shutdown();
    } else {
      group = groups[SELECTED];
    }
    if (!group) {
      console.log(`Invalid selection: ${SELECTED}`);
      return shutdown();
    }

    console.log(`\nExporting "${group.name}" (${group.participants.length} members)…`);

    const rows = [];
    for (const p of group.participants) {
      const number = p.id.user; // bare phone number, e.g. 15103685413
      let name = "";
      try {
        const contact = await client.getContactById(p.id._serialized);
        // contact.name  = name as saved in YOUR phone contacts (best, if saved)
        // contact.pushname = the name they set on their own WhatsApp profile
        name = contact.name || contact.pushname || "";
      } catch (_) {
        /* contact lookup can fail for some members — leave name blank */
      }
      const flags = [p.isAdmin ? "admin" : "", p.isSuperAdmin ? "owner" : ""]
        .filter(Boolean)
        .join("/");
      rows.push({ name, number: `+${number}`, role: flags });
    }

    rows.sort((a, b) => a.name.localeCompare(b.name));

    const header = "name,phone,role\n";
    const body = rows
      .map((r) => `${csv(r.name)},${csv(r.number)},${csv(r.role)}`)
      .join("\n");
    fs.writeFileSync(OUT_FILE, header + body + "\n", "utf8");

    const named = rows.filter((r) => r.name).length;
    console.log(`\n✓ Wrote ${rows.length} members to ${OUT_FILE}`);
    console.log(`  (${named} had a name; ${rows.length - named} are number-only)`);

    // Tab-separated dump for easy paste into Google Sheets.
    console.log("\n===== TSV START (copy below into Google Sheets) =====");
    console.log("name\tphone\trole");
    rows.forEach((r) => console.log(`${r.name}\t${r.number}\t${r.role}`));
    console.log("===== TSV END =====");
    console.log("\nDone. You can close this now.");
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    shutdown();
  }
});

// Quote a CSV field if it contains a comma, quote, or newline.
function csv(value) {
  const s = String(value == null ? "" : value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function shutdown() {
  try {
    await client.destroy();
  } catch (_) {
    /* ignore */
  }
  process.exit(0);
}

console.log("Starting WhatsApp client… (a QR code will appear shortly)");
client.initialize();
