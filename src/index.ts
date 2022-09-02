import {App, AwsLambdaReceiver} from "@slack/bolt";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";


const secretsManagerClient = new SecretsManagerClient({});
const getSecretValueCommand = new GetSecretValueCommand({ SecretId: process.env["SECRET_ID"] });
const { SecretString } = await secretsManagerClient.send(getSecretValueCommand);
const { BotToken, SigningSecret } = JSON.parse(SecretString!);

const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: SigningSecret,
});

const app = new App({
    token: BotToken,
    receiver: awsLambdaReceiver,
});

export const handler = async (event: any, context: any, callback: any) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}

app.message('goodbye', async ({ say }) => {
    await say(`See ya later`);
});