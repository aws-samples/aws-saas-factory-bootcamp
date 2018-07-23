'use strict';

//  Express
const express = require('express');
const bodyParser = require('body-parser');
// UUID Generator Module
const uuidV4 = require('uuid/v4');
//Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);
//Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;
//Include Custom Modules
const tokenManager = require('../shared-modules/token-manager/token-manager.js');
const DynamoDBHelper = require('../shared-modules/dynamodb-helper/dynamodb-helper.js');

// Instantiate application
var app = express();
var bearerToken = '';
var tenantId = '';

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    bearerToken = req.get('Authorization');
    if (bearerToken)
        tenantId = tokenManager.getTenantId(req);
    next();
});

var orderSchema = {
    TableName : configuration.table.order,
    KeySchema: [
        { AttributeName: "tenantId", KeyType: "HASH"},  //Partition key
        { AttributeName: "orderId", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "tenantId", AttributeType: "S" },
        { AttributeName: "orderId", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

app.get('/order/health', function(req, res) {
    res.status(200).send({service: 'Order Manager', isAlive: true});
});

// Create REST entry points
app.get('/order/:id', function(req, res) {
    winston.info('Fetching order: ' + req.params.id);

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init params structure with request params
        var params = {
            tenantId: tenantId,
            orderId: req.params.id
        }

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);

        dynamoHelper.getItem(params, credentials, function (err, order) {
            if (err) {
                winston.error('Error getting order: ' + err.message);
                res.status(400).send('{"Error" : "Error getting order"}');
            }
            else {
                winston.debug('Order ' + req.params.id + ' retrieved');
                res.status(200).send(order);
            }
        });
    });
});

app.get('/orders', function(req, res) {
    winston.debug('Fetching Orders for Tenant Id: ' + tenantId);
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        var searchParams = {
            TableName: orderSchema.TableName,
            KeyConditionExpression: "tenantId = :tenantId",
            ExpressionAttributeValues: {
                ":tenantId": tenantId
            }
        };

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);

        dynamoHelper.query(searchParams, credentials, function (error, orders) {
            if (error) {
                winston.error('Error retrieving orders: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving orders"}');
            }
            else {
                winston.debug('Orders successfully retrieved');
                res.status(200).send(orders);
            }

        });
    });
});

app.post('/order', function(req, res) {
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        var order = req.body;
        order.orderId = uuidV4();
        order.tenantId = tenantId;

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);

        dynamoHelper.putItem(order, credentials, function (err, order) {
            if (err) {
                winston.error('Error creating new order: ' + err.message);
                res.status(400).send('{"Error" : "Error creating order"}');
            }
            else {
                winston.debug('Order ' + req.body.title + ' created');
                res.status(200).send({status: 'success'});
            }
        });
    });
});

app.put('/order', function(req, res) {
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init the params from the request data
        var keyParams = {
            tenantId: tenantId,
            orderId: req.body.orderId
        }

        winston.debug('Updating Order Id: ' + req.body.orderId);

        var orderUpdateParams = {
            TableName: orderSchema.TableName,
            Key: keyParams,
            UpdateExpression: "set " +
                "productId=:productId, " +
                "productSKU=:productSKU, " +
                "productDescription=:productDescription, " +
                "dateOrdered=:dateOrdered, " +
                "orderedBy=:orderedBy, " +
                "quantity=:quantity, " +
                "unitCost=:unitCost",
            ExpressionAttributeValues: {
                ":productId": req.body.productId,
                ":productSKU": req.body.productSKU,
                ":productDescription": req.body.productDescription,
                ":dateOrdered":req.body.dateOrdered,
                ":orderedBy":req.body.orderedBy,
                ":quantity":req.body.quantity,
                ":unitCost":req.body.unitCost
            },
            ReturnValues:"UPDATED_NEW"
        };

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);

        dynamoHelper.updateItem(orderUpdateParams, credentials, function (err, order) {
            if (err) {
                winston.error('Error updating order: ' + err.message);
                res.status(400).send('{"Error" : "Error updating order"}');
            }
            else {
                winston.debug('Order ' + req.body.title + ' updated');
                res.status(200).send(order);
            }
        });
    });
});

app.delete('/order/:id', function(req, res) {
    winston.debug('Deleting Order: ' + req.params.id);

    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init parameter structure
        var deleteOrderParams = {
            TableName : orderSchema.TableName,
            Key: {
                tenantId: tenantId,
                orderId: req.params.id
            }
        };

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);

        dynamoHelper.deleteItem(deleteOrderParams, credentials, function (err, order) {
            if (err) {
                winston.error('Error deleting order: ' + err.message);
                res.status(400).send('{"Error" : "Error deleting order"}');
            }
            else {
                winston.debug('Order ' + req.params.id + ' deleted');
                res.status(200).send({status: 'success'});
            }
        });
    });
});


// Start the servers
app.listen(configuration.port.order);
console.log(configuration.name.order + ' service started on port ' + configuration.port.order);
