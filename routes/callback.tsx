import { HandlerContext } from "$fresh/server.ts";
import { spotifyApi } from "../spotify.ts";

export const handler = async (_req: Request, _ctx: HandlerContext): Response => {
    return await spotifyApi.getTokenResponse(_req);
};
