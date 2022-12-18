import { spotifyApi, SpotifyApi } from "../spotify.ts"

export function Share(data) {
    return (
      <>
        <h1 class="font-bold text-4xl mb-5">Hello {data?.userData?.display_name}</h1>
        <button onClick={() => {
            spotifyApi.getUserLikes(d)
        }}>Share Likes</button>
      </>
    )
}
