/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function Search(props) {
  const [count, setCount] = useState(props.start);
  return (
    <div>
      <p>{123}</p>
    </div>
  );
}
