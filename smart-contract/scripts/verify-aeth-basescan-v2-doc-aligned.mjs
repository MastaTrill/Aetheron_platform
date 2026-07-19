// Normalize requests to the methods and parameter casing documented by Etherscan V2,
// then run the verification implementation.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const body = init.body instanceof URLSearchParams
    ? new URLSearchParams(init.body)
    : init.body;

  if (body instanceof URLSearchParams && body.has("evmversion")) {
    body.set("evmVersion", body.get("evmversion"));
    body.delete("evmversion");
  }

  if (url.searchParams.get("action") === "checkverifystatus" && !init.method) {
    const params = new URLSearchParams(url.searchParams);
    url.search = "";
    return nativeFetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params
    });
  }

  return nativeFetch(url, { ...init, body });
};

await import("./verify-aeth-basescan-v2.mjs");
