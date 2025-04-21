import * as path from "node:path";
import * as url from "node:url";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import type { Construct } from "constructs";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppRunnerStackProps extends cdk.StackProps {
  serviceName: string;
}

export class AppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    const dockerImageAsset = new ecr_assets.DockerImageAsset(this, "BackendDockerImage", {
      directory: path.join(__dirname, "../.."),
      target: "runner",
      file: "Dockerfile",
      platform: ecr_assets.Platform.LINUX_AMD64,
      ignoreMode: cdk.IgnoreMode.DOCKER,
      exclude: ["**/node_modules/**", "**/cdk.out/**"],
    });

    const transcribePolicyStatement = new iam.PolicyStatement({
      actions: ["transcribe:StartStreamTranscription"],
      resources: ["*"],
    });
    const instanceRole = new iam.Role(this, "AppRunnerInstanceRole", {
      assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });
    instanceRole.addToPolicy(transcribePolicyStatement);

    new apprunner.Service(this, "BackendService", {
      serviceName: props.serviceName,
      source: apprunner.Source.fromAsset({
        imageConfiguration: {
          port: 3000,
          environmentVariables: {
            NODE_ENV: "production",
          },
        },
        asset: dockerImageAsset,
      }),
      autoDeploymentsEnabled: true,
      instanceRole: instanceRole,
    });
  }
}
