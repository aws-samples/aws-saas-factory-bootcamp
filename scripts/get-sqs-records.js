var fs = require('fs');
var aws = require('aws-sdk');
var region;
if (process.env.AWS_DEFAULT_REGION) {
    region = process.env.AWS_DEFAULT_REGION;
}
else {
    region = 'us-east-1';
}
var filePath;
var sqs = new aws.SQS({apiVersion: '2012-11-05', region: region});
if (process.env.SQS_RECORDS_FILE_PATH) {
    filePath = process.env.SQS_RECORDS_FILE_PATH;
}
else {
    filePath = "./sqs-records.json";
}

var params = {
    QueueNamePrefix: 'module-saas-bootcamp-base'
};
console.log('GETTING QUEUES');
sqs.listQueues(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else    {
        var params = {
            QueueUrl: data.QueueUrls[0] , /* required */
            MaxNumberOfMessages: 10,
        };

        console.log('GETTING MESSAGES');
        sqs.receiveMessage(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                var myData = data;
                for (i = 0; i < data.Messages.length; i++) {

                    myData.Messages[i].Body = JSON.parse(myData.Messages[i].Body);
                }
                var inputData = JSON.stringify(myData);
                var finalData = inputData.replace(/\\/g, '');
                console.log('WRITING FILE');
                fs.writeFile(filePath, finalData, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    else {
                        console.log("The file was saved!");
                    }
                });
            }
        });
    }
});



