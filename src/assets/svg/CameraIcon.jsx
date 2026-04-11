import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";

const CameraIcon = (props) => (
  <Svg
    width={50}
    height={50}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Rect width={50} height={50} rx={25} fill="#e57373" />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.45 18.636a1.25 1.25 0 0 1 .884-.386h5.332c.332 0 .65.139.884.386l1.366 1.447h2.584c.966 0 1.75.784 1.75 1.75v8.5c0 .967-.784 1.75-1.75 1.75h-15c-.966 0-1.75-.783-1.75-1.75v-8.5c0-.966.784-1.75 1.75-1.75h2.584l1.366-1.447ZM25 29.333a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm0-1.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
      fill="#fff"
    />
  </Svg>
);

export default CameraIcon;
