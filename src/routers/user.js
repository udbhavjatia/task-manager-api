//Importing requiered modules
const express = require('express');
const User = require('../models/user.js');
const auth = require('../middleware/auth.js');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const sendEmail = require('../emails/account.js');

//Defining where the uploaded files should be saved
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/

        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            cb(null, true);
        } else {
            cb(new Error('Only images can be uploaded'));
        }
    }
});

//A router object is created. It can be thought of as a “mini-application,” capable only of performing middleware and routing functions
const router = new express.Router();

//To fetch a user's profile who is authenticated
router.get('/users/me', auth, async (req, res) => {
    
    try {   //If anything in the try block throws an error, then we use the catch block to handle that error
        res.send(req.user);            
    } catch (e) {
        res.status(500).send();
    }
});

//To allow a user to update their own profile (Need to be authenticated)
router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    //If you try to update properties that do not exist, mongoose will just ignore them but the client-side will not show any error by default (Hence, we have to write some custom code to handle this error)
    if (!isValidOperation) {
        res.status(400).send({error: "Invalid Update"});
    } else {
        try {   
            updates.forEach((update) => {req.user[update] = req.body[update]});
            await req.user.save();
            res.send(req.user);
        } catch(e) {
            res.status(400).send(e);
        }
    }
});

//To allow a user to delete their own profile (Need to be authenticated)
router.delete('/users/me', auth, async (req, res) => {

    try {
        await User.findOneAndDelete({_id: req.user._id});
        sendEmail.sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

//To allow someone to create a new account (Public)
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save(); //await keyword makes the Javascript wait till the promise settles either successfully or unsuccessfully before resuming execution
        const token = await user.generateAuthToken();
        sendEmail.sendWelcomeEmail(user.email, user.name);
        res.status(201).send({user: user, token: token}); 
    } catch (e) {
        res.status(400).send(e); 
    }
});

//To allow users to log-in (Public)
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken()
        res.send({user: user, token: token});
    } catch (e) {
        res.status(400).send();
    }
});

//To allow a user to logout of one session (Need to be authenticated)
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

//To allow a user to logout of all sessions (Need to be authenticated)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

//To allow a user to upload a profile picture (Need to be authenticated)
//Multer Middleware: Request --> Multer Middleware (Upload validated and saved) --> Route Handler
//Important to add the user authenticated middleware before the multer middleware so that the request goes through it first
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().resize({width: 250, height: 250}).toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
}) //If a middleware function throws an error, Express will immediately skip to the next middleware function that accepts an argument and execute that one
   //We cannot use a try-catch block to handle multer error as try-catch can only catch errors thrown within the try block and not errors thrown from a middleware function

//To allow a user to delete their profile picture (Need to be authenticated)
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

//To fetch a user's profile picture (Public)
router.get('/users/:id/avatar', async (req, res) => {
    const user = await User.findById(req.params.id);

    try {
        if (!user || !user.avatar) {
            throw new Error();
        } else {
            res.set('Content-Type', 'image/png');
            res.send(user.avatar);
        }
    } catch (e) {
        res.status(404).send();
    }
})

module.exports = router;    //To allow other files to use our router middleware

//Refer to https://httpstatuses.com for info on why certain status codes are being used