'use strict';

//  Express
const express = require('express');
const bodyParser = require('body-parser');

//AWS XRAY Integration
var AWSXRay = require('aws-xray-sdk');

// UUID Generator Module
const uuidV4 = require('uuid/v4');

// Configure Environment
const configModule = require('../shared-modules/config-helper/config.js');
var configuration = configModule.configure(process.env.NODE_ENV);

// Configure Logging
const winston = require('winston');
winston.level = configuration.loglevel;

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
app.use(AWSXRay.express.openSegment(configuration.name.product));
app.use(function (req, res, next) {
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
var productSchema = {
	TableName: configuration.table.product,
	KeySchema: [
		{AttributeName: "tenantId", KeyType: "HASH"}, //Partition key
		{AttributeName: "productId", KeyType: "RANGE"}  //Sort key
	],
	AttributeDefinitions: [
		{AttributeName: "tenantId", AttributeType: "S"},
		{AttributeName: "productId", AttributeType: "S"}
	],
	ProvisionedThroughput: {
		ReadCapacityUnits: 10,
		WriteCapacityUnits: 10
	}
};

app.get('/product/health', function (req, res) {
	res.status(200).send({service: 'Product Manager', isAlive: true});
});

// Create REST entry points
app.get('/product/:id', function (req, res) {
	winston.debug('Fetching product: ' + req.params.id);
	// init params structure with request params
	var params = {
		tenantId: tenantId,
		productId: req.params.id
	};
	tokenManager.getSystemCredentials(function (credentials) {
		// construct the helper object
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.getItem(params, credentials, function (err, product) {
			if (err) {
				winston.error('Error getting product: ' + err.message);
				res.status(400).send('{"Error" : "Error getting product"}');
			} else {
				winston.debug('Product ' + req.params.id + ' retrieved');
				res.status(200).send(product);
			}
		});
	});
});

app.get('/products', function (req, res) {
	winston.debug('Fetching Products for Tenant Id: ' + tenantId);
	var searchParams = {
		TableName: productSchema.TableName,
		KeyConditionExpression: "tenantId = :tenantId",
		ExpressionAttributeValues: {
			":tenantId": tenantId
			//":tenantId": "<INSERT TENANTTWO GUID HERE>"
		}
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function (credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.query(searchParams, credentials, function (error, products) {
			if (error) {
				winston.error('Error retrieving products: ' + error.message);
				res.status(400).send('{"Error" : "Error retrieving products"}');
			} else {
				winston.debug('Products successfully retrieved');
				res.status(200).send(products);
			}

		});
	});
});

app.post('/product', function (req, res) {
	var product = req.body;
	product.productId = uuidV4();
	product.tenantId = tenantId;

	// construct the helper object
	tokenManager.getSystemCredentials(function (credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);

		dynamoHelper.putItem(product, credentials, function (err, product) {
			if (err) {
				winston.error('Error creating new product: ' + err.message);
				res.status(400).send('{"Error" : "Error creating product"}');
			} else {
				winston.debug('Product ' + req.body.title + ' created');
				res.status(200).send({status: 'success'});
			}
		});
	});
});

app.put('/product', function (req, res) {
	winston.debug('Updating product: ' + req.body.productId);
	// init the params from the request data
	var keyParams = {
		tenantId: tenantId,
		productId: req.body.productId
	};
	winston.debug('Updating product: ' + req.body.productId);
	var productUpdateParams = {
		TableName: productSchema.TableName,
		Key: keyParams,
		UpdateExpression: "set " +
				"sku=:sku, " +
				"title=:title, " +
				"description=:description, " +
				"#condition=:condition, " +
				"conditionDescription=:conditionDescription, " +
				"numberInStock=:numberInStock, " +
				"unitCost=:unitCost",
		ExpressionAttributeNames: {
			'#condition': 'condition'
		},
		ExpressionAttributeValues: {
			":sku": req.body.sku,
			":title": req.body.title,
			":description": req.body.description,
			":condition": req.body.condition,
			":conditionDescription": req.body.conditionDescription,
			":numberInStock": req.body.numberInStock,
			":unitCost": req.body.unitCost
		},
		ReturnValues: "UPDATED_NEW"
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function (credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.updateItem(productUpdateParams, credentials, function (err, product) {
			if (err) {
				winston.error('Error updating product: ' + err.message);
				res.status(400).send('{"Error" : "Error updating product"}');
			} else {
				winston.debug('Product ' + req.body.title + ' updated');
				res.status(200).send(product);
			}
		});
	});
});

app.delete('/product/:id', function (req, res) {
	winston.debug('Deleting product: ' + req.params.id);
	// init parameter structure
	var deleteProductParams = {
		TableName: productSchema.TableName,
		Key: {
			tenantId: tenantId,
			productId: req.params.id
		}
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function (credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.deleteItem(deleteProductParams, credentials, function (err, product) {
			if (err) {
				winston.error('Error deleting product: ' + err.message);
				res.status(400).send('{"Error" : "Error deleting product"}');
			} else {
				winston.debug('Product ' + req.params.id + ' deleted');
				res.status(200).send({status: 'success'});
			}
		});
	});
});


// Start the servers
app.listen(configuration.port.product);
console.log(configuration.name.product + ' service started on port ' + configuration.port.product);
app.use(AWSXRay.express.closeSegment());
