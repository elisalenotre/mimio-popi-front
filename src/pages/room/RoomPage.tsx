import { Link } from "react-router-dom";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import backIcon from "../../assets/icons/Chevron-Arrow-Left.svg";
import "./RoomPage.css";

export default function RoomPage() {
  return (
    <main>
      <AppNavbar />
      <h1>Chambre</h1>
      <p className="room-back-link">
        <Link to="/">
          <img className="room-back-link__icon" src={backIcon} alt="" aria-hidden="true" />
          Retour aux tâches
        </Link>
      </p>
      <p>La chambre arrive bientot. Cette section n'est pas encore dans le MVP.</p>
    </main>
  );
}
