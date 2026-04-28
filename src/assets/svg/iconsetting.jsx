import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={12}
    height={12}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M6 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 6.44v-.88c0-.52.425-.95.95-.95.905 0 1.275-.64.82-1.424a.95.95 0 0 1 .35-1.295l.865-.495a.835.835 0 0 1 1.14.3l.055.095c.45.785 1.19.785 1.645 0l.055-.095a.835.835 0 0 1 1.14-.3l.865.495a.95.95 0 0 1 .35 1.295c-.455.785-.085 1.425.82 1.425.52 0 .95.425.95.95v.88c0 .52-.425.95-.95.95-.905 0-1.275.64-.82 1.425a.95.95 0 0 1-.35 1.295l-.865.495a.835.835 0 0 1-1.14-.3l-.055-.095c-.45-.785-1.19-.785-1.645 0l-.055.095a.835.835 0 0 1-1.14.3l-.865-.495a.95.95 0 0 1-.35-1.295c.455-.785.085-1.425-.82-1.425A.953.953 0 0 1 1 6.44"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
