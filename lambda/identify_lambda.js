const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

const sendResponse = (code) => {
  return {
    statusCode: code,
    body: JSON.stringify({
      success: "true",
    }),
  };
};

exports.handler = async (event) => {
  try {
    console.log(event);
    const { email, phoneNumber } = JSON.parse(event.body) || {};
    console.log(email, phoneNumber);
    console.log(TABLE_NAME);
    const id = Math.floor(Math.random() * 10000) + 1;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const deletedAt = null;

    const contactAlreadyExisted = false;
    let linkedId = null;
    let linkPrecedence = "primary";
    if (contactAlreadyExisted) {
      linkedId = contactAlreadyExisted;
      linkPrecedence = "secondary";
    }
    const record = {
      id,
      phoneNumber,
      email,
      linkedId,
      linkPrecedence,
      createdAt,
      updatedAt,
      deletedAt,
    };
    console.log(record);
    const dbRes = await dynamoDB
      .put({
        Item: record,
        TableName: TABLE_NAME,
      })
      .promise();
    console.log(dbRes);
    return sendResponse(200);
  } catch (e) {
    console.log(e);
  }
};
