import SetupScreen from "./screens/SetupScreen";
import OutputScreen from "./screens/OutputScreen";

const searchParams = new URLSearchParams(window.location.search);
const screen = searchParams.get("screen");

export default function App() {
  if (screen === "output") {
    return <OutputScreen />;
  }
  return <SetupScreen />;
}
