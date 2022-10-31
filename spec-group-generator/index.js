import * as core from "@actions/core";
import { readdir } from "fs/promises";
import { resolve } from "path";
const start = async () => {
    const count = parseInt(core.getInput("count", { required: true }));
    if (!count || isNaN(count) || !isFinite(count))
        throw new TypeError("count must be a number");
    const path = core.getInput("path", { required: true });
    const resolvedPath = resolve(path);
    const direntArr = await readdir(resolvedPath, { withFileTypes: true });
    const maxPerGroup = Math.ceil(direntArr.length / count);
    const specGroups = direntArr.reduce((acc, dirent, index) => {
        const groupIndex = Math.floor(index / maxPerGroup);
        const groupPath = dirent.isDirectory()
            ? `${path}${dirent.name}/*`
            : `${path}${dirent.name}`;
        if (!acc[groupIndex])
            acc[groupIndex] = groupPath;
        acc[groupIndex] += `${acc[groupIndex]}, ${groupPath}`;
        return acc;
    }, []);
    core.setOutput("result", specGroups);
    console.log("Found specs: ", specGroups);
    return specGroups;
};
start();
