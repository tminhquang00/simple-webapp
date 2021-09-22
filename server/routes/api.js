const express = require('express');
const router = express.Router();
const { pipeline } = require('stream');
const { promisify } = require('util');
var async = require('async');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users.
 *     description: Searching through all the records’ usernames and emails containing the string provided from a query parameter, then return the filtered records
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         description: the name to query.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of samples containing detailed information.
 *       500:
 *         description: Query name is undefined or error in internal database.
 */
router.get('/users', async(req, res, next) => {
    const contact = req.app.mongodb.db('contact');
    let name = null;
    let pipeline;

    // Get all data if query not found
    if (req.query.name === undefined) {
        return res
            .status(500)
            .json({ error: 'true', result: 'Query name is undefined!' });
    } else {
        name = req.query.name.toString();
        pipeline = [{
            $match: {
                username: { $regex: name.toLowerCase() },
                email: { $regex: name.toLowerCase() },
            },
        }, ];

        contact
            .collection('users')
            .aggregate(pipeline)
            .toArray((err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ error: 'true', result: 'Error in MongoDB' });
                } else {
                    return res.status(200).json({ error: 'false', result: result });
                }
            });
    }
});

/**
 * @swagger
 * /api/update:
 *   update:
 *     summary: Update users in database.
 *     description: Accept a payload of multiple records and update those records based on ID 
 *     requestBody:
 *       description: Input must be in Json format
 *       required: true
 *     responses:
 *       200:
 *         description: A message to confirm that document is modified.
 *       400:
 *         description: Query body is undefined or error in internal database.
 */
router.post('/update', async(req, res, next) => {
    const contact = req.app.mongodb.db('contact');
    let users = null;

    // Get all data if query not found
    if (req.body === undefined) {
        return res
            .status(500)
            .json({ error: 'true', result: 'Query users is undefined!' });
    } else {
        users = req.body;

        async.each(
            users,
            function iteratee(i, callback) {
                var options = { upsert: false };

                contact.collection('users').updateOne({ id: i.id }, {
                    $set: {
                        username: i.username.toLowerCase(),
                        email: i.email.toLowerCase(),
                        birthdate: i.birthdate,
                    },
                }, options, function(item_err, results) {
                    if (item_err) {
                        callback(400);
                    } else if (
                        results === '' ||
                        results === undefined ||
                        results === null
                    ) {
                        callback(400);
                    } else {
                        callback(200);
                    }
                });
            },
            
            function(err) {
                // Passing the status code only for the example.
                // `err` should be an object with more metadata probably
                if (err === 400) {
                    res.sendStatus(err);
                    return;
                }
                res.status(200).json({ error: 'false', message: 'Document updated' });
            }
        );
    }
});

module.exports = router;