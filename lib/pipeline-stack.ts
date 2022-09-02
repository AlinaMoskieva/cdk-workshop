import type {Construct} from "constructs";
import {Stack, StackProps, Stage, StageProps} from "aws-cdk-lib";
import {
    CodeBuildStep,
    CodePipeline,
    CodePipelineSource,
    ConnectionSourceOptions,
    FileSet,
    ManualApprovalStep
} from "aws-cdk-lib/pipelines";
import {CdkWorkshopStack} from "./cdk-workshop-stack.js";

interface PipelineStackProps extends StackProps {
    scope?: string | undefined;
}

class CodeBuildStepWithPrimarySource extends CodeBuildStep {
    override get primaryOutput(): FileSet {
        return super.primaryOutput!;
    }
}

abstract class CodePipelineSourceWithPrimarySource extends CodePipelineSource {
    override get primaryOutput(): FileSet {
        return super.primaryOutput!;
    }

    static override connection(
        repoString: string,
        branch: string,
        props: ConnectionSourceOptions
    ): CodePipelineSourceWithPrimarySource {
        return CodePipelineSource.connection(
            repoString,
            branch,
            props
        ) as CodePipelineSourceWithPrimarySource;
    }
}

interface PipelineStackProps extends StackProps {
    scope?: string | undefined;
    stagingAccount: string;
    stagingRegion: string;
    productionAccount: string;
    productionRegion: string;
}

export class PipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);
        console.log({scope, id, props});

        const pipeline = new CodePipeline(this, "CdkWorkshopPipeline", {
            dockerEnabledForSynth: true,
            synth: new CodeBuildStepWithPrimarySource("SynthStep", {
                input: CodePipelineSourceWithPrimarySource.connection(
                    "AlinaMoskieva/cdk-workshop",
                    "main",
                    {
                        connectionArn: "arn:aws:codestar-connections:us-west-2:276097718844:connection/565adeba-2951-4965-8324-6fd6056409ef",
                        triggerOnPush: true,
                    }
                ),
                commands: [
                    'npm install',
                    `DIL_CDK_SCOPE=${props.scope || ''} npm run -- cdk synth -a "npx ts-node --esm bin/pipeline.ts"`,
                ],
            })
        });

        pipeline.addStage(new CdkWorkshopDeployStage(this, "Staging", {
            scope: props.scope,
            env: {
                account: props.stagingAccount,
                region: props.stagingRegion,
            }
        }));

        pipeline.addStage(new CdkWorkshopDeployStage(this, "Production", {
            scope: props.scope,
            env: {
                account: props.productionAccount,
                region: props.productionRegion,
            }
        }), {
            pre: [new ManualApprovalStep('Approve')]
        });

        pipeline.buildPipeline();
    }
}

interface CdkWorkshopDeployStageProps extends StageProps {
    scope?: string | undefined;
}

class CdkWorkshopDeployStage extends Stage {
    constructor(scope: Construct, id: string, props: CdkWorkshopDeployStageProps) {
        super(scope, id, props);

        new CdkWorkshopStack(this, "CdkWorkshopStack", {
            stackName: `${props.scope ? `${props.scope}-` : ''}-${id}-cdk-workshop-bot`,
            scope: props.scope,
        });
    }
}