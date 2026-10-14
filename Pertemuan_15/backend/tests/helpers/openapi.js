// Pembantu contract test: memuat openapi.yaml, meresolusi $ref, dan memvalidasi respons dengan Ajv.
import { readFileSync } from "node:fs";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

export function muatSpec() {
  const teks = readFileSync(new URL("../../openapi.yaml", import.meta.url), "utf8");
  return YAML.parse(teks);
}

// Meresolusi "$ref": "#/components/..." secara rekursif (spesifikasi ini tidak memiliki skema rekursif)
function deref(node, spec, dalam = 0) {
  if (dalam > 50) throw new Error("Referensi terlalu dalam (skema rekursif?)");
  if (Array.isArray(node)) return node.map((n) => deref(n, spec, dalam + 1));
  if (node && typeof node === "object") {
    if (typeof node.$ref === "string") {
      if (!node.$ref.startsWith("#/")) throw new Error(`Hanya $ref internal didukung: ${node.$ref}`);
      const target = node.$ref.slice(2).split("/").reduce((o, k) => o?.[k], spec);
      if (target === undefined) throw new Error(`$ref tidak ditemukan: ${node.$ref}`);
      return deref(target, spec, dalam + 1);
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, deref(v, spec, dalam + 1)]));
  }
  return node;
}

export function operasiTerdokumentasi(spec) {
  const hasil = [];
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const metode of ["get", "post", "put", "patch", "delete"]) {
      if (item[metode]) hasil.push(`${metode.toUpperCase()} ${path}`);
    }
  }
  return hasil;
}

// Skema JSON untuk respons (atau null bila tanpa body, mis. 204)
export function skemaRespons(spec, path, metode, status) {
  const op = spec.paths?.[path]?.[metode.toLowerCase()];
  if (!op) throw new Error(`Operasi tidak ada pada spesifikasi: ${metode.toUpperCase()} ${path}`);

  const respons = op.responses?.[String(status)];
  if (!respons) throw new Error(`Respons ${status} tidak didokumentasikan untuk ${metode.toUpperCase()} ${path}`);

  const nyata = deref(respons, spec);
  const media = nyata.content?.["application/json"];
  return media ? media.schema : null;
}

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });

// Mengembalikan { valid, errors: string[] }
export function validasiRespons(spec, path, metode, status, body) {
  const skema = skemaRespons(spec, path, metode, status);
  if (skema === null) return { valid: body === null || body === "" || body === undefined, errors: [] };

  const validasi = ajv.compile(skema);
  const valid = validasi(body);
  const errors = (validasi.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
  return { valid, errors };
}
