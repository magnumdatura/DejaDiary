import logo from "./logo.svg";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import particlesOptions from "./particles.json";

import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import ReactContext from "./context/react-context";
import "./App.css";
import jwt_decode from "jwt-decode";

import { Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import Chatbot from "./components/Chatbot";

import googleClient from "./google_client.json"
// console.log(googleClient.web.client_id);

const { Title } = Typography;

function App() {
  const particlesInit = useCallback((main) => {
    loadFull(main);
  }, []);

  const [user, setUser] = useState();
  const pageEndRef = useRef(null);

  function handleCallbackResponse(response) {
    // console.log("Encoded JWT ID token :" + response.credential);
    const userObject = jwt_decode(response.credential);
    // console.log(userObject);
    setUser(userObject);
    
    document.getElementById("signInDiv").hidden = true;
  }

  function handleSignOut(event) {
    event.preventDefault();
    setUser();
    document.getElementById("signInDiv").hidden = false;
  }

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id:
        googleClient.web.client_id,
      callback: handleCallbackResponse,
    });

    google.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      size: "large",
    });

    google.accounts.id.prompt();
  }, []);

  useEffect(() => {
    pageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [user]);

  return (
    <div className="App">
      <div className="scroll-auto">
        <Particles options={particlesOptions} init={particlesInit} />

        <div className="flex h-screen items-center justify-center">
          <div className="m-auto">
            <p className="text-6xl font-serif relative z-10 snap-center snap-always">
              DEJA&nbsp;
              <RobotOutlined />
              &nbsp;DIARY
            </p>

            <div className="my-8 relative z-10" id="signInDiv"></div>
          </div>
        </div>
        {user && (
          <div className="h-screen items-center justify-center flex">
            <div className="items-center justify-center mr-4">
              <img src={user.picture} className="rounded-3xl"></img>
              <h3 className="text-xl">{user.name}</h3>
              <button
                onClick={handleSignOut}
                id="signOutButton"
                className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-1 px-2 border border-gray-400 rounded shadow"
              >
                Sign Out
              </button>
            </div>
            <div className="">
              <Chatbot />
            </div>
            <div ref={pageEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
