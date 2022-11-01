import * as core from "@actions/core";
import glob from "glob";
const start = async () => {
    const count = parseInt(core.getInput("count", { required: true }));
    if (!count || isNaN(count) || !isFinite(count))
        throw new TypeError("count must be a number");
    const testsGlob = core.getInput("tests");
    //const resultsGlob = core.getInput("results");
    let testFiles = [];
    //let resultsFiles: string[] = [];
    console.log(glob(testsGlob, (err, files) => {
        if (err)
            throw err;
        testFiles = files;
    }));
    //glob(resultsGlob, (err, files) => {
    //  if (err) throw err;
    //  resultsFiles = files;
    //});
    //const resolvedTestPath = resolve(__dirname, testPath);
    //console.log(`Generating specs from ${resolvedTestPath}`);
    //
    //const direntArr = (
    //  await readdir(resolvedTestPath, { withFileTypes: true })
    //).filter((dirent) =>
    //  dirent.isFile()
    //    ? dirent.name.match(new RegExp(core.getInput("include")))
    //    : true
    //);
    //
    //const specGroups = direntArr.reduce<string[]>((acc, dirent, index) => {
    //  const groupIndex = index % count;
    //  const groupPath = dirent.isDirectory()
    //    ? `${path}/${dirent.name}/*`
    //    : `${path}/${dirent.name}`;
    //
    //  if (!acc[groupIndex]) acc[groupIndex] = groupPath;
    //  else acc[groupIndex] = `${acc[groupIndex]}, ${groupPath}`;
    //
    //  return acc;
    //}, []);
    //
    //core.setOutput("result", specGroups);
    console.log("Generated specs: ", testFiles);
    return testFiles;
};
start();
