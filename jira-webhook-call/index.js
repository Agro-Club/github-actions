import * as core from "@actions/core";
import axios from "axios";
async function start() {
    if (!core.getInput("issues"))
        return console.log("There is no issues to call webhook for");
    const webhookUrl = core.getInput("url", { required: true });
    let issues = JSON.parse(core.getInput("issues"));
    if (typeof issues === "string")
        issues = [issues];
    try {
        const response = await axios.post(webhookUrl, {
            data: {
                issues,
            },
        });
        console.log(`Successfully updated issues: ${issues}`, response);
    }
    catch (error) {
        console.error(`Failed to call webhook for issues: ${issues}:\n
        }`, error?.response?.data?.errors ?? error);
    }
}
start();
