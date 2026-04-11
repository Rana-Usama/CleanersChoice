import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={50}
    height={50}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Rect width={50} height={50} rx={25} fill="#7986cb" />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.477 17.644c-.977.976-.977 2.547-.977 5.69v3.333c0 3.142 0 4.714.977 5.69.976.976 2.547.977 5.69.977h1.666c3.143 0 4.715 0 5.69-.977s.977-2.547.977-5.69v-3.333c0-3.143 0-4.715-.977-5.69-.976-.976-2.547-.977-5.69-.977h-1.666c-3.143 0-4.715 0-5.69.977m3.19 5.065a.625.625 0 1 0 0 1.25h6.666a.625.625 0 0 0 0-1.25zm0 3.333a.625.625 0 1 0 0 1.25h4.166a.625.625 0 0 0 0-1.25z"
      fill="#fff"
    />
  </Svg>
);
export default SVGComponent;
