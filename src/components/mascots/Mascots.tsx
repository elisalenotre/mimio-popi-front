import { useState } from "react";
import popiMimioHappy from "../../assets/popi-mimio-very-happy.svg";
import "./Mascots.css";

interface MascotsProps {
  variant?: "compact" | "default";
  position?: "header" | "corner" | "card";
  className?: string;
}

export function Mascots({ variant = "default", position = "card", className }: MascotsProps) {
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  const classNames = ["mascots", `mascots--${variant}`, `mascots--${position}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      className={classNames}
      src={popiMimioHappy}
      alt=""
      aria-hidden="true"
      onError={() => setErrored(true)}
    />
  );
}
