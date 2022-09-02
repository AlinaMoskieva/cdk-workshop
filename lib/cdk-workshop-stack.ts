import { URL } from "node:url";
import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejslambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apigwv2Integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface CdkDemoBotStackProps extends cdk.StackProps {
  scope?: string | undefined;
}

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkDemoBotStackProps) {
    super(scope, id, props);

    const secretId = `${props.scope ? `${props.scope}-` : ''}slack-bot-creds`;

    const botSecret = secretsmanager.Secret.fromSecretNameV2(
        this,
        "cdk-demo-bot-creds",
        secretId
    );

    const fn = new nodejslambda.NodejsFunction(this, 'cdk-demo-bot', {
      entry: new URL("../src/index.ts", import.meta.url).pathname,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      bundling: {
        // required for top-level await
        format: nodejslambda.OutputFormat.ESM,
        // dirty hack to get ESM up and running: https://github.com/evanw/esbuild/issues/1921#issuecomment-1152887672
        banner:
            "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
      },
      environment: {
        SECRET_ID: secretId,
      }
    });

    botSecret.grantRead(fn);

    const httpApi = new apigwv2.HttpApi(this, "api");

    const urlpath = "/slack/events";

    httpApi.addRoutes({
      path: urlpath,
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2Integrations.HttpLambdaIntegration(
          "integration",
          fn
      ),
    });

    new cdk.CfnOutput(this, 'api-gateway-url', {
      value: httpApi.apiEndpoint + urlpath,
    });
  }
}