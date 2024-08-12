import { useState } from "preact/hooks";
import { spotifyApi } from "../spotify.ts";

interface ShareButtonProps {
    token: string;
}

const DEFAULT_PLAYLIST_NAME = 'Lineup Likes';
const DEFAULT_PLAYLIST_DESCRIPTION = 'Lineup matches from your likes';

export default function LikesComparisonButton(props: ShareButtonProps) {
    const [shareButtonText, setShareButtonText] = useState('Compare Lineup with Likes');
    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [matches, setMatches] = useState([]);
    const [lineup, setLineup] = useState(`A-Trak
Arca
Artemas
Asaf Samuel B2B Maccabi
Ashley Venom B2B Souls Departed
Aurora Halal (Live)
Bad Gyal
bar italia
Beltran
Ben Katzman's DeGreaser
Ben UFO
Berrakka
Bladee
BLOND:ISH
Bodine
Carlita
Carozilla B2B House of Pris
Channel Tres
ChaseWest
Chloé Robinson B2B Coffintexts
Cloonee
Craze B2B Shinobi
D33 (Danny Daze) B2B Maher Daniel
Dara Delcastillo
Differ B2B Tiffy Vera
Disclosure
Disco Lines
DJ Fitness
DJ Koze
DJ Shadow
Donzii
Elderbrook
Eli Escobar B2B Jubilee
Felipe Gordon B2B Will Buck
Feph
Gio Elia
Glass Beams
Heidi Lawden
horsegiirL
Idriss D B2B Danyelino
IMOGEN B2B Ultrathem
Isabella Lovestory
ISOxo
Jacques Greene
Jaialai
James Hype B2B Meduza
Jamie xx
Joe Kay
Jonny From Space (Live)
Juan Atkins
Jungle
Justice
Kate W. Bush
Kaytranada
Kenya Grace
Ladyboy
Lake Hills B2B True Vine
Layla Benitez
Layton Giordani
Mall Grab
Malóne B2B Miluhska
Marie Qrie B2B Xilla
MARTE B2B v1fro
Massive Attack
Miguelle & Tons
Mochakk
Mystic Bill
Natalia Roth
Natural Wonder Beauty Concept
Nicholas G. Padilla
Nick León & Ezra Miller (Live A/V)
Nicole Gallamini
Of The Trees
Pachanga Boys
Parliament Funkadelic feat. George Clinton
PAWSA
phiphi B2B Milo Ziro
Player Dave
Pressure Point B2B SEL.6
Pretty Girl
Priori B2B Sister System
Prunk B2B Ms. Mada
Raekwon
Ranger Trucco
Rezz
Rick Ross
Robyn Sin Love B2B Quetamine
salute
Sammy Virji
Sara Landry
SATURNSARii B2B SDRV
Sega Bodega
Seth Troxler
Skee Mask
Skin On Skin B2B KETTAMA
Snow Strippers
SoFTT
Tara Long
Thee Sacred Souls
Thunderpony
Tinlicker (Live)
Toni Shardai B2B DJ Tamsom
Toro y Moi
Vintage Culture
Whitesquare B2B Ricardo Baez
Winded
Yung Lean

`);

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

        console.log(tracks)

        const lineupTracks = lineup.split('\n');
        const lineupLikedTracks = tracks.filter((track) => track.track.artists?.some((artist) => {
            console.log(artist.name);
            return lineupTracks.includes(artist.name);
        })).sort((a, b) => a.track.artists[0].name.localeCompare(b.track.artists[0].name));
        setMatches(lineupLikedTracks);

        const playlistRsp = await spotifyApi.createPlaylist(props.token, userData.id, DEFAULT_PLAYLIST_NAME, DEFAULT_PLAYLIST_DESCRIPTION);
        const playlist = await playlistRsp.json();
        console.log(playlistRsp);
        const trackUris = lineupLikedTracks.map(track => track.track.uri);
        for (let i = 0; i < trackUris.length; i += 100) {
            const addPlayListItemsRsp = await spotifyApi.apiRequest(props.token, `v1/playlists/${playlist.id}/tracks`, "POST", {
                uris: trackUris.slice(i, i + 100),
            });
            setShareButtonText(`Adding tracks... ${Math.ceil(i / trackUris.length * 100)}% - ${i}/${trackUris.length}`)
            if (!addPlayListItemsRsp.ok) {
                return false;
            }
        }
    };

    return (
        <div>
            <button class="w-full max-w-lg" onClick={createPlaylist}>{shareButtonText}</button>
            <textarea id="lineup" name="lineup" wrap="off" placeholder="Paste lineup here..." onInput={(e) => setLineup(e.target.value)}></textarea>
            <ul>
                {matches.map((match) => (
                    <li>{match.track.artists.map((artist) => artist.name).join(', ')} - {match.track.name}</li>
                ))}
            </ul>
        </div>
    );
}
