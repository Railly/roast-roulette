import "./styles.css";
import { createRoot } from "react-dom/client";
import { App } from "./components/app";
import { SfxManager } from "./components/sfx-manager";

function Router() {
	const path = window.location.hash;
	if (path === "#/sfx") return <SfxManager />;
	return <App />;
}

createRoot(document.getElementById("root")!).render(<Router />);
