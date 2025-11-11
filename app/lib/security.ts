import { sha1 } from "js-sha1";

/**
 * Verifica si una contraseña aparece en bases de datos filtradas (HIBP)
 * Retorna true si está comprometida.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  const hash = sha1(password).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await res.text();

  return text.includes(suffix);
}
