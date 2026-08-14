export async function fetchOptions(url, mapFn) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Response was not ok");
    const result = await response.json();
    return result.map(mapFn);
}