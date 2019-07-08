//Importing required modules
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

//Without middleware: request --> route handler
//With middleware: request --> middleware --> route handler
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token});

        if (!user) {
            throw new Error();
        } else {
            req.token = token;
            req.user = user;
            next(); //To signal to Express that the middleware function is done and it should now forward the request to the route handler
        }
    } catch(e) {
        res.status(401).send({error: 'Please authenticate'});
    }
};

module.exports = auth; //To allow other files to use the auth function
