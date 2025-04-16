#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AppRunnerStack } from "./app-runner-stack.ts";

const app = new cdk.App();

// App Runnerスタックの作成
new AppRunnerStack(app, "TranscriptionAppRunnerStack", {
  serviceName: "TranscriptionService",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  },
  description: "Stack for Transcription Service using App Runner",
});

app.synth();
