import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import child from 'child_process';
import { launch } from 'dynamodb-local';
import find from 'find-process';
import util from 'util';
import { DDBClient } from '../src';
import { DB_PORT } from '../test/helper/db';

const exec = util.promisify(child.exec);

console.log('Configuring DB client...');

const ping = async () => {
  DDBClient.params = {
    region: 'localhost',
    endpoint: `http://localhost:${DB_PORT}`,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  };

  try {
    const res = await DDBClient.instance.send(new ListTablesCommand({}));

    console.log({ res });
  } catch (error) {
    console.log({ error });

    return false;
  }

  return true;
};

const startDynamoDB = async () => {
  console.log('Starting DynamoDB Local...');
  await launch(DB_PORT, null, [], false, true);

  let isRunning = false;
  let tries = 0;

  while (!isRunning && tries < 100) {
    console.info('Waiting for DynamoDB Local to start...');

    await new Promise(resolve => setTimeout(resolve, 2000));
    tries++;

    isRunning = await ping();
  }

  if (tries >= 10) {
    throw new Error('Failed to start DynamoDB Local');
  }
};

const stopDynamoDB = async () => {
  console.log('Stopping DynamoDB Local...');

  const ps = await find('port', DB_PORT);
  if (ps.length === 0) {
    return;
  }

  const [p] = ps;

  await exec(`kill -9 ${p.pid}`);
};

const runTests = async () => {
  try {
    await startDynamoDB();

    await new Promise((resolve, reject) => {
      const childProcess = child.spawn('pnpm', ['ava'], { stdio: 'inherit' });

      childProcess.on('exit', resolve);
      childProcess.on('error', reject);
    });
  } finally {
    await stopDynamoDB();
  }
};

void runTests();
