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
var kinesis = new aws.Kinesis({apiVersion: '2013-12-02', region: region});
if (process.env.KINESIS_RECORDS_FILE_PATH) {
    filePath = process.env.KINESIS_RECORDS_FILE_PATH;
}
else {
    filePath = "./kinesis-records.json";
}
var params = {
    StreamName: 'module-saas-bootcamp-base' /* required */
};
console.log('GETTING SHARDS');
kinesis.listShards(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
        // console.log(data);           // successful response
        var today = new Date();
        var hourago = new Date(today.getTime() - (1000 * 120 * 120));

        var params = {
            ShardId: data.Shards[0].ShardId, /* required */
            ShardIteratorType: "AT_TIMESTAMP",
            StreamName: 'module-saas-bootcamp-base', /* required */
            Timestamp: hourago
        };
        console.log('GETTING SHARD ITERATOR');
        kinesis.getShardIterator(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                var params = {
                    ShardIterator: data.ShardIterator /* required */
                };
                console.log('GETTING RECORDS');
                kinesis.getRecords(params, function (err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                        var myData = [];
                        // console.log(data.Records);
                        for (i = 0; i < data.Records.length; i++) {
                            myData[i] = data.Records[i];
                            myData[i].Data = new Buffer(myData[i].Data, 'base64').toString('ascii');
                            myData[i].Data = JSON.parse(myData[i].Data);
                        }
                        if (myData == null || myData == undefined) {
                            console.log('error no data');
                        }
                        else {
                            var inputData = JSON.stringify(myData);
                            var finalData = inputData.replace(/\\/g, '');
                            console.log('WRITING FILE');
                            fs.writeFile(filePath, inputData, function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                                else {
                                    console.log("The file was saved!");
                                }
                            });
                        }

                    }
                })
            }
        })
    }
});



