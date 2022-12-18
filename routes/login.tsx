import { HandlerContext } from "$fresh/server.ts";
import { spotifyApi } from "../spotify.ts";

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
    return spotifyApi.authorizeResponse(_req);
};
