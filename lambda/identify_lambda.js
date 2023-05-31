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

const checkContact = async (email, phoneNumber) => {
  const res = await dynamoDB
    .scan({
      TableName: TABLE_NAME,
    })
    .promise()
    .catch((error) => {
      console.error(error);
    });

  for (let currentOrder of res.Items) {
    if (
      currentOrder.email == email ||
      currentOrder.phoneNumber == phoneNumber
    ) {
      return currentOrder.id;
    }
  }
  return false;
};

exports.handler = async (event) => {
  try {
    console.log(event);
    const { email, phoneNumber } = JSON.parse(event.body) || {};
    const id = Math.floor(Math.random() * 10000) + 1;
    const createdAt = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const updatedAt = createdAt;
    const deletedAt = null;

    const contactAlreadyExisted = await checkContact(email, phoneNumber);
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
    console.log("record:: ", record);
    await dynamoDB
      .put({
        Item: record,
        TableName: TABLE_NAME,
      })
      .promise()
      .catch((error) => {
        console.error(error);
      });
    return sendResponse(200);
  } catch (e) {
    console.log(e);
  }
};
