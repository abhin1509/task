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

const checkContact = async (incomingEmail, phoneNumber, id) => {
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
      (currentOrder.email == incomingEmail && incomingEmail != null) ||
      (currentOrder.phoneNumber == phoneNumber && phoneNumber != null)
    ) {
      isCurrentContactPrimary = false;
      if (currentOrder.linkPrecedence == "primary") {
        primaryContatctId = currentOrder.id;
        if(currentOrder.email) {  // check db email not null
          primaryEmail = currentOrder.email;
        }
        if(currentOrder.phoneNumber) { // check if not null
          primaryNumber = currentOrder.phoneNumber; // check if phoneNumber exists
        }
      } else {
        if(currentOrder.email) {  // check db email not null
          emailsList.add(currentOrder.email);
        }
        if(currentOrder.phoneNumber) { // check phone number not null
          phoneNumbersList.add(currentOrder.phoneNumber);
        }
        secondaryContactIds.push(currentOrder.id);
      }
    }
  }

  // adding current email and phone number to both list
  // bcoz in case of primary email or phone number is not present
  if(incomingEmail) { //incoming email is not null
    emailsList.add(incomingEmail);
  }
  if(phoneNumber) { // incoming no is not null
    phoneNumbersList.add(phoneNumber);
  }
  
  
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
  if (isCurrentContactPrimary) {
    if(phoneNumber) { // incoming no is not null
      phoneNumbers.push(phoneNumber);
    }
    if(incomingEmail) { //incoming email is not null
      emails.push(incomingEmail);
    }
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