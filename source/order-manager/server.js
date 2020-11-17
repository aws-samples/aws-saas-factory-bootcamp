'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

// Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

// Configure Logging
const winston = require('winston');
winston.add(new winston.transports.Console({level: configuration.loglevel}));

// Include Custom Modules
const tokenManager = require('../shared-modules/token-manager/token-manager.js');
const DynamoDBHelper = require('../shared-modules/dynamodb-helper/dynamodb-helper.js');

// Instantiate application
var app = express();
var bearerToken = '';
var tenantId = '';

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
	res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
	bearerToken = req.get('Authorization');
	if (bearerToken) {
		tenantId = tokenManager.getTenantId(req);
	}
	next();
});

// Create a schema
var orderSchema = {
    TableName : configuration.table.order,
    KeySchema: [
        { AttributeName: "tenant_id", KeyType: "HASH"},  //Partition key
        { AttributeName: "order_id", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "tenant_id", AttributeType: "S" },
        { AttributeName: "order_id", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

app.get('/order/health', function(req, res) {
    res.status(200).send({service: 'Order Manager', isAlive: true});
});

// Create REST entry points
app.get('/order/:id', function(req, res) {
    winston.debug('Fetching order: ' + req.params.id);
    tokenManager.getCredentialsFromToken(req, function(credentials) {
    	// init params structure with request params
		var params = {
			tenant_id: tenantId,
			order_id: req.params.id
		}
        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);
        dynamoHelper.getItem(params, credentials, function(err, order) {
            if (err) {
                winston.error('Error getting order: ' + err.message);
                res.status(400).send('{"Error" : "Error getting order"}');
            } else {
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
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenantId
            }
        };
        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);
        dynamoHelper.query(searchParams, credentials, function(error, orders) {
            if (error) {
                winston.error('Error retrieving orders: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving orders"}');
            } else {
                winston.debug('Orders successfully retrieved');
                res.status(200).send(orders);
            }
        });
    });
});

app.post('/order', function(req, res) {
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        var order = req.body;
		var guid = uuidv4();
        order.order_id = guid;
        order.tenant_id = tenantId;

        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);
        dynamoHelper.putItem(order, credentials, function(err, order) {
            if (err) {
                winston.error('Error creating new order: ' + err.message);
                res.status(400).send('{"Error" : "Error creating order"}');
            } else {
                winston.debug('Order ' + req.body.title + ' created');
                res.status(200).send({status: 'success'});
            }
        });
    });
});

app.put('/order', function(req, res) {
	winston.debug('Updating order: ' + req.body.order_id);
    tokenManager.getCredentialsFromToken(req, function(credentials) {
        // init the params from the request data
        var keyParams = {
            tenant_id: tenantId,
            order_id: req.body.order_id
        }
        var orderUpdateParams = {
            TableName: orderSchema.TableName,
            Key: keyParams,
            UpdateExpression: "set " +
                "productId = :productId, " +
                "productSKU = :productSKU, " +
                "productDescription = :productDescription, " +
                "dateOrdered = :dateOrdered, " +
                "orderedBy = :orderedBy, " +
                "quantity = :quantity, " +
                "unitCost = :unitCost",
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
        dynamoHelper.updateItem(orderUpdateParams, credentials, function(err, order) {
            if (err) {
                winston.error('Error updating order: ' + err.message);
                res.status(400).send('{"Error" : "Error updating order"}');
            } else {
                winston.debug('Order ' + req.body.order_id + ' updated');
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
                tenant_id: tenantId,
                order_id: req.params.id
            }
        };
        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(orderSchema, credentials, configuration);
        dynamoHelper.deleteItem(deleteOrderParams, credentials, function (err, order) {
            if (err) {
                winston.error('Error deleting order: ' + err.message);
                res.status(400).send('{"Error" : "Error deleting order"}');
            } else {
                winston.debug('Order ' + req.params.id + ' deleted');
                res.status(200).send({status: 'success'});
            }
        });
    });
});

// Start the servers
app.listen(configuration.port.order);
console.log(configuration.name.order + ' service started on port ' + configuration.port.order);
