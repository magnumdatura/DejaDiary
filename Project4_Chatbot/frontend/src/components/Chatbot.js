import React, { useState, useEffect, useRef } from "react";
import ReactContext from "../context/react-context";
import Axios from "axios";

import { DateTime } from "luxon";

import hacker from "../icons/hacker.png";
import chatbot from "../icons/bot.png";

function Chatbot() {
  useEffect(() => {
    console.log(`component mounted`);
    eventQuery("Greetings");
  }, []);

  const [conversations, setConversations] = useState([]);

  const textQuery = async (text) => {
    // 1. print client message
    let conversation = {
      who: "you",
      content: {
        text: {
          text: text, // mimics format of dialogflow as from postman
        },
      },
    };

    setConversations((prevConversations) => [
      ...prevConversations,
      conversation,
    ]);
    // 2. send client message to express THEN get dialogflow response
    const textQueryVariables = {
      text,
    };

    try {
      const response = await Axios.post(
        "http://localhost:5001/api/dialogflow/textQuery",
        textQueryVariables
      );
      console.log(response);
      // const resContent = response.data.fulfillmentMessages[0];
      const resUserMemory = response.data.userMemory; // array
      // console.log(resUserMemory)
      const resUserEvents = response.data.userEvents;

      if (resUserMemory) {
        for (const resContent of response.data.fulfillmentMessages) {
          resContent.userMemory = resUserMemory; // smuggles userMemory key-value into response object coming in from Dialogflow

          let conversation = {
            who: "deja",
            content: resContent,
          };
          setConversations((prevConversations) => [
            ...prevConversations,
            conversation,
          ]);
        }
      } else if (resUserEvents) {
        for (const resContent of response.data.fulfillmentMessages) {
          resContent.userEvents = resUserEvents; // smuggles userEvents key-value into response object coming in from Dialogflow

          let conversation = {
            who: "deja",
            content: resContent,
          };
          setConversations((prevConversations) => [
            ...prevConversations,
            conversation,
          ]);
        }
      } else {
        for (const resContent of response.data.fulfillmentMessages) {
          let conversation = {
            who: "deja",
            content: resContent,
          };
          setConversations((prevConversations) => [
            ...prevConversations,
            conversation,
          ]);
        }
      }
    } catch (error) {
      conversation = {
        who: "deja",
        content: {
          text: {
            text: "Error: troubleshoot time!",
          },
        },
      };
      setConversations((prevConversations) => [
        ...prevConversations,
        conversation,
      ]);
    }
  };

  console.log(conversations);

  const eventQuery = async (event) => {
    // 2. no need for client text input, just print bot response
    const eventQueryVariables = {
      event,
    };

    try {
      const response = await Axios.post(
        "http://localhost:5001/api/dialogflow/eventQuery",
        eventQueryVariables
      );
      console.log(response);

      for (const resContent of response.data.fulfillmentMessages) {
        let conversation = {
          who: "deja",
          content: resContent,
        };
        setConversations((prevConversations) => [
          ...prevConversations,
          conversation,
        ]);
      }
    } catch (error) {
      let conversation = {
        who: "deja",
        content: {
          text: {
            text: "Error: troubleshoot time!",
          },
        },
      };

      setConversations((prevConversations) => [
        ...prevConversations,
        conversation,
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!e.target.value) {
        return alert("Sorry! Gimme something to start with");
      }

      // send e.target.value (request) to textQuery route in backend
      textQuery(e.target.value);

      e.target.value = "";
    }
  };

  const renderOneMessage = (message, index) => {
    console.log(message);

    // const AvatarSrc =
    //   message.who === "deja" ? <AndroidOutlined /> : <UserOutlined />;

    async function handleEventCompleted(event) {

      // if (event.target.checked) {
      console.log("HELLO WORLD KITTY KATTY BATMAN DUGA");
      // take userEvent ID from map below, parse it together with boolean isCompleted set to true now, and send that in to database
      console.log(event.target.getAttribute("storeid"));

      const eventID = {
        eventID: event.target.getAttribute("storeid"),
        checked: event.target.checked
      };

      try {
        const response = await Axios.patch(
          "http://localhost:5001/api/dialogflow//textQuery/events/isCompleted",
          eventID
        );
        console.log(response);
      } catch (error) {
        console.log(error);
      }
      // }
    }

    const messageType =
      (message.content.userMemory &&
        message.content.userMemory.map((memory, i) => {
          if (memory.userMemory) {
            const memoryDate = DateTime.fromISO(
              memory.createdAt
            ).toLocaleString(DateTime.DATETIME_MED);
            return (
              <div className="my-1 flex justify-between">
                <div>
                  <p className="underline text-white text-xl">{memoryDate}</p>
                  <p className="text-lg">{memory.userMemory}</p>
                </div>
                <div class="items-end m-4 py-12">
                  <input
                    id="default-checkbox"
                    type="checkbox"
                    value=""
                    class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label
                    for="default-checkbox"
                    class="ml-2 text-md font-lg text-blue-600"
                  >
                    Read
                  </label>
                </div>
              </div>
            );
          }
        })) ||
      (message.content.userEvents &&
        message.content.userEvents.map((event, i) => {
          if (event.eventType) {
            // if (event.isCompleted == "false") {
            console.log(event.isCompleted);
            if (!event.isCompleted) {
              const eventDate = DateTime.fromISO(
                event.eventDate
              ).toLocaleString(DateTime.DATETIME_MED);
              const eventTime = DateTime.fromISO(
                event.eventTime
              ).toLocaleString(DateTime.DATETIME_MED);
              return (
                <div className="my-1 flex justify-between">
                  <div>
                    <p className="underline text-white text-xl">{eventTime}</p>
                    <p className="text-lg">
                      {event.eventType} with {event.eventPerson}
                    </p>
                  </div>
                  <div class="items-end m-4 py-12 right-0">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      value=""
                      class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      storeid={event._id}
                      onChange={handleEventCompleted}
                    />
                    <label
                      for="default-checkbox"
                      class="ml-2 text-md font-lg text-blue-600"
                    >
                      Completed
                    </label>
                  </div>
                </div>
              );
            }
          }
        }));

    return message.who === "deja" ? (
      <div
        key={index}
        className="border bg-gradient-to-r from-teal-400 rounded-md w-2/3 m-2 font-serif"
      >
        <div className="m-2 ">
          {/* <Avatar icon={chatbot} /> */}
          <img src={chatbot} className="object-scale-down h-16 w-16" />
          <div className="text-2xl mt-2 rounded-lg bg-gradient-to-r from-emerald-100">
            <p className="ml-2 font-semibold">{message.who}</p>
          </div>
        </div>
        <div className="m-4">
          <p className="text-xl">{message.content.text.text}</p>
          {messageType}
        </div>
      </div>
    ) : (
      <div
        key={index}
        className="border bg-gradient-to-l from-orange-400 rounded-md w-2/3 inset-y-0 mx-20 font-serif"
      >
        <div className="m-2 ">
          {/* <Avatar icon={hacker} /> */}
          <img src={hacker} className="object-scale-down h-16 w-16" />
          <div className="text-2xl mt-2 rounded-lg bg-gradient-to-r from-yellow-100">
            <p className="ml-2 font-semibold">{message.who}</p>
          </div>
        </div>
        <div className="m-4">
          <p className="text-xl">{message.content.text.text}</p>
          {messageType}
        </div>
      </div>
    );
  };

  const renderMessage = (conversationsArray) => {
    if (conversationsArray) {
      // dummy.current.scrollIntoView({ behavior: "smooth" });
      return conversationsArray.map((message, index) => {
        return renderOneMessage(message, index);
      });
    } else {
      return null;
    }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  return (
    <>
      <div
        style={{
          height: 700,
          width: 700,
          border: "3px solid black",
          borderRadius: "7px",
        }}
        className="bg-slate-300/50"
      >
        <div
          style={{ height: 644, width: "100%", overflow: "auto" }}
          className="items-center justify-center"
        >
          {renderMessage(conversations)}
          <div ref={messagesEndRef} />
        </div>

        <input
          onKeyDown={handleKeyPress}
          type="text"
          placeholder="Send a message..."
          autoComplete="on"
          style={{
            width: "100%",
            height: 50,
            borderRadius: "3px",
            padding: "4px",
          }}
          className="border border-violet-600 hover:border-2 text-xl"
        />
      </div>
    </>
  );
}

export default Chatbot;
