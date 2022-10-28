import * as core from "@actions/core";
import axios from "axios";
async function start() {
    if (!core.getInput("issues"))
        return console.log("There is no issues to transfer");
    const jiraToken = core.getInput("jira-token", { required: true });
    const jiraUrl = core.getInput("jira-url", { required: true });
    const jiraUser = core.getInput("jira-username", { required: true });
    const targetTransitionName = core.getInput("target-transition");
    const delimiter = core.getInput("delimiter");
    const issues = core.getInput("issues").split(delimiter);
    const targetTransitionId = core.getInput("target-transition-id");
    if (!targetTransitionName && !targetTransitionId)
        throw new Error("At least one of target-transition or target-transition-id is required");
    const jiraClient = axios.create({
        baseURL: `${jiraUrl}/rest/api/3`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${jiraUser}:${jiraToken}`).toString("base64")}`,
            Accept: "application/json",
        },
    });
    for (const issue of issues) {
        if (targetTransitionName || targetTransitionId) {
            try {
                let currentTargetTransitionId = targetTransitionId;
                if (targetTransitionName && !currentTargetTransitionId) {
                    const response = await jiraClient.get(`issue/${issue}/transitions`);
                    const currentTransition = response.data.transitions.find((t) => t.name === targetTransitionName);
                    if (!currentTransition) {
                        console.error(`Transition id of "${targetTransitionName}" for ${issue} not found!\nAvailable transitions are: ${response.data.transitions
                            .map((t) => `${t.name} (${t.id})`)
                            .join(", ")}`);
                        continue;
                    }
                    currentTargetTransitionId = currentTransition.id;
                }
                await jiraClient.post(`/issue/${issue}/transitions`, {
                    transition: {
                        id: currentTargetTransitionId,
                    },
                });
                console.log(`Issue ${issue} transferred to "${targetTransitionName}"`);
            }
            catch (error) {
                console.error(`Failed to transfer issue ${issue}: ${error?.response?.data?.errorMessages?.[0] ?? error}`);
            }
        }
    }
}
start();
