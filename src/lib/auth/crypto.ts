import { z } from "zod";
import { createHash, randomBytes, scrypt, timingSafeEqual, createCipheriv, createDecipheriv } from "node:crypto";

type ScryptOpts = { N: number; r: number; p: number; maxmem: number };
async function scryptKey(
  password: string,
  salt: Buffer,
  keylen: number,
  opts: ScryptOpts,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, opts, (err, key) =>
      err ? reject(err) : resolve(key as Buffer),
    );
  });
}

/* ===========================================================================
   HASH DE SENHA
   Argon2id seria o ideal; scrypt (nativo do Node, sem dependencia) e aceitavel
   como baseline com parametros fortes. SHA-256 simples esta PROIBIDO.
   =========================================================================== */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

function b64(buf: Buffer): string {
  return buf.toString("base64url");
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scryptKey(plain.normalize("NFKC"), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  const pepper = process.env.PASSWORD_PEPPER ?? "";
  const peppered = pepper
    ? createHash("sha512").update(key).update(pepper).digest()
    : key;
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${b64(salt)}$${b64(peppered)}`;
}

export async function verifyPassword(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) {
    // Constant-time-ish: ainda gasta CPU para nao vazar existencia de conta via tempo.
    await scryptKey(plain.normalize("NFKC"), Buffer.alloc(16), SCRYPT.keylen, {
      N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 64 * 1024 * 1024,
    });
    return false;
  }
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const key = (await scryptKey(plain.normalize("NFKC"), salt, expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  const pepper = process.env.PASSWORD_PEPPER ?? "";
  const peppered = pepper ? createHash("sha512").update(key).update(pepper).digest() : key;
  return peppered.length === expected.length && timingSafeEqual(peppered, expected);
}

/* ===========================================================================
   SENHAS / CODIGOS DE USO UNICO
   =========================================================================== */

const PASSWORD_POLICY = z
  .string()
  .min(12, "A senha deve ter no minimo 12 caracteres")
  .max(200, "Senha longa demais")
  .refine((s) => /[a-z]/.test(s), "Inclua ao menos uma letra minuscula")
  .refine((s) => /[A-Z]/.test(s), "Inclua ao menos uma letra maiuscula")
  .refine((s) => /[0-9]/.test(s), "Inclua ao menos um numero")
  .refine((s) => /[^A-Za-z0-9]/.test(s), "Inclua ao menos um caractere especial")
  .refine((s) => !COMMON_PASSWORDS.has(s.toLowerCase()), "Senha muito comum");

export const passwordSchema = PASSWORD_POLICY;

const COMMON_PASSWORDS = new Set([
  "password123", "senha1234", "123456789", "qwerty1234", "admin1234",
  "lagest123", "lages1234", "1234567890", "abc12345", "welcome1",
]);

export function passwordStrength(pw: string): { score: number; hints: string[] } {
  const hints: string[] = [];
  let score = 0;
  if (pw.length >= 12) score++; else hints.push("Use ao menos 12 caracteres");
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++; else hints.push("Combine maiusculas e minusculas");
  if (/[0-9]/.test(pw)) score++; else hints.push("Inclua numeros");
  if (/[^A-Za-z0-9]/.test(pw)) score++; else hints.push("Inclua simbolos");
  if (new Set(pw).size >= 8) score++; else hints.push("Evite repeticao de caracteres");
  return { score: Math.min(score, 5), hints };
}

/* ===========================================================================
   CIFRAGEM DO SEGREDO TOTP (AES-256-GCM)
   =========================================================================== */

function getTotpKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOTP_ENCRYPTION_KEY ausente");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TOTP_ENCRYPTION_KEY deve ter 32 bytes (base64)");
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTotpKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${b64(iv)}.${b64(tag)}.${b64(enc)}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("payload cifrado invalido");
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", getTotpKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}