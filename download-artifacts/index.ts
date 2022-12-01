import * as core from "@actions/core";
import * as github from "@actions/github";
import * as artifact from "@actions/artifact";
import AdmZip from "adm-zip";
import { filesize } from "filesize";
import * as pathname from "path";
import * as fs from "fs";

async function downloadAction(name: string, path: string) {
  const artifactClient = artifact.create();
  const downloadOptions = {
    createArtifactFolder: false,
  };
  await artifactClient.downloadArtifact(name, path, downloadOptions);
  core.setOutput("found_artifact", true);
}

async function main() {
  try {
    const token = core.getInput("github_token", { required: true });
    const [owner, repo] = core.getInput("repo", { required: true }).split("/");
    const path = core.getInput("path", { required: true });
    const name = core.getInput("name");
    const nameRegexp = core.getInput("nameRegexp");
    const nameRegexpObj = new RegExp(nameRegexp, "gmi");

    const skipUnpack = core.getBooleanInput("skip_unpack");
    const ifNoArtifactFound = core.getInput("if_no_artifact_found");
    let workflow = core.getInput("workflow")
      ? Number(core.getInput("workflow"))
      : undefined;
    let workflowConclusion = core.getInput("workflow_conclusion");
    let pr = core.getInput("pr") ? Number(core.getInput("pr")) : undefined;
    let commit = core.getInput("commit");
    let branch = core.getInput("branch");
    let event = core.getInput("event");
    let runID = core.getInput("run_id")
      ? Number(core.getInput("run_id"))
      : undefined;
    let runNumber = core.getInput("run_number")
      ? Number(core.getInput("run_number"))
      : undefined;
    let checkArtifacts = core.getBooleanInput("check_artifacts");
    let searchArtifacts =
      core.getBooleanInput("search_artifacts") || !name
        ? Boolean(nameRegexp)
        : false;
    let dryRun = core.getInput("dry_run");

    const client = github.getOctokit(token);

    core.info(`==> Repository: ${owner}/${repo}`);
    core.info(`==> Artifact name: ${name || nameRegexp}`);
    core.info(`==> Local path: ${path}`);

    if (!workflow) {
      const run = await client.rest.actions.getWorkflowRun({
        owner: owner,
        repo: repo,
        run_id: runID || github.context.runId,
      });
      workflow = run.data.workflow_id;
    }

    core.info(`==> Workflow name: ${workflow}`);
    core.info(`==> Workflow conclusion: ${workflowConclusion}`);

    const inputs = [pr, commit, branch, runID].filter(Boolean);
    if (inputs.length > 1) {
      throw new Error(
        `The following inputs cannot be used together: pr, commit, branch, runID.`
      );
    }

    if (pr) {
      core.info(`==> PR: ${pr}`);
      const pull = await client.rest.pulls.get({
        owner: owner,
        repo: repo,
        pull_number: pr,
      });
      commit = pull.data.head.sha;
      //branch = pull.data.head.ref
    }

    if (commit) {
      core.info(`==> Commit: ${commit}`);
    }

    if (branch) {
      branch = branch.replace(/^refs\/heads\//, "");
      core.info(`==> Branch: ${branch}`);
    }

    if (event) {
      core.info(`==> Event: ${event}`);
    }

    if (runNumber) {
      core.info(`==> Run number: ${runNumber}`);
    }

    if (!runID) {
      // Note that the runs are returned in most recent first order.
      for await (const runs of client.paginate.iterator(
        client.rest.actions.listWorkflowRuns,
        {
          owner: owner,
          repo: repo,
          workflow_id: workflow,
          ...(branch ? { branch } : {}),
          ...(event ? { event } : {}),
        }
      )) {
        for (const run of runs.data) {
          if (commit && run.head_sha != commit) {
            continue;
          }
          if (runNumber && run.run_number != runNumber) {
            continue;
          }
          if (
            workflowConclusion &&
            workflowConclusion != run.conclusion &&
            workflowConclusion != run.status
          ) {
            continue;
          }
          if (checkArtifacts || searchArtifacts) {
            let artifacts = await client.rest.actions.listWorkflowRunArtifacts({
              owner: owner,
              repo: repo,
              run_id: run.id,
            });
            if (artifacts.data.artifacts.length == 0) {
              continue;
            }
            if (searchArtifacts) {
              const artifact = artifacts.data.artifacts.find((artifact) => {
                return nameRegexp
                  ? nameRegexpObj.test(artifact.name)
                  : artifact.name == name;
              });
              if (!artifact) {
                continue;
              }
            }
          }
          runID = run.id;
          core.info(`==> (found) Run ID: ${runID}`);
          core.info(`==> (found) Run date: ${run.created_at}`);
          break;
        }
        if (runID) {
          break;
        }
      }
    }

    if (!runID) {
      if (workflowConclusion && workflowConclusion != "in_progress") {
        return setExitMessage(
          ifNoArtifactFound,
          "no matching workflow run found with any artifacts?"
        );
      }

      try {
        return await downloadAction(name, path);
      } catch (error) {
        return setExitMessage(
          ifNoArtifactFound,
          "no matching artifact in this workflow?"
        );
      }
    }

    let artifacts = await client.paginate(
      client.rest.actions.listWorkflowRunArtifacts,
      {
        owner: owner,
        repo: repo,
        run_id: runID,
      }
    );

    // One artifact or all if `name` input is not specified.
    if (name || nameRegexp) {
      const filtered = artifacts.filter((artifact) => {
        return nameRegexp
          ? nameRegexpObj.test(artifact.name)
          : artifact.name == name;
      });
      if (filtered.length == 0) {
        core.info(`==> (not found) Artifact: ${name}`);
        core.info("==> Found the following artifacts instead:");
        for (const artifact of artifacts) {
          core.info(`\t==> (found) Artifact: ${artifact.name}`);
        }
      }
      artifacts.total_count = filtered.length;
      artifacts.artifacts = filtered;
    }

    core.setOutput("artifacts", artifacts);

    if (dryRun) {
      if (artifacts.length == 0) {
        core.setOutput("dry_run", false);
        core.setOutput("found_artifact", false);
        return;
      } else {
        core.setOutput("dry_run", true);
        core.setOutput("found_artifact", true);
        core.info("==> (found) Artifacts");
        for (const artifact of artifacts) {
          const size = filesize(artifact.size_in_bytes, { base: 10 });
          core.info(`\t==> Artifact:`);
          core.info(`\t==> ID: ${artifact.id}`);
          core.info(`\t==> Name: ${artifact.name}`);
          core.info(`\t==> Size: ${size}`);
        }
        return;
      }
    }

    if (artifacts.length == 0) {
      return setExitMessage(ifNoArtifactFound, "no artifacts found");
    }

    core.setOutput("found_artifact", true);

    for (const artifact of artifacts) {
      core.info(`==> Artifact: ${artifact.id}`);

      const size = filesize(artifact.size_in_bytes, { base: 10 });

      core.info(`==> Downloading: ${artifact.name}.zip (${size})`);

      let zip: any;
      try {
        zip = await client.rest.actions.downloadArtifact({
          owner: owner,
          repo: repo,
          artifact_id: artifact.id,
          archive_format: "zip",
        });
      } catch (error: any) {
        if (error.message === "Artifact has expired") {
          return setExitMessage(
            ifNoArtifactFound,
            "no downloadable artifacts found (expired)"
          );
        } else {
          throw new Error(error.message);
        }
      }

      if (skipUnpack) {
        fs.mkdirSync(path, { recursive: true });
        fs.writeFileSync(
          `${pathname.join(path, artifact.name)}.zip`,
          Buffer.from(zip.data),
          "binary"
        );
        continue;
      }

      const dir = name ? path : pathname.join(path, artifact.name);

      fs.mkdirSync(dir, { recursive: true });

      const adm = new AdmZip(Buffer.from(zip.data));

      core.startGroup(`==> Extracting: ${artifact.name}.zip`);
      adm.getEntries().forEach((entry) => {
        const action = entry.isDirectory ? "creating" : "inflating";
        const filepath = pathname.join(dir, entry.entryName);

        core.info(`  ${action}: ${filepath}`);
      });

      adm.extractAllTo(dir, true);
      core.endGroup();
    }
  } catch (error: any) {
    core.setOutput("found_artifact", false);
    core.setOutput("error_message", error.message);
    core.setFailed(error.message);
  }

  function setExitMessage(ifNoArtifactFound: string, message: string) {
    core.setOutput("found_artifact", false);

    switch (ifNoArtifactFound) {
      case "fail":
        core.setFailed(message);
        break;
      case "warn":
        core.warning(message);
        break;
      case "ignore":
      default:
        core.info(message);
        break;
    }
  }
}

main();
