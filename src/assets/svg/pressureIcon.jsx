import * as React from "react";
import Svg, { Path, G, Circle } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G stroke="#4d85fe" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7h6a2 2 0 0 1 2 2v2H3V7Z" fill="#e8f0fe" stroke="#4d85fe" />
      <Path d="M11 10h2.5" />
      <Path d="M13.5 10l5.5 5.5" />
      <Path d="M19 15.5l1 1" />
      <Path d="M20 16.5l1.5-1" strokeWidth={1.2} />
      <Path d="M20.2 17.2l1.5 0.2" strokeWidth={1.2} />
      <Path d="M19.8 18l1.2 1" strokeWidth={1.2} />
      <Path d="M3 12v2a2 2 0 0 0 2 2h4" strokeDasharray="2 1" strokeWidth={1.2} />
      <Path d="M9 16h2a1 1 0 0 0 1-1v-1" />
      <Circle cx="5" cy="18" r="1.2" fill="#c7d9fd" />
      <Circle cx="9" cy="18" r="1.2" fill="#c7d9fd" />
    </G>
  </Svg>
);
export default SVGComponent;
