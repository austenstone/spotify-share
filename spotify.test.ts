import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { SpotifyApi } from "./spotify.ts";

Deno.test("search", async () => {
    const spotifyApi = new SpotifyApi();
    const result = await spotifyApi.apiRequest(, "/v1/search?q=abba&type=artist");
});