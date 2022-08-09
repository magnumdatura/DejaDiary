const mongoose = require("mongoose");

const TextQuerySchema = new mongoose.Schema(
  {
    userInput: String,
    chatbotResponse: String,
    userMemory: String,
    eventLocation: String,
    eventType: String,
    eventDate: String,
    eventTime: String,
    eventPerson: String,
  },
  { timestamps: true },
  { collection: "textqueries" }
);

const TextQuery = mongoose.model("TextQuery", TextQuerySchema);

module.exports = TextQuery;
