console.log('STACK CREATE');
var aws = require('aws-sdk');
var apigateway = new aws.APIGateway({apiVersion: '2015-07-09', region: 'us-east-1'});
var params = {
};
apigateway.getRestApis(params, function(err, data) {
    if (err) {
        console.log(err, err.stack);
    } // an error occurred
    else {
        // console.log(data);           // successful response
        var apis = data.items;
        var api;
        for (var i = 0; i < apis.length; i++) {
            api = apis[i];
            var params = {
                restApiId: api.id /* required */
            };
            console.log(params);
            apigateway.deleteRestApi(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } // an error occurred

                else {
                    console.log(data);
                }
            })
        }
    }
})
