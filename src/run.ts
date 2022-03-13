import * as core from '@actions/core';
import * as github from '@actions/github';

interface Input {
  token: string;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  return result;
}

const run = async (): Promise<void> => {
  try {
    const input = getInputs();
    const octokit = github.getOctokit(input.token);

    const {
      viewer: { login },
    } = await octokit.graphql(`{ 
      viewer { 
        login
      }
    }`);

    core.info(`Hello, ${login}!`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
