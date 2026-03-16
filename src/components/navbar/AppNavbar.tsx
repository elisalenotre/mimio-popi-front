import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import roomIcon from "../../assets/icons/Home.svg";
import settingsIcon from "../../assets/icons/Gear.svg";
import exitIcon from "../../assets/icons/Exit.svg";
import popiMascot from "../../assets/popi.svg";
import mimioHeadMascot from "../../assets/mimio-head.svg";
import { signOut } from "../../services/auth/authService";
import "./AppNavbar.css";

const brandChars = ["M", "i", "m", "i", "o", " ", "&", " ", "P", "o", "p", "i"];

export function AppNavbar() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="app-navbar" aria-label="Navigation principale">
      <Link to="/" className="app-navbar__brand" aria-label="Mimio et Popi">
        <img className="app-navbar__brand-mascot app-navbar__brand-mascot--left" src={mimioHeadMascot} alt="" />
        {brandChars.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className={char === " " ? "app-navbar__char app-navbar__space" : "app-navbar__char"}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        ))}
        <img className="app-navbar__brand-mascot app-navbar__brand-mascot--right" src={popiMascot} alt="" />
      </Link>

      <div className="app-navbar__actions">
        <NavLink
          to="/room"
          className={({ isActive }) => `app-navbar__icon-link${isActive ? " app-navbar__icon-link--active" : ""}`}
          aria-label="Aller à la chambre"
        >
          <img src={roomIcon} alt="" />
          <span>Chambre</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `app-navbar__icon-link${isActive ? " app-navbar__icon-link--active" : ""}`}
          aria-label="Aller aux paramètres"
        >
          <img src={settingsIcon} alt="" />
          <span>Paramètres</span>
        </NavLink>

        <button
          type="button"
          className="app-navbar__icon-button app-navbar__icon-button--logout"
          aria-label="Se déconnecter"
          onClick={handleLogout}
          disabled={signingOut}
        >
          <img src={exitIcon} alt="" />
          <span>{signingOut ? "Sortie..." : "Déconnexion"}</span>
        </button>
      </div>
    </nav>
  );
}
