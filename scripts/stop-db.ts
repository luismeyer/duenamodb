import child from "child_process";
import find from "find-process";
import util from "util";

import { test } from "../package.json";

const exec = util.promisify(child.exec);

const { dbPort } = test;

console.log("Stopping DB...");

find("port", dbPort).then(async (ps) => {
  if (ps.length === 0) {
    return;
  }

  const [p] = ps;

  const res = await exec(`kill -9 ${p.pid}`);

  console.log(res.stdout, res.stderr);
  console.log("DB stopped");
});
