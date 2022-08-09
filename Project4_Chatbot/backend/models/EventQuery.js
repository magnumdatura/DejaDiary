const mongoose = require("mongoose");

const EventQuerySchema = new mongoose.Schema(
  {
    userInput: String,
    chatbotResponse: String,
    userMemory: String,
  },
  { collection: "eventqueries" }
);

const EventQuery = mongoose.model("EventQuery", EventQuerySchema);

module.exports = EventQuery;
