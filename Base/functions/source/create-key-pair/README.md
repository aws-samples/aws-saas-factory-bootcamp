# Create and Delete an EC2 Key Pair
## Documentation
###Purpose
This Custom CloudFormation Resource creates and deletes an EC2 Key Pair as CloudFormation Does not currently support this.
###Steps
1. Install Node Packages via "npm install"
2. Zip All Files into an Archive
3. Upload Zip Package to S3
4. Navigate to CloudFormation
5. Create a Stack using the cloudformation.template file
5. Enter the S3 Bucket Name, Prefix, and Object Name of the Zip Archive
6. Follow through CloudFormation and Create Stack
7. View outputs of Stack to see the Key Pair