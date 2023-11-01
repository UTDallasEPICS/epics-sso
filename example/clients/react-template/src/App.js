import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App">
      {/* 
        create an anchor or button tag that has an href to <link-here>
        there is a redirect_url as a query parameters that you can specify where you want to redirect back after successful login
        make sure to follow the following format
      */}
      <a
        href={`https://sso.epics.weii.io/login?redirect_url=${encodeURI(
          "https://epics-sso-client-2.vercel.app/user"
        )}`}
      >
        Click here to login
      </a>
    </div>
  );
}

export default App;
