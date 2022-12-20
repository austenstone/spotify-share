
import { setCookie } from "https://deno.land/std@0.144.0/http/cookie.ts";

export interface SearchResult {
    artists: Artists;
    tracks:  Tracks;
}

export interface Artists {
    href:     string;
    items:    ArtistsItem[];
    limit:    number;
    next:     string;
    offset:   number;
    previous: null;
    total:    number;
}

export interface ArtistsItem {
    external_urls: ExternalUrls;
    followers:     Followers;
    genres:        string[];
    href:          string;
    id:            string;
    images:        Image[];
    name:          string;
    popularity:    number;
    type:          ArtistType;
    uri:           string;
}

export interface ExternalUrls {
    spotify: string;
}

export interface Followers {
    href:  null;
    total: number;
}

export interface Image {
    height: number;
    url:    string;
    width:  number;
}

export enum ArtistType {
    Artist = "artist",
}

export interface Tracks {
    href:     string;
    items:    TracksItem[];
    limit:    number;
    next:     string;
    offset:   number;
    previous: null;
    total:    number;
}

export interface TracksItem {
    album:             Album;
    artists:           Artist[];
    available_markets: string[];
    disc_number:       number;
    duration_ms:       number;
    explicit:          boolean;
    external_ids:      ExternalIDS;
    external_urls:     ExternalUrls;
    href:              string;
    id:                string;
    is_local:          boolean;
    name:              string;
    popularity:        number;
    preview_url:       null | string;
    track_number:      number;
    type:              PurpleType;
    uri:               string;
}

export interface Album {
    album_type:             AlbumTypeEnum;
    artists:                Artist[];
    available_markets:      string[];
    external_urls:          ExternalUrls;
    href:                   string;
    id:                     string;
    images:                 Image[];
    name:                   string;
    release_date:           string;
    release_date_precision: ReleaseDatePrecision;
    total_tracks:           number;
    type:                   AlbumTypeEnum;
    uri:                    string;
}

export enum AlbumTypeEnum {
    Album = "album",
    Single = "single",
}

export interface Artist {
    external_urls: ExternalUrls;
    href:          string;
    id:            string;
    name:          string;
    type:          ArtistType;
    uri:           string;
}

export enum ReleaseDatePrecision {
    Day = "day",
    Year = "year",
}

export interface ExternalIDS {
    isrc: string;
}

export enum PurpleType {
    Track = "track",
}

export class SpotifyApi {
    baseAccountUrl = "https://accounts.spotify.com";
    baseApiUrl = "https://api.spotify.com";

    authorizeResponse(_req: Request): Response {
        const clientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
        const scope = 'user-library-read playlist-modify-public';

        const redirectUrl = new URL(`${this.baseAccountUrl}/authorize`);
        redirectUrl.searchParams.append('response_type', 'code');
        redirectUrl.searchParams.append('client_id', clientId);
        redirectUrl.searchParams.append('scope', scope);
        redirectUrl.searchParams.append('redirect_uri', new URL(_req.url).origin + '/callback');
        // redirectUrl.searchParams.append('state', state);
        console.log(redirectUrl)
        return Response.redirect(redirectUrl);
    }

    async getTokenResponse(_req: Request): Promise<Response> {
        const url = new URL(_req.url);
        const code = url.searchParams.get("code") || '';
        const state = url.searchParams.get("state") || '';

        const clientId = Deno.env.get("SPOTIFY_CLIENT_ID") || "";
        if (!clientId) return new Response("No client id", { status: 500 });
        const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET") || "";
        if (!clientSecret) return new Response("No client secret", { status: 500 });

        const tokenResponse = await fetch(`${this.baseAccountUrl}/api/token`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(clientId + ':' + clientSecret)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: (new URL(_req.url).origin + '/callback'),
                grant_type: 'authorization_code'
            })
        });

        const data = await tokenResponse.json();
        const { access_token, expires_in } = data;

        const response = new Response(null, {
            status: 302,
            headers: {
                "location": new URL(_req.url).origin,
            },
        });
        setCookie(response.headers, {
            name: "spotify_token",
            value: access_token,
            maxAge: expires_in,
            httpOnly: true,
        });
        return response;
    }

    apiRequest(token: string, url: string, method?: string, body?: any): Promise<Response> {
        return this.rawApiRequest(token, `${this.baseApiUrl}/${url}`, method, body)
    }

    rawApiRequest(token: string, url: string, method?: string, body?: any): Promise<Response> {
        return fetch(url, {
            method: method || "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    getUserProfile(token: string): Promise<Response> {
        return this.apiRequest(token, 'v1/me');
    }

    getUserLikes(token: string): Promise<Response> {
        return this.apiRequest(token, 'v1/me/tracks');
    }
    
    getUserPlaylists(token: string): Promise<Response> {
        return this.apiRequest(token, `v1/me/playlists`);
    }

    createPlaylist(token: string, userId: string, name: string, description: string, isPublic = true): Promise<Response> {
        return this.apiRequest(token, `v1/users/${userId}/playlists`, "POST", {
            name: name,
            description: description,
            public: isPublic,
        });
    }

    updatePlaylistItems(token: string, playlistId: string, uris: string[], range_start = 0, insert_before = 0, range_length = uris.length): Promise<Response> {
        return this.apiRequest(token, `v1/playlists/${playlistId}/tracks`, "PUT", {
            uris: uris,
            range_start,
            insert_before,
            range_length,
        });
    }

    async addPlaylistItems(token: string, playlistId: string, uris: string[], position?: number): Promise<boolean> {
        for (let i = 0; i < uris.length; i += 100) {
            const uriSlice = uris.slice(i, i + 100);
            const addPlayListItemsRsp = await this.apiRequest(token, `v1/playlists/${playlistId}/tracks`, "POST", {
                uris: uriSlice,
                position,
            });
            if (!addPlayListItemsRsp.ok) {
                return false;
            }
        }
        return true;
    }

    search(token: string, query: string, type: string[], limit = 20, offset = 0): Promise<Response> {
        return this.apiRequest(token, `v1/search?${new URLSearchParams({
            q: query,
            type: type?.join(','),
            limit: limit.toString(),
            offset: offset.toString(),
        })?.toString()}`);
    }
}

export const spotifyApi = new SpotifyApi();