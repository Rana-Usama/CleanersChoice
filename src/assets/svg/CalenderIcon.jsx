import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = ({ color = "#fff", ...props }) => (
  <Svg
    width={13}
    height={13}
    viewBox="0 0 13 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M4.333 1.084v1.625m4.334-1.625v1.625M1.896 4.924h9.208m.271-.319v4.604c0 1.625-.812 2.708-2.708 2.708H4.333c-1.896 0-2.708-1.083-2.708-2.708V4.605c0-1.625.813-2.709 2.708-2.709h4.334c1.896 0 2.708 1.084 2.708 2.709"
      stroke={color}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.501 7.421h.005m-.005 1.625h.005M6.498 7.421h.005m-.005 1.625h.005M4.492 7.421h.005m-.005 1.625h.005"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
