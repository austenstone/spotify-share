
import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Header() {
  return (
    <header>
        <title>Spotify Share</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,500;0,700;1,500&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="/style.css"></link>
    </header>
  );
}
