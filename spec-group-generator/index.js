import * as core from "@actions/core";
import glob from "glob";
import { readFile } from "fs/promises";
import { Parser } from "xml2js";
const start = async () => {
    const count = parseInt(core.getInput("count", { required: true }));
    if (!count || isNaN(count) || !isFinite(count))
        throw new TypeError("count must be a number");
    const testFiles = glob.sync(core.getInput("tests"));
    const resultsFiles = glob.sync(core.getInput("results"));
    const parser = new Parser();
    await Promise.all(resultsFiles.map(async (file) => {
        const xmlString = await readFile(file, "utf8");
        const parsed = (await parser.parseStringPromise(xmlString)).testsuites;
        console.log(parsed.testsuite[0].file, parsed.testsuite.$.time);
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
    console.log("Generated specs: ", resultsFiles);
    return testFiles;
};
start();
