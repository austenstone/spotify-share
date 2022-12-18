import { Head } from "$fresh/runtime.ts";
import Counter from "../islands/Counter.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.144.0/http/cookie.ts";
import { spotifyApi } from "../spotify.ts";
import { Header } from "../components/Header.tsx";
import { Login } from "../components/Login.tsx";
import { Share } from "../components/Share.tsx";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    const maybeAccessToken = getCookies(_req.headers)["spotify_token"];
    if (maybeAccessToken) {
      const userProfileResponse = await spotifyApi.getUserProfile(maybeAccessToken);
      const userData = await userProfileResponse.json()

      if (userData) {
        return _ctx.render({ userData, token });
      }
    }
    return _ctx.render();
  },
};

export const header = (
  <Head>
  <title>Spotify Share</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,500;0,700;1,500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="/style.css"></link>
</Head>
)

export default function Home({ url, data }: PageProps) {
  return (
    <>
      <Header/>

      <div class="p-4 mx-auto max-w-screen-md">
        {data?.userData?.display_name ? Share(data) : Login()}
      </div>
    </>
  );
}
