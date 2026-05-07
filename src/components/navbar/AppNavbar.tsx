import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import heartIcon from "../../assets/icons/Heart.svg";
import listIcon from "../../assets/icons/List.svg";
import roomIcon from "../../assets/icons/Home.svg";
import settingsIcon from "../../assets/icons/Gear.svg";
import exitIcon from "../../assets/icons/Exit.svg";
import { signOut } from "../../services/auth/authService";
import "./AppNavbar.css";

const navItems = [
  { to: "/tasks", label: "Tâches", icon: listIcon, ariaLabel: "Aller aux tâches" },
  { to: "/", label: "Statuts", icon: heartIcon, ariaLabel: "Aller aux statuts", end: true },
  { to: "/room", label: "Chambre", icon: roomIcon, ariaLabel: "Aller à la chambre" },
  { to: "/settings", label: "Paramètres", icon: settingsIcon, ariaLabel: "Aller aux paramètres" },
];

function isItemActive(pathname: string, to: string, end = false) {
  if (end) {
    return pathname === to;
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const primaryActionsRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const activeIndex = navItems.findIndex((item) => isItemActive(location.pathname, item.to, item.end));

  useEffect(() => {
    document.body.classList.add("has-bottom-navbar");

    return () => {
      document.body.classList.remove("has-bottom-navbar");
    };
  }, []);

  useLayoutEffect(() => {
    const updateSlider = () => {
      const container = primaryActionsRef.current;
      const activeLink = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;

      if (!container || !activeLink) {
        setSliderStyle((current) =>
          current.visible ? { ...current, visible: false } : current
        );
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();
      const left = activeRect.left - containerRect.left + container.scrollLeft;
      const width = activeRect.width;

      setSliderStyle({ left, width, visible: true });
    };

    updateSlider();
    window.addEventListener("resize", updateSlider);

    return () => {
      window.removeEventListener("resize", updateSlider);
    };
  }, [activeIndex, location.pathname]);

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
      <div className="app-navbar__actions">
        <div className="app-navbar__primary" ref={primaryActionsRef}>
          <span
            className={`app-navbar__slider${sliderStyle.visible ? " app-navbar__slider--visible" : ""}`}
            style={{ width: `${sliderStyle.width}px`, transform: `translateX(${sliderStyle.left}px)` }}
            aria-hidden="true"
          />

          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              className={({ isActive }) => `app-navbar__icon-link${isActive ? " app-navbar__icon-link--active" : ""}`}
              aria-label={item.ariaLabel}
            >
              <img src={item.icon} alt="" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

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
