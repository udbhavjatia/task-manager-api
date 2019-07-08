//Importing required modules
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task.js');

//Defining the User schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email provided.') //When an error occurs, Javascript will normally stop and generate an error message (The technical term is Javascript will throw an exception)
            }                                              //Runtime errors result in new Error objects being created and thrown
        }
    },

    password: {
        type: String, 
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password is invalid.');
            }
        }
    },

    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number.');
            }
        }
    },
    tokens: [{          //tokens: An array of objects
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true //Enabling timestamps to assign createdAt and updatedAt fields to your schema
});

//Setting up a virtual property on the User Schema
//Virtuals are document properties that you can get and set but that do not get persisted to MongoDB
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

//Adding an instance method to User Schema to generate an authentication token whenever a user signs up or logs in
//Tokens consist of three pieces of base64 encoded strings: 1) Meta information about what type of token it is, 2) Payload which contains the identifiable data we provided and an 'issued at timestamp', 3) Signature used to verify the token
userSchema.methods.generateAuthToken = async function() {
    const user = this; //'this' refers to the user document on which the instance method is called
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    
    user.tokens = user.tokens.concat({token: token});
    await user.save();

    return token;
}

//To not expose the password and the tokens a user profile to the client
//The toJSON() function is called before the user document is converted into JSON as part of the response handler
userSchema.methods.toJSON = function() {
    const user = this;

    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

//Adding a static function to the User Schema to check and verify the credentials of those trying to login
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email: email})

    if (!user) {
        throw new Error('Unable to login'); //When an error is thrown, Javascript will stop and generate an error message
    } 
    
    const isPasswordMatch = await bcrypt.compare(password, user.password); //The compare method is used to compare a plain text password to a previously hashed password
    
    if (!isPasswordMatch) {
        throw new Error('Unable to login');
    }
    
    return user;
};

//Setting up document middleware for User schema to hash the plaintext password before saving a user document
//We cannot use an arrow function as the callback as the 'this' binding plays a crucial role in this function
userSchema.pre('save', async function(next) {
    const user = this; //'this' refers to the document (In document middleware)

    if (user.isModified('password')) {  //Will return true if we are creating a new user or updating the password of an existing user
        user.password = await bcrypt.hash(user.password, 8);
    }

    next(); //Tells the function to perform the event (in this case 'save') as all the code has finished running
});

//Setting up Query middleware for User Schema to delete all tasks associated with a user when they delete themselves
userSchema.pre('findOneAndDelete', async function(next) {
    await Task.deleteMany({owner: this.getQuery()._id});

    next();
});

//Creating the users collection
//Mongoose takes the model name and lowercases + pluralizes it automatically and creates a collection in the database
const User = mongoose.model('User', userSchema);

module.exports = User; //To allow other files to use the User model