import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as dotenv from "dotenv";

dotenv.config();

const TABLE_NAME = process.env.TABLE_NAME as string;
const STAGE_NAME = process.env.STAGE_NAME as string || "dev";
const API_VERSION = process.env.API_VERSION as string || "v1";

export class BitespeedTaskStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const identifyLambda = new lambda.Function(this, "IdentifyLambdaHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "identify_lambda.handler",
      timeout: cdk.Duration.minutes(1),
      ephemeralStorageSize: cdk.Size.mebibytes(512),
      memorySize: 128,
      environment: {
        TABLE_NAME,
      },
    });

    // API Gateway REST API
    const api = new apigw.LambdaRestApi(this, "Endpoint", {
      handler: identifyLambda,
      proxy: false,
      deployOptions: {
        stageName: STAGE_NAME,
      },
    });

    const apiResource = api.root.addResource(API_VERSION);
    const apiEndpoint = apiResource.addResource("identify");
    apiEndpoint.addMethod("POST", new apigw.LambdaIntegration(identifyLambda));

    // contack Db
    const contactDb = new dynamodb.Table(this, "contactTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      tableName: TABLE_NAME,
    });

    // grant the lambda role read/write permissions to our table
    contactDb.grantReadWriteData(identifyLambda);
  }
}
