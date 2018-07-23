var fs = require('fs');

var filePath = "/home/ec2-user/.aws/credentials"

fs.unlink(filePath, function(error) {
    if (error) {
        throw error;
    }
    console.log('Deleted file', filePath);
});


//Create these credentials
//[default]
//aws_access_key_id=PLACEHOLDER
//aws_secret_access_key=PLACEHOLDER