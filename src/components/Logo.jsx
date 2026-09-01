import logoTrackr from "../assets/logo-trackr.png";
import logoTrackrWhite from "../assets/logo-trackr-white.png";

/** Full Trackr wordmark (icon + text). */
export default function Logo({ height = 32, white = false, style = {} }) {
  return (
    <img
      src={white ? logoTrackrWhite : logoTrackr}
      alt="Trackr"
      style={{ display: "block", height, width: "auto", ...style }}
    />
  );
}
