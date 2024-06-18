<!--
title: 'AWS Simple HTTP Endpoint example in NodeJS'
description: 'This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.'
layout: Doc
framework: v4
platform: AWS
language: nodeJS
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, Inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

# Serverless Framework Node HTTP API on AWS

This template demonstrates how to process events from S3 and SQS using Node.js running on AWS Lambda and DynamoDB using the Serverless Framework.

## Usage

### Deployment

In order to deploy the example, you need to run the following command:

```
serverless deploy
```

After running deploy, you should see output similar to:

```
Deploying "event-processing-system" to stage "dev" (us-east-1)

✔ Service deployed to stack event-processing-system-dev (132s)

functions:
  s3EventHandler: event-processing-system-dev-s3EventHandler (3.7 kB)
  sqsEventHandler: event-processing-system-dev-sqsEventHandler (3.5 kB)
```

## S3 Event Processing

The `s3EventHandler` function processes CSV files uploaded to a specified S3 bucket. The data is transformed and stored in a DynamoDB table.

Upload a CSV file to the S3 bucket with the prefix `uploads/` and suffix `.csv`.

## SQS Event Processing

The `sqsEventHandler` function processes messages from an SQS queue. The data is transformed and stored in the same DynamoDB table.

## Invocation

### S3 Event Invocation

After successful deployment, upload a CSV file to your S3 bucket. The Lambda function will be triggered, processing the CSV data and storing it in DynamoDB.

### SQS Event Invocation

Send a message to the SQS queue. The Lambda function will be triggered, processing the message and storing it in DynamoDB.

## Local Development

The easiest way to develop and test your function is to use the `serverless invoke local` command:

```
serverless invoke local --function s3EventHandler --path event-mock.json
```

or

```
serverless invoke local --function sqsEventHandler --path event-mock.json
```

This will execute the function locally using the provided mock event data in `event-mock.json`.

## Environment Variables

Ensure the following environment variables are set:

DYNAMODB_TABLE: The name of the DynamoDB table where data will be stored.

## Project Structure

```
.
├── serverless.yml        # Serverless service configuration
├── src
│   └── handlers
│       └── s3-event-handler.js  # S3 event handler function
│       └── sqs-event-handler.js  # SQS event handler function
└── utils
    └── index.js          # Utility functions (e.g., logger)
```

## serverless.yml

Here's a brief explanation of key sections in the `serverless.yml` file:

provider: Specifies the AWS provider configuration.
functions: Defines the Lambda functions and their associated events.
resources: Defines the DynamoDB table resource.
custom: Defines custom variables like the bucket name and DynamoDB table name.

```
org: kalumgalmangoda
app: event-processing-system
service: event-processing-system

provider:
  name: aws
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  iam:
    role:
      name: ${self:provider.stage}-lambdaRole
      statements:
        - Effect: 'Allow'
          Resource: '*'
          Action: 'dynamodb:*'
        - Effect: 'Allow'
          Resource: '*'
          Action: 'sqs:*'
        - Effect: 'Allow'
          Resource: '*'
          Action: 's3:*'

  environment:
    DYNAMODB_TABLE: ${self:custom.dynamoDbTableName}

custom:
  timestamp: ${file(./timestamp.js)}
  bucketName: s3-event-bucket-${self:provider.stage}-${self:custom.timestamp}
  dynamoDbTableName: event-processing-table-${self:provider.stage}

functions:
  s3EventHandler:
    handler: src/handlers/s3-event-handler.s3EventHandler
    events:
      - s3:
          bucket: ${self:custom.bucketName}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .csv

  sqsEventHandler:
    handler: src/handlers/sqs-event-handler.sqsEventHandler
    events:
      - sqs:
          arn:
            Fn::GetAtt: [SQSQueue, Arn]

resources:
  Resources:
    DynamoDbTable:
      Type: "AWS::DynamoDB::Table"
      Properties:
        TableName: ${self:custom.dynamoDbTableName}
        AttributeDefinitions:
          - AttributeName: "id"
            AttributeType: "S"
        KeySchema:
          - AttributeName: "id"
            KeyType: "HASH"
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1

    SQSQueue:
      Type: AWS::SQS::Queue
```

## Logging

The included `LOGGER` utility helps to manage logs across different environments.

## Error Handling

The `s3EventHandler` and `sqsEventHandler` functions include basic error handling to log errors and continue processing.

## Conclusion

This project template sets up a robust event processing system using S3, SQS, Lambda, and DynamoDB with the Serverless Framework. Modify and extend the handlers and configurations as needed to suit your application's requirements.