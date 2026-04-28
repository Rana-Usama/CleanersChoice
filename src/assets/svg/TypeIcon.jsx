import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
const SVGComponent = ({ color = "#5489ff", ...props }) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G clipPath="url(#a)">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 9.75a2.25 2.25 0 0 0-2.25-2.25H15.3l.374-.561a4.9 4.9 0 0 0 .823-2.715v-.471a3.75 3.75 0 0 0-7.5 0v.47c0 .968.287 1.92.824 2.716l.373.56h-3.45a2.25 2.25 0 0 0-2.25 2.25v6.646a6 6 0 0 1-1.755 4.245l-.804.804a1.5 1.5 0 0 0 1.06 2.56h13.5c.398 0 .78-.157 1.061-.44l.804-.803A9 9 0 0 0 21 16.4zM6 12h13.5V9.75a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 1-.75-.75v-.296a1.5 1.5 0 0 1 .252-.832l.677-1.016c.373-.56.572-1.217.571-1.89v-.47a2.25 2.25 0 0 0-4.5 0v.47c0 .672.198 1.328.572 1.89l.676 1.016c.165.246.252.535.252.832v.296a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 0-.75.75zm10.5 10.5h-3.015A5.25 5.25 0 0 0 15 18.81v-.06a.75.75 0 0 0-1.5 0v.06a3.745 3.745 0 0 1-3.015 3.675l-.06.012H3l.804-.804a7.47 7.47 0 0 0 2.19-5.301v-2.895h13.5v2.895c0 1.995-.79 3.9-2.19 5.31l-.804.804z"
        fill={color}
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SVGComponent;
