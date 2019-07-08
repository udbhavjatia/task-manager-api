//Importing required modules
const mongoose = require('mongoose');

//Connecting node to MongoDB database
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false //Makes findOneAndUpdate() and findOneAndRemove() use native findOneAndUpdate() rather than findAndModify() which is being deprecated
}).then(() => {
    console.log('Established connection to database successfully.');
}).catch(() => {
    console.log('Unable to connect to database.')
});

