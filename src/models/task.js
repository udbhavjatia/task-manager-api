//Importing required modules
const mongoose = require('mongoose');

//Defining the Task schema
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },

    completed: {
        type: Boolean,
        default: false
    },
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

//Creating the tasks collection
const Task = mongoose.model('Task', taskSchema);

module.exports = Task; //To allow other files to use the Task model