import * as core from "@actions/core";
import glob from "glob";
import { readFile } from "fs/promises";
import { Parser } from "xml2js";

const sortByTime = (a: GroupWithTime, b: GroupWithTime) => {
  return a.estimatedTime - b.estimatedTime;
};

type GroupWithTime = {
  value: string;
  estimatedTime: number;
};

const start = async () => {
  const count = parseInt(core.getInput("count", { required: true }));

  if (!count || isNaN(count) || !isFinite(count))
    throw new TypeError("count must be a number");

  let resultGroups: string[] = [];
  const testFiles = glob.sync(core.getInput("tests"));
  const resultsFiles = glob.sync(core.getInput("results"));

  if (testFiles.length === 0) {
    console.log("No test files found");
  } else if (resultsFiles.length > 0) {
    console.log("Results files found, generating optimized spec groups...");
    const parser = new Parser();
    const testToTime: { [key: string]: number } = {};
    await Promise.all(
      resultsFiles.map(async (file) => {
        const xmlString = await readFile(file, "utf8");
        const parsed = (await parser.parseStringPromise(xmlString)).testsuites;
        testToTime[parsed.testsuite[0].$.file] = parseFloat(parsed.$.time);
      })
    );

    const groups: GroupWithTime[] = new Array(count).fill(0).map(() => ({
      value: "",
      estimatedTime: 0,
    }));

    testFiles.forEach((file) => {
      groups.sort(sortByTime);
      const group = groups[0];
      if (group.value) group.value += `, ${file}`;
      else group.value = file;
      groups[0].estimatedTime += testToTime[file] || 0;
    });

    resultGroups = groups.map((group) => group.value).filter(Boolean);

    if (resultGroups.length < groups.length) {
      console.log("Some empty groups has been removed!");
    }

    console.log(
      "Generated spec groups: ",
      groups.map((group) => `${group.value} (~${group.estimatedTime}s)`)
    );

    const maxTime = Math.max(...groups.map((group) => group.estimatedTime));

    if (maxTime) console.log("Estimated max time: ", maxTime);
  } else {
    resultGroups = testFiles.reduce<string[]>((acc, file, index) => {
      const groupIndex = index % count;

      if (!acc[groupIndex]) acc[groupIndex] = file;
      else acc[groupIndex] = `${acc[groupIndex]}, ${file}`;

      return acc;
    }, []);

    console.log("Generated spec groups: ", resultGroups);
  }

  core.setOutput("groups", resultGroups);

  return resultGroups;
};

start();
