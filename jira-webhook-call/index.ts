import * as core from "@actions/core";
import axios from "axios";

async function start() {
  if (!core.getInput("issues"))
    return console.log("There is no issues to call webhook for");

  const webhookUrl = core.getInput("url", { required: true });
  let issues: string | string[] = JSON.parse(core.getInput("issues"));

  if (typeof issues === "string") issues = [issues];

  try {
    await axios.post(webhookUrl, {
      issues,
    });

    console.log(`Successfully called a hook for issues: ${issues}`);
  } catch (error: any) {
    console.error(
      `Failed to call webhook for issues: ${issues}:\n
        }`,
      error?.response?.data?.errors ?? error
    );
  }
}

start();
