import { HandlerContext } from "$fresh/server.ts";
import {
    json,
    validateRequest,
} from "https://deno.land/x/sift@0.5.0/mod.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.144.0/http/cookie.ts";
import { spotifyApi } from "../spotify.ts";

export const handler = async (_req: Request, _ctx: HandlerContext): Response => {
    return await spotifyApi.getTokenResponse(_req);
};
