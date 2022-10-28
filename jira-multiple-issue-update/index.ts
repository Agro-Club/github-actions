import * as core from "@actions/core";
import axios from "axios";

async function start() {
  if (!core.getInput("issues"))
    return console.log("There is no issues to update");

  const jiraToken = core.getInput("jira-token", { required: true });
  const jiraUrl = core.getInput("jira-url", { required: true });
  const jiraUser = core.getInput("jira-username", { required: true });
  const delimiter = core.getInput("delimiter");
  const issues = core.getInput("issues").split(delimiter);
  const body = core.getInput("request-body", { required: true });

  const jiraClient = axios.create({
    baseURL: `${jiraUrl}/rest/api/3`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${jiraUser}:${jiraToken}`).toString(
        "base64"
      )}`,
      Accept: "application/json",
    },
  });

  for (const issue of issues) {
    try {
      await jiraClient.put(`/issue/${issue}`, JSON.parse(body));
      console.log(`Successfully updated issue ${issue}`);
    } catch (error: any) {
      console.error(
        `Failed to add label for issue ${issue}:\n
        }`,
        error?.response?.data?.errors ?? error
      );
    }
  }
}

start();
