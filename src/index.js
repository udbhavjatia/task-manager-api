//Importing required modules
const express = require('express');
const userRouter = require("./routers/user.js");
const taskRouter = require("./routers/task.js");
require('./db/mongoose.js'); //Ensures that the file runs and mongoose connects to the mongodb database

const app = express();
const port = process.env.PORT;

app.use(express.json()); //Automatically parses incoming JSON into an object so that we can access it in our request handlers
app.use(userRouter); //To allow our express app to use the routing functions we set up for the User collection
app.use(taskRouter); //To allow our express app to use the routing functions we set up for the Task collection

//To make the server live
app.listen(port, () => {
    console.log(`Server is up and running on ${port}`);
});