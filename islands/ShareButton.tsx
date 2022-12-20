import { useState } from "preact/hooks";
import { spotifyApi } from "../spotify.ts";

interface ShareButtonProps {
    token: string;
}

const DEFAULT_PLAYLIST_NAME = 'Liked Songs';
const DEFAULT_PLAYLIST_DESCRIPTION = 'Your liked songs from Spotify'

export default function ShareButton(props: ShareButtonProps) {
    const [shareButtonText, setShareButtonText] = useState('Share Likes');
    const [spotifyUrl, setSpotifyUrl] = useState('');

    const createPlaylist = async () => {
        const userDataRsp = await spotifyApi.getUserProfile(props.token);
        const userData = await userDataRsp.json()

        if (spotifyUrl) {
            await navigator.clipboard.writeText(spotifyUrl);
            window.open(spotifyUrl);
            return;
        }
        const tracks: any[] = await (async () => {
            const _tracks: any[] = [];
            let nextTracks = null;
            let next = `${spotifyApi.baseApiUrl}/v1/me/tracks?limit=50`;
            setShareButtonText(`Getting likes...`);
            do {
                const nextTracksRsp = await spotifyApi.rawApiRequest(props.token, next);
                nextTracks = await nextTracksRsp.json();
                _tracks.push(...nextTracks.items)
                next = nextTracks.next;
                setShareButtonText(`Getting likes... ${Math.ceil(_tracks.length / nextTracks.total * 100)}% - ${_tracks.length}/${nextTracks.total}`)
            } while (next);
            return _tracks;
        })();

        const userPlaylistsRsp = await spotifyApi.getUserPlaylists(props.token);
        const userPlaylists = await userPlaylistsRsp.json();
        let playlist = userPlaylists.items.find((pl: any) => pl.name === DEFAULT_PLAYLIST_NAME);
        if (!playlist) {
            setShareButtonText(`Creating playlist...`)
            const playlistRsp = await spotifyApi.createPlaylist(props.token, userData.id, DEFAULT_PLAYLIST_NAME, DEFAULT_PLAYLIST_DESCRIPTION);
            playlist = await playlistRsp.json();
        }

        const playlistTracks: any[] = await (async () => {
            const _tracks: any[] = [];
            let nextTracks = null;
            let next = `${spotifyApi.baseApiUrl}/v1/playlists/${playlist.id}/tracks?limit=50`;
            do {
                const nextPlaylistTracksRsp = await spotifyApi.rawApiRequest(props.token, next);
                nextTracks = await nextPlaylistTracksRsp.json();
                _tracks.push(...nextTracks.items)
                next = nextTracks.next;
                setShareButtonText(`Checking... ${Math.ceil(_tracks.length / nextTracks.total * 100)}% - ${_tracks.length}/${nextTracks.total}`)
            } while (next);
            return _tracks;
        })();

        setShareButtonText(`Filtering tracks...`)
        const tracksToAdd = tracks.filter(track => !playlistTracks.find(playlistTrack => playlistTrack.track.id === track.track.id));

        setShareButtonText(`Adding ${tracksToAdd.length} tracks...`)
        const trackUris = tracksToAdd.map(track => track.track.uri);
        for (let i = 0; i < trackUris.length; i += 100) {
            const addPlayListItemsRsp = await spotifyApi.apiRequest(props.token, `v1/playlists/${playlist.id}/tracks`, "POST", {
                uris: trackUris.slice(i, i + 100),
            });
            setShareButtonText(`Adding tracks... ${Math.ceil(i / trackUris.length * 100)}% - ${i}/${trackUris.length}`)
            if (!addPlayListItemsRsp.ok) {
                return false;
            }
        }

        const url = `${playlist.external_urls.spotify}?si=${playlist.id}`;
        setSpotifyUrl(url)

        setShareButtonText(`Link copied to clipboard!`)
        await navigator.clipboard.writeText(url);
        window.open(url, '_blank');

        console.log(playlist)
    };

    return (
        <button class="w-full max-w-lg" onClick={createPlaylist}>{shareButtonText}</button>
    );
}
