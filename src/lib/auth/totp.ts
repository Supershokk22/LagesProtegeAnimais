import { authenticator } from "otplib";
import QRCode from "qrcode";

/**
 * ============================================================================
 * TOTP / 2FA (§16)
 * ============================================================================
 * RFC 6238, SHA-1, 6 digitos, passo de 30s — padrao universal de autenticadores
 * (Google Authenticator, Aegis, Microsoft Authenticator).
 *
 * Janela de tolerancia: ±1 passo. Sem isso, ~33% das autenticacoes legitimas
 * falham por causa de desvio de relogio do telefone.
 */

authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

export function generateTotpSecret(): string {
  return authenticator.generateSecret(32);
}

export function buildOtpAuthUri(secret: string, account: string, issuer = "Lages Protege Animais"): string {
  return authenticator.keyuri(account, issuer, secret);
}

export async function buildQrDataUrl(secret: string, account: string, issuer?: string): Promise<string> {
  return QRCode.toDataURL(buildOtpAuthUri(secret, account, issuer), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#14532D", light: "#FAFAF5" },
  });
}

export function verifyTotp(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  return authenticator.verify({ token, secret });
}

/** Codigo de recuperacao: 8 blocos de 5 caracteres base32, usados uma vez. */
export function generateRecoveryCodes(n = 8): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let code = "";
    for (let j = 0; j < 10; j++) {
      if (j === 5) code += "-";
      else code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    out.push(code);
  }
  return out;
}

export function hashRecoveryCode(code: string): string {
  // Usa crypto do Node; isolado aqui para manter o modulo sem dependencia de framework.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(code.replace("-", "").toUpperCase()).digest("hex");
}