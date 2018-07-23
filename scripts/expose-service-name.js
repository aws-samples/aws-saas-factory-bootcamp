var fs = require('fs');

// var filePath = "./../app/source/product-manager/build.sh"
var filePath = process.env.BUILD_FILE_PATH;
var newText = process.env.SERVICE_NAME;
var oldText = 'export SERVICE_NAME=PLACEHOLDER';


        var myVar;
        myVar = 'export SERVICE_NAME=' + newText;
        newText = myVar;

        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) {
                return console.log(err);
            }

            var result = data.replace(oldText,newText);
            fs.writeFile(filePath, result, 'utf8', function(err) {
                if (err) {
                    return console.log(err);
                };
            });
        });
