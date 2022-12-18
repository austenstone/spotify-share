
import { getCookies, setCookie } from "https://deno.land/std@0.144.0/http/cookie.ts";

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
        const scope = 'user-read-private user-read-email';

        const redirectUrl = new URL(`${this.baseAccountUrl}/authorize`);
        redirectUrl.searchParams.append('response_type', 'code');
        redirectUrl.searchParams.append('client_id', clientId);
        redirectUrl.searchParams.append('scope', scope);
        redirectUrl.searchParams.append('redirect_uri', new URL(_req.url).origin + '/callback');
        // redirectUrl.searchParams.append('state', state);
        return Response.redirect(redirectUrl);
    }

    async getTokenResponse(_req: Request): Promise<Response> {
        const url = new URL(_req.url);
        const code = url.searchParams.get("code") || '';
        const state = url.searchParams.get("state") || '';

        const clientId = Deno.env.get("SPOTIFY_CLIENT_ID") || "";
        const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET") || "";

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

    apiRequest(req: Request, url: string, method?: string): Promise<Response> {
        const maybeAccessToken = getCookies(req.headers)["spotify_token"];
        if (!maybeAccessToken) {
            return Promise.reject(new Error("No access token"));
        }
        return fetch(`${this.baseApiUrl}/${url}`, {
            method: method || "GET",
            headers: {
                Authorization: `Bearer ${maybeAccessToken}`
            }
        });
    }

    getUserProfile(req: Request): Promise<Response> {
        return this.apiRequest(req, 'v1/me');
    }

    search(req: Request, query: string, type: string[], limit: number = 20, offset: number = 0): Promise<Response> {
        return this.apiRequest(req, `v1/search?${new URLSearchParams({
            q: query,
            type: type?.join(','),
            limit: limit.toString(),
            offset: offset.toString(),
        }).toString()}`);
    }
}

export const spotifyApi = new SpotifyApi();