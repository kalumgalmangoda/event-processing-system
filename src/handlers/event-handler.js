const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const DynamoDB = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');
const { LOGGER } = require("../utils");
const csv = require('csv-parser');

const COMPONENT = '[S3EventHandler]   ';

const transformData = (data) => {
  if (data?.id) delete data.id;
  return {
    id: uuid.v4(),
    name: data?.name,
    email: data?.email,
  };
};

const storeInDynamoDB = async (items) => {
  const requests = items.map(item => ({
    PutRequest: {
      Item: item
    }
  }));  

  const params = {
    RequestItems: {
      [process.env.DYNAMODB_TABLE]: requests
    }
  };

  await DynamoDB.batchWrite(params).promise();
};

const parseCSVData = (data) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const s = new stream.Readable();
    s._read = () => {}; // No-op
    s.push(data);
    s.push(null);

    s.pipe(csv())
      .on('data', (row) => results.push(transformData(row)))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const s3EventHandler = async (event, context) => {
  LOGGER.debug(`${COMPONENT}`,"Event received - s3EventHandler", event);

  const itemsToStore = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const params = {
      Bucket: bucket,
      Key: key,
    };

    try {
      const data = await S3.getObject(params).promise();
      const csvData = await parseCSVData(data.Body.toString('utf-8'));

      LOGGER.debug(`${COMPONENT}`,"S3 data - s3EventHandler", data, csvData);

      itemsToStore.push(...csvData);
    } catch (error) {
      LOGGER.error(`${COMPONENT}`, "Error processing S3 data - s3EventHandler", error);
      console.error(error);
    }
  }

  try {
    await storeInDynamoDB(itemsToStore);
    LOGGER.debug(`${COMPONENT}`, "Data stored in DynamoDB - s3EventHandler");
  } catch (error) {
    LOGGER.error(`${COMPONENT}`, "Error storing data in DynamoDB - s3EventHandler", error);
  }
};

const sqsEventHandler = async (event) => {
  LOGGER.debug(`${COMPONENT}`,"Event received - sqsEventHandler", event);

  const itemsToStore = [];

  for (const record of event.Records) {
    const transformedData = transformData(JSON.parse(record.body));
    itemsToStore.push(transformedData);
  }

  if (itemsToStore.length > 0) {
    try {
      await storeInDynamoDB(itemsToStore);
      LOGGER.debug(`${COMPONENT}`, "Data stored in DynamoDB - sqsEventHandler");
    } catch (error) {
      LOGGER.error(`${COMPONENT}`, "Error storing data in DynamoDB - sqsEventHandler", error);
    }
  }
};
module.exports = {
  s3EventHandler,
  sqsEventHandler
};