# Task

Hiring task.

## Tech Stack

Nodejs, AWS Lambda, API Gateway, DynamoDB, AWS CDK

## Hosted API Gateway Url

```
https://1gytjgrn91.execute-api.ap-south-1.amazonaws.com/api/v1/identify/
```

## Instructions:

1. Clone the repo.

```
git clone https://github.com/abhin1509/task.git
```

2. Go to the clonned directory.

```
cd task
```

3. Install dependencies

```
npm install
```
4. Navigate to lambda folder

```
cd lambda
```
5. Install the dependencies for the Lambda functions

```
npm install
```
6. Go back to the task repository

```
cd ..
```
7. Create .env file in root directory and set environment variable from .env.example file

8. Run the following commands to deploy

```
cdk synth
```
```
cdk bootstrap
```
```
cdk deploy
```

#### Assumption:

- If passing same data again and again, secondaryContactIds array will have more id.
- If passing one value either email or phoneNumber null, I am saving that record to database.
- If passing both value null, not saving that record to database.
- Incoming email and phoneNumber not validated.

### Resume

- [Abhinav_Kumar_Resume](https://drive.google.com/file/d/1H8WCihaee73F-7Bz7KDMzHhyo9EkvYPr/view?usp=drive_link)