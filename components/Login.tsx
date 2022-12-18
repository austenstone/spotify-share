
import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Login() {
    return (
      <>
        <div class="flex justify-center">
            <head/>
            <a href="/login">
                <button>Log in</button>
            </a>
        </div>
      </>
    )
}
