const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

const sendResponse = (code, contacts) => {
  return {
    statusCode: code,
    body: JSON.stringify({
      contact: contacts,
    }),
  };
};

const checkContact = async (email, phoneNumber, id) => {
  const res = await dynamoDB
    .scan({
      TableName: TABLE_NAME,
    })
    .promise()
    .catch((error) => {
      console.error(error);
    });

  let primaryContatctId = id;
  let secondaryContactIds = [];
  let emails = [];
  let phoneNumbers = [];
  for (let currentOrder of res.Items) {
    if (
      currentOrder.email == email ||
      currentOrder.phoneNumber == phoneNumber
    ) {
      if (currentOrder.linkPrecedence == "primary") {
        primaryContatctId = currentOrder.id;
        emails.push(currentOrder.email);
        phoneNumbers.push(currentOrder.phoneNumber);
      } else {
        secondaryContactIds.push(currentOrder.id);
        emails.push(currentOrder.email);
        phoneNumbers.push(currentOrder.phoneNumber);
      }
    }
  }
  return { primaryContatctId, secondaryContactIds, emails, phoneNumbers };
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

    const responseItem = await checkContact(email, phoneNumber, id);
    const contactAlreadyExisted =
      responseItem.primaryContatctId != id ? true : false;
    let linkedId = null;
    let linkPrecedence = "primary";
    if (contactAlreadyExisted) {
      linkedId = responseItem.primaryContatctId;
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
    console.log("response: ", responseItem);
    return sendResponse(200, responseItem);
  } catch (e) {
    console.log(e);
  }
};
