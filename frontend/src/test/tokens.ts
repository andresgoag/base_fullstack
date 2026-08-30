const encodeBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const buildAccessToken = (expiresInMs: number): string => {
  const payload = {
    token_type: "access",
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
    jti: "3f9a2b1c4d5e6f708192a3b4c5d6e7f8?~",
    user_id: "1",
  };
  return `header.${encodeBase64Url(JSON.stringify(payload))}.signature`;
};
