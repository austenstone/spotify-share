import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.144.0/http/cookie.ts";
import { spotifyApi } from "../spotify.ts";
import { Header } from "../components/Header.tsx";
import ShareButton from "../islands/ShareButton.tsx";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    const maybeAccessToken = getCookies(_req.headers)["spotify_token"];
    if (!maybeAccessToken) {
      return _ctx.render();
    }

    return _ctx.render({ token: maybeAccessToken });
  },
};

export default function Home({ url, data }: PageProps) {
  return (
    <>
      <Header />
      <image src="Spotify_Logo_RGB_White.png" class="w-40 absolute top-5 left-5"></image>
      <div class="flex flex-col justify-center items-center w-full h-full p-5">
        {data ? (
          <ShareButton token={data.token} />
        ) : (
          <a href="/login">
            <button>Log in</button>
          </a>
        )}
        <a href="https://austen.info" class="subdued absolute bottom-1">Austen Stone</a>
      </div>
    </>
  );
}
