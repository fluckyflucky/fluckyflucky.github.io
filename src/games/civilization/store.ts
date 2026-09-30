import { valid, type State } from "./engine";
const KEY = "aoinatsu:civilization:v1";
// A single browser-local save. No network requests or server account.
export function load(): State | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}
export function save(state: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
