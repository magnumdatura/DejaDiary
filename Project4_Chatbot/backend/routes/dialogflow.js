require("dotenv").config();

const express = require("express");
const router = express.Router();
const structjson = require("./structjson.js");
const dialogflow = require("dialogflow");
const uuid = require("uuid");

const { DateTime } = require("luxon");

const config = require("../config/dev.js");

const projectId = config.googleProjectID;
const sessionId = config.dialogFlowSessionID;
const languageCode = config.dialogFlowSessionLanguageCode;

// Create a new session everytime we send a new query to Dialogflow
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// Get DB Schema
const TextQuery = require("../models/TextQuery.js");
const EventQuery = require("../models/EventQuery.js");

// TEXT QUERY route
router.post("/textQuery", async (req, res) => {
  // send frontend client req to Dialogflow API

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The dynamic query that comes in from frontend to send to dialogflow agent
        text: req.body.text,
        // The language used by the client (en-US)
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log(responses);
  console.log("-------------------TEXT QUERY-----------------------");

  const result = responses[0].queryResult;

  console.log(`  INTENT: ${result.intent.displayName}`);
  console.log(`  QUERY: ${result.queryText}`);
  console.log(`  RESPONSE: ${result.fulfillmentText}`);

  const createGenericTextQuery = await TextQuery.create({
    userInput: result.queryText,
    chatbotResponse: result.fulfillmentText,
  });

  const DFintent = result.intent.displayName;

  // corresponds to intent names from dialogflow
  if (DFintent === "SaveMemory") {
    const createMemory = await TextQuery.create({
      userInput: result.queryText,
      chatbotResponse: result.fulfillmentText,
      userMemory: result.parameters.fields.userMemory.stringValue,
    });
  }

  if (DFintent === "RecallMemory") {
    console.log(result.parameters.fields);
    const selectParams = "userMemory createdAt isCompleted";
    const readMemory = await TextQuery.find({
      userMemory: { $ne: null },
    }).select(selectParams);

    // console.log(readMemory);

    // date-period will have a structValue (vs stringValue) only when user keys in a search timeframe. If there is a search timeframe, then run logic checks for userMemory createdAt dates that fit within that timeframe
    if (result.parameters.fields["date-period"].structValue) {
      console.log("-----------BOOGER--------------");

      const startTimeFrame =
        result.parameters.fields["date-period"].structValue?.fields.startDate
          .stringValue;
      const endTimeFrame =
        result.parameters.fields["date-period"].structValue?.fields.endDate
          .stringValue;

      console.log(startTimeFrame);
      console.log(endTimeFrame);

      const filteredDates = [];

      for (const memory of readMemory) {
        console.log("%%%%%%%%%%%%%%%%%%%%%%");
        console.log(memory.createdAt); // same as new Date(memory.createdAt)

        if (memory.createdAt) {
          // const stringdate = JSON.stringify(memory.createdAt);
          // console.log(stringdate);
          // const splitdate = stringdate.split('"');
          // console.log(splitdate[1]);
          // const nomoremilisecond = splitdate[1].split(".");
          // console.log(nomoremilisecond[0]);

          // converts from MongoDB timestamp --> dialogflow's time format to make comparable
          const isoStringDate = memory.createdAt.toISOString();
          console.log(isoStringDate);

          // Don't take away miliseconds because can't reformat later to textQuery.find for MongoDB format again. Instead just stringify, and .localeCompare is smart enough to hold those two formats compatible
          // const nomoremiliseconds = isoStringDate.split('.')[0];
          // console.log(nomoremiliseconds);

          console.log("=========================");
          if (
            startTimeFrame.localeCompare(isoStringDate) <= 0 &&
            endTimeFrame.localeCompare(isoStringDate) >= 0
          ) {
            console.log("CORRECT TIMING");
            // re-formats it to MongoDB's timestamp so we can retrieve via mongoose .find method line 127
            // const gotmilisecondsagain = nomoremiliseconds.concat('.000Z')
            filteredDates.push(isoStringDate);
          }
        }
      }
      console.log(filteredDates);

      const filteredMemories = await TextQuery.find({
        createdAt: filteredDates,
      }).select(selectParams);
      console.log("+++++++++++++++++++++++");
      console.log(filteredMemories);
      console.log("+++++++++++++++++++++++");

      // console.log(readEvent);
      result.userMemory = filteredMemories;
    } else {
      console.log("-----------WOMP WOMP-------------");
      result.userMemory = readMemory;
    }
  }

  if (DFintent === "ScheduleEvent") {
    // console.log(result.parameters)
    console.log(result.parameters.fields.location.structValue);
    // console.log(result.fulfillmentText.split("@")[1])
    // console.log(result.parameters.fields.'music-artist'.stringValue)
    console.log(result.parameters.fields.EventType.stringValue);
    console.log(result.parameters.fields.time.stringValue);
    console.log(result.parameters.fields.person.structValue);
    console.log(result.parameters.fields.date.stringValue);

    const createEvent = await TextQuery.create({
      userInput: result.queryText,
      chatbotResponse: result.fulfillmentText,
      // eventLocation: result.parameters.fields.location.structValue,
      eventType: result.parameters.fields.EventType.stringValue,
      eventDate: result.parameters.fields.date.stringValue,
      eventTime: result.parameters.fields.time.stringValue,
      // eventPerson: result.parameters.fields.person.structValue ? result.parameters.fields.person.structValue.fields.name.stringValue : null,
      eventPerson:
        result.parameters.fields.person.structValue?.fields.name.stringValue,
    });
  }

  if (DFintent === "RemindEvent") {
    const selectParams =
      "eventType eventDate eventTime eventPerson isCompleted";
    const readEvent = await TextQuery.find({ eventType: { $ne: null } }).select(
      selectParams
    );
    // console.log(result.parameters.fields)
    console.log(
      result.parameters.fields["date-period"].structValue?.fields.startDate
        .stringValue
    );
    console.log(
      result.parameters.fields["date-period"].structValue?.fields.endDate
        .stringValue
    );

    const startTimeFrame =
      result.parameters.fields["date-period"].structValue?.fields.startDate
        .stringValue;
    const endTimeFrame =
      result.parameters.fields["date-period"].structValue?.fields.endDate
        .stringValue;

    const filteredDates = [];

    for (const event of readEvent) {
      if (
        startTimeFrame.localeCompare(event.eventTime) <= 0 &&
        endTimeFrame.localeCompare(event.eventTime) >= 0
      ) {
        filteredDates.push(event.eventTime);
      }
    }

    const filteredEvents = await TextQuery.find({
      eventTime: filteredDates,
    }).select(selectParams);
    console.log(filteredEvents);

    // console.log(readEvent);
    result.userEvents = filteredEvents;
  }

  // console.log(result)
  res.send(result);
});

// EVENT QUERY route
router.post("/eventQuery", async (req, res) => {
  // send frontend client req to Dialogflow API

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        // The dynamic query that comes in from frontend to send to dialogflow agent
        name: req.body.event,
        // The language used by the client (en-US)
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log(responses);
  console.log("------------------------");
  console.log("EVENT QUERY");

  const result = responses[0].queryResult;

  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);

  const createEventQuery = await EventQuery.create({
    userInput: result.queryText,
    chatbotResponse: result.fulfillmentText,
  });

  console.log(`EventQuery stored: ${createEventQuery}`);

  const DFintent = result.intent.displayName;
  console.log(`INTENT DETECTED: ${DFintent}`);

  res.send(result);
});

// Update Event isCompleted status (boolean) in TEXT QUERY collections
router.patch("/textQuery/events/isCompleted", async (req, res) => {
  console.log(req.body.eventID);

  const updateComplete = await TextQuery.findByIdAndUpdate(req.body.eventID, {
    $set: { isCompleted: req.body.checked },
  }); // !eventItem.isCompleted

  const eventItem = await TextQuery.findById(req.body.eventID).select(
    "isCompleted userMemory"
  );
  console.log(eventItem); 

  res.send("MADE IT");
});

module.exports = router;
