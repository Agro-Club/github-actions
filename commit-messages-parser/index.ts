import * as core from "@actions/core";

async function start() {
  const regexp = new RegExp(core.getInput("regexp"));
  const commits = JSON.parse(core.getInput("commits", { required: true }));

  const entries: Set<string> = new Set([]);

  //Parsing commit messages
  for (const { commit } of commits) {
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

  return entries;
}

start();
