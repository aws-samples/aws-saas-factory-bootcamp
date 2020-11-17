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

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
	res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
	next();
});

// Create a schema
var productSchema = {
	TableName: configuration.table.product,
	KeySchema: [
		{AttributeName: "tenant_id", KeyType: "HASH"}, //Partition key
		{AttributeName: "product_id", KeyType: "RANGE"}  //Sort key
	],
	AttributeDefinitions: [
		{AttributeName: "tenant_id", AttributeType: "S"},
		{AttributeName: "product_id", AttributeType: "S"}
	],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5
	}
};

app.get('/product/health', function(req, res) {
	res.status(200).send({service: 'Product Manager', isAlive: true});
});

// Create REST entry points
app.get('/product/:id', function(req, res) {
	winston.debug('Fetching product: ' + req.params.id);
	// init params structure with request params
	var params = {
        tenant_id: req.query.tenant_id,
        product_id: req.params.id
	};
	tokenManager.getSystemCredentials(function(credentials) {
		// construct the helper object
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.getItem(params, credentials, function(err, product) {
			if (err) {
				winston.error('Error getting product: ' + err.message);
				res.status(400).send('{"Error": "Error getting product"}');
			} else {
				winston.debug('Product ' + req.params.id + ' retrieved');
				res.status(200).send(product);
			}
		});
	});
});

app.get('/products', function(req, res) {
	var searchParams = {
		TableName: productSchema.TableName,
		KeyConditionExpression: "tenant_id = :tenant_id",
		ExpressionAttributeValues: {
			":tenant_id": req.query.tenant_id
		}
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.query(searchParams, credentials, function(error, products) {
			if (error) {
				winston.error('Error retrieving products: ' + error.message);
				res.status(400).send('{"Error": "Error retrieving products"}');
			} else {
				winston.debug('Products successfully retrieved');
				res.status(200).send(products);
			}
		});
	});
});

app.post('/product', function(req, res) {
	var product = req.body;
	var guid = uuidv4();
	product.product_id = guid;
	product.tenant_id = req.body.tenant_id;
	winston.debug(JSON.stringify(product));
	// construct the helper object
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.putItem(product, credentials, function(err, product) {
			if (err) {
				winston.error('Error creating new product: ' + err.message);
				res.status(400).send('{"Error": "Error creating product"}');
			} else {
				winston.debug('Product ' + req.body.title + ' created');
				res.status(200).send({status: 'success'});
			}
		});
	});
});

app.put('/product', function(req, res) {
	winston.debug('Updating product: ' + req.body.product_id);
	// init the params from the request data
	var keyParams = {
		tenant_id: req.body.tenant_id,
		product_id: req.body.product_id
	};
	var productUpdateParams = {
		TableName: productSchema.TableName,
		Key: keyParams,
		UpdateExpression: "set " +
				"sku = :sku, " +
				"title = :title, " +
				"description = :description, " +
				"#condition = :condition, " +
				"conditionDescription = :conditionDescription, " +
				"numberInStock = :numberInStock, " +
				"unitCost = :unitCost",
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
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.updateItem(productUpdateParams, credentials, function(err, product) {
			if (err) {
				winston.error('Error updating product: ' + err.message);
				res.status(400).send('{"Error": "Error updating product"}');
			} else {
				winston.debug('Product ' + req.body.title + ' updated');
				res.status(200).send(product);
			}
		});
	});
});

app.delete('/product/:id', function(req, res) {
	winston.debug('Deleting product: ' + req.params.id);
	// init parameter structure
	var deleteProductParams = {
		TableName: productSchema.TableName,
		Key: {
			tenant_id: req.query.tenant_id,
			product_id: req.params.id
		}
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.deleteItem(deleteProductParams, credentials, function(err, product) {
			if (err) {
				winston.error('Error deleting product: ' + err.message);
				res.status(400).send('{"Error": "Error deleting product"}');
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
