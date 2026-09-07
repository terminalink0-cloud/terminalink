const KEY = "token";

export function getToken() {
  return localStorage.getItem(KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function removeToken() {
  localStorage.removeItem(KEY);
}