//Importing required modules
const express = require('express');
const Task = require('../models/task.js');
const auth = require('../middleware/auth.js');

//A router object is created. It can be thought of as a “mini-application,” capable only of performing middleware and routing functions
const router = new express.Router();

//To fetch all the tasks for a given user (Query Strings added to paginate/sort the tasks and filter them by whether or not they were completed)
//Example URL: localhost:3000/tasks?completed=[Boolean]&limit=[Number]&skip=[Number]&sortBy=[fieldName]_asc/desc
router.get('/tasks', auth, async (req, res) => {
    let sort = {};

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    };

    try {
        if (req.query.completed) {
            const match = req.query.completed === 'true';
            const tasks = await Task.find({owner: req.user._id, completed: match}, null, {limit: parseInt(req.query.limit), skip: parseInt(req.query.skip), sort: sort});
            res.send(tasks); //If no tasks are in the collection then an empty array is returned
        } else {
            const tasks = await Task.find({owner: req.user._id}, null, {limit: parseInt(req.query.limit), skip: parseInt(req.query.skip), sort: sort});
            res.send(tasks); //If no tasks are in the collection then an empty array is returned
        }
    } catch (e) {
        res.status(500).send();
    }
}); 

//To fetch just one task by its id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id: _id, owner: req.user._id})
       
        if (!task) {        //A MongoDB query is not considered a failure if no document is returned because no matches were found
            res.status(404).send();
        } else {
            res.send(task);
        }
    } catch (e) {
        res.status(500).send();
    }
});

//To update a task by its id
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        res.status(400).send({error: "Invalid Update"});
    } else {
        const _id = req.params.id;

        try {
            const updatedTask = await Task.findOne({_id: _id, owner: req.user._id});

            if (!updatedTask) {     //A MongoDB query is not considered a failure if no document was updated because no matches were found
                res.status(404).send();
            } else {
                //Pre and post save() hooks are not executed on certain queries such as findByIdAndUpdate() which necessitates writing custom code
                updates.forEach((update) => {updatedTask[update] = req.body[update]})
                await updatedTask.save();
                res.send(updatedTask);
            }
        } catch (e) {
            res.status(400).send(e);
        }
    }

});

//To delete a task by its id
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const deletedTask = await Task.findOneAndDelete({_id: _id, owner: req.user._id});

        if (!deletedTask) {     //A MongoDB query is not considered a failure if no documents were deleted because no matches were found
            res.status(404).send();
        } else {
            res.send(deletedTask);
        }
    } catch (e) {
        res.status(500).send();
    }
});

//To create a new task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router; //To allow other files to use our router middleware

//Refer to https://httpstatuses.com for info on why certain status codes are being used