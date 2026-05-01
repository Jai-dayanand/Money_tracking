import { API_BASE_URL } from "./config";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {})
  };

  const url = `${API_BASE_URL}${path}`;
  console.log("HTTP Request:", { method: init?.method ?? "GET", url, headers });

  try {
    const response = await fetch(url, {
      ...init,
      headers
    });

    console.log("HTTP Response:", { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP Error:", { status: response.status, body: errorText });
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const data = (text ? JSON.parse(text) : undefined) as T;
    console.log("HTTP Data:", data);
    return data;
  } catch (error) {
    console.error("HTTP Error (caught):", error);
    throw error;
  }
}
