export async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") || ""

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.message || payload?.title || fallbackMessage)
    }

    const text = await response.text().catch(() => "")
    throw new Error(text.trim() || fallbackMessage)
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "")
    throw new Error(text.trim() || fallbackMessage)
  }

  return response.json()
}
