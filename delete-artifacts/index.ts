import * as core from "@actions/core";
import * as github from "@actions/github";

const start = async () => {
  const nameRegexp = new RegExp(
    core.getInput("name", { required: true }),
    "gmi"
  );
  const owner = core.getInput("owner");
  const repo = core.getInput("repo");

  const octokit = github.getOctokit(core.getInput("token"));

  const res = await octokit.rest.actions.listArtifactsForRepo({
    owner,
    repo,
  });

  await Promise.all(
    res.data.artifacts
      .filter(({ name }) => nameRegexp.test(name))
      .map(({ id, name, url }) => {
        core.info(`==> Deleting artifact ${name}, with url=${url}...`);
        return octokit.rest.actions.deleteArtifact({
          owner,
          repo,
          artifact_id: id,
        });
      })
  );

  core.info("==> Done!");
};

start();
