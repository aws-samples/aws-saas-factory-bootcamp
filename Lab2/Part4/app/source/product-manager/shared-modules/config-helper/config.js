const config = require('config');
var dev = config.get('Config.dev');
var prod = config.get('Config.prod');
const winston = require('winston');

/**
 * Set Configuration of Application, and Environment
 * @param environment
 * @returns The configuration
 */
module.exports.configure = function(environment) {
    var config = {};
    if(environment == null || environment == undefined || environment == 'undefined'){
        var environment = process.env.NODE_ENV;
        if(process.env.NODE_ENV == undefined){
            environment = "development";
        }
    }
        switch(environment) {
        case "production":

            if(process.env.AWS_REGION == undefined || process.env.SERVICE_URL == undefined || process.env.SNS_ROLE_ARN == undefined || process.env.AWS_ACCOUNT_ID == undefined )
            {
                var error = "Production Environment Variables Not Properly Configured. \nPlease ensure AWS_REGION, SERVCE_URL, SNS_ROLE_ARN, AWS_ACCOUNT_ID environment Variables are set."
                throw error;
                break;
            }
            else {
                winston.debug('Currently Running in', + environment);
                var port = prod.port;
                var name = prod.name;
                //var table = prod.table;
                config = {
                    environment: environment,
                    stream_name: prod.stream_name,
                    queue_name: 'https://sqs.' + process.env.AWS_REGION + '.amazonaws.com/' + process.env.AWS_ACCOUNT_ID + '/' + prod.queue_name,
                    // stream_name: process.env.STREAM_NAME,
                    // queue_name: process.env.QUEUE_NAME,
                    //web_client: process.env.WEB_CLIENT,
                    aws_region: process.env.AWS_REGION,
                    cognito_region: process.env.AWS_REGION,
                    aws_account: process.env.AWS_ACCOUNT_ID,
                    domain: process.env.SERVICE_URL,
                    service_url: prod.protocol + process.env.SERVICE_URL,
                    name: name,
                    table: {
                        user: process.env.USER_TABLE,
                        tenant: process.env.TENANT_TABLE,
                        product: process.env.PRODUCT_TABLE,
                        order: process.env.ORDER_TABLE
                    },
                    userRole: prod.userRole,
                    role: {
                        sns: process.env.SNS_ROLE_ARN
                    },
                    tier: prod.tier,
                    port: port,
                    loglevel: prod.log.level,
                    url: {
                        tenant: prod.protocol + process.env.SERVICE_URL + '/tenant',
                        user: prod.protocol + process.env.SERVICE_URL + '/user',
                        product: prod.protocol + process.env.SERVICE_URL + '/product',
                        reg: prod.protocol + process.env.SERVICE_URL + '/reg',
                        auth: prod.protocol + process.env.SERVICE_URL + '/auth',
                        order: prod.protocol + process.env.SERVICE_URL + '/order',
                        sys: prod.protocol + process.env.SERVICE_URL + '/sys'
                    }
                }
                return config;
                break;
            }
        case "development":
            var port = dev.port;
            var name = dev.name;
            var table = dev.table;

            config = {
                environment: environment,
                stream_name: dev.stream_name,
                queue_name: 'https://sqs.' + dev.region + '.amazonaws.com/' + dev.aws_account + '/' + dev.queue_name,
                aws_region: dev.region,
                cognito_region: dev.region,
                aws_account: dev.aws_account,
                domain: dev.domain,
                service_url: dev.protocol + dev.domain,
                name: name,
                table: table,
                userRole: dev.userRole,
                role: dev.role,
                tier: dev.tier,
                port: port,
                loglevel: dev.log.level,
                url: {
                    tenant: dev.protocol + dev.domain + ':' + port.tenant + '/tenant',
                    user: dev.protocol + dev.domain + ':' + port.user +  '/user',
                    product: dev.protocol + dev.domain + ':' + port.product + '/product',
                    reg: dev.protocol + dev.domain + ':' + port.reg + '/reg',
                    auth: dev.protocol + dev.domain + ':' + port.auth + '/auth',
                    sys: dev.protocol + dev.domain + ':' + port.sys + '/sys',
                    order: dev.protocol + dev.domain + ':' + port.order + '/order'
                }
            }

                return config;
                break;

        default:
            var error = 'No Environment Configured. \n Option 1: Please configure Environment Variable. \n Option 2: Manually override environment in config function.';
            throw error;
    }

}
