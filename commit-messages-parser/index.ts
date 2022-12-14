import * as core from "@actions/core";
import * as github from "@actions/github";

async function start() {
  const token = core.getInput("token");

  const regexp = new RegExp(core.getInput("regexp"));
  const owner = core.getInput("owner");
  const repo = core.getInput("repo");
  const head = core.getInput("head");
  const base = core.getInput("base");
  const commitsFromInput = JSON.parse(core.getInput("commits"));

  //Sending graphql query to get the commit messages of the pull request
  const octokit = github.getOctokit(token);

  let commits =
    typeof commitsFromInput === "string"
      ? [commitsFromInput]
      : commitsFromInput;
  const entries: Set<string> = new Set([]);

  if (!commitsFromInput && head && base) {
    try {
      const response: any = await octokit.rest.repos.compareCommits({
        repo,
        owner,
        base,
        head,
        per_page: 100,
      });
      commits = response.data.commits.map((commit: any) => commit);
    } catch (error: any) {
      console.error(
        `Failed to load commit messages between ${head} and ${base}`,
        error
      );
      return [];
    }
  } else if (!commitsFromInput) {
    console.error("Need to provide either commits or head and base");
  }
  if (!commits) {
    console.error("No commits found", commits);
    return [];
  }
  //Parsing commit messages
  for (const commit of commits) {
    const match = commit.message.match(regexp);
    if (match?.[0]) {
      entries.add(match[0].toUpperCase());
    }
  }

  //If no issue keys are found, we return an empty set
  if (entries.size === 0) {
    core.setOutput("entries", "");
    console.log("Nothing found");
    return entries;
  }

  const entriesArr = [...entries];

  console.log(`Found entries: ${entriesArr}`);
  core.setOutput("entries", entriesArr);

  return entriesArr;
}

start();
