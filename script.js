const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'eu-north-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, 'eu-north-1_XUkA5Pq9V', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};

app.post('/save-news', verifyToken, (req, res) => {
    const { title, description, url, urlToImage } = req.body;
    const params = {
        TableName: 'NewsTable',
        Item: {
            userId: req.user.sub,
            title,
            description,
            url,
            urlToImage
        }
    };

    dynamoDb.put(params, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving news' });
        }
        res.status(200).json({ message: 'News saved successfully' });
    });
});

app.get('/get-saved-news', verifyToken, (req, res) => {
    const params = {
        TableName: 'NewsTable',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': req.user.sub
        }
    };

    dynamoDb.query(params, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching news' });
        }
        res.status(200).json(data.Items);
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
