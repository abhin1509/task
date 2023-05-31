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
  let primaryEmail = "";
  let primaryNumber = "";
  let emailsList = new Set();
  let phoneNumbersList = new Set();
  let secondaryContactIds = [];

  let isCurrentContactPrimary = true;

  for (let currentOrder of res.Items) {
    if (
      currentOrder.email == email ||
      currentOrder.phoneNumber == phoneNumber
    ) {
      isCurrentContactPrimary = false;
      if (currentOrder.linkPrecedence == "primary") {
        isPrimary = true;
        primaryContatctId = currentOrder.id;
        primaryEmail = currentOrder.email; // check if email exists
        primaryNumber = currentOrder.phoneNumber; // check if phoneNumber exists
      } else {
        emailsList.add(currentOrder.email); // check email
        phoneNumbersList.add(currentOrder.phoneNumber); // check phone number
        secondaryContactIds.push(currentOrder.id);
      }
    }
  }

  // adding current email and phone number to both list
  // bcoz in case of primary email or phone number is not present
  emailsList.add(email);
  phoneNumbersList.add(phoneNumber);

  // if primaryContactId is not current id
  // means current id is also secondary id
  if (primaryContatctId != id) {
    secondaryContactIds.push(id);
  }

  // handling primary email and phone number in first position
  let emails = [];
  if (primaryEmail) {
    // delete duplicate email
    emailsList.delete(primaryEmail);
    //copy all unique emails
    emails = [...emailsList];
    // primary email in first position
    emails.unshift(primaryEmail);
  }
  let phoneNumbers = [];
  if (primaryNumber) {
    phoneNumbersList.delete(primaryNumber);
    phoneNumbers = [...phoneNumbersList];
    phoneNumbers.unshift(primaryNumber);
  }

  // if current contact is primary return same email and phone number
  if(isCurrentContactPrimary) {
    phoneNumbers.push(phoneNumber);
    emails.push(email);
  }

  return { primaryContatctId, emails, phoneNumbers, secondaryContactIds };
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
