import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { redisClient } from "./redis";

export const getBkashIdToken = async () => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    const [
      bkashIdToken,
      bkashIdTokenTTL,
      bkashRefreshToken,
      bkashRefreshTokenTTL,
    ] = await Promise.all([
      redisClient.get(IdTokenKey),
      redisClient.ttl(IdTokenKey),
      redisClient.get(RefreshTokenKey),
      redisClient.ttl(RefreshTokenKey),
    ]);

    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    //* Refresh IdToken
    if (bkashRefreshToken && bkashRefreshTokenTTL > 600) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (refreshTokenResponse.ok) {
        const refreshTokenResult = await refreshTokenResponse.json();

        await Promise.all([
          redisClient.set(IdTokenKey, refreshTokenResult.id_token, {
            EX: 3600,
          }),
          redisClient.set(RefreshTokenKey, refreshTokenResult.refresh_token, {
            EX: 60 * 60 * 24 * 28,
          }),
        ]);

        return refreshTokenResult.id_token as string;
      }
    }

    //* Generate New IdToken
    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(httpStatus.BAD_GATEWAY, "Bkash IdToken grant failed!");
    }

    const result = await response.json();

    await Promise.all([
      redisClient.set(IdTokenKey, result.id_token, {
        EX: 3600,
      }),
      redisClient.set(RefreshTokenKey, result.refresh_token, {
        EX: 60 * 60 * 24 * 28,
      }),
    ]);

    return result.id_token as string;
  } catch (error: any) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
