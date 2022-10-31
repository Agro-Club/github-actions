import * as core from "@actions/core";
import { readdir } from "fs/promises";
import { resolve } from "path";

const __dirname = resolve();

const start = async () => {
  const count = parseInt(core.getInput("count", { required: true }));

  if (!count || isNaN(count) || !isFinite(count))
    throw new TypeError("count must be a number");

  const path = core.getInput("path");

  const resolvedPath = resolve(__dirname, path);
  console.log(`Generating specs from ${resolvedPath}`);

  const direntArr = (
    await readdir(resolvedPath, { withFileTypes: true })
  ).filter((dirent) =>
    dirent.isFile()
      ? dirent.name.match(new RegExp(core.getInput("include")))
      : true
  );

  const specGroups = direntArr.reduce<string[]>((acc, dirent, index) => {
    const groupIndex = index % count;
    const groupPath = dirent.isDirectory()
      ? `${path}${dirent.name}/*`
      : `${path}${dirent.name}`;

    if (!acc[groupIndex]) acc[groupIndex] = groupPath;
    else acc[groupIndex] = `${acc[groupIndex]}, ${groupPath}`;

    return acc;
  }, []);

  core.setOutput("result", specGroups);

  console.log("Generated specs: ", specGroups);

  return specGroups;
};

start();
