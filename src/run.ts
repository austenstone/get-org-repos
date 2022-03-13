import * as core from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/core';
import { throttling } from '@octokit/plugin-throttling';

interface Input {
  token: string;
  orgLogin: string;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  result.orgLogin = context.payload.organization?.login || core.getInput('org');
  if (!result.orgLogin) throw Error(`No organization in event context.`)
  return result;
}

const run = async (): Promise<string[]> => {
  let repoNames: string[] = [];
  try {
    const input = getInputs();
    const octokit = new (Octokit.plugin(throttling))({
      auth: input.token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
          if (options.request.retryCount === 0) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (_, options, octokit) => {
          octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
        },
      }
    });

    let hasNextPage = true;
    while (hasNextPage) {
      const {
        organization: { repositories }
      } = await octokit.graphql(`{ 
        organization(login:"${input.orgLogin}") {
          repositories(first:100) {
            nodes {
              name
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }`);
      console.log(repositories)
      hasNextPage = repositories.pageInfo.hasNextPage;
      repoNames = repoNames.concat(repositories.nodes
        .map(repo => repo.name)
        .filter(name => name !== input.orgLogin))
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
  const repoNamesString = JSON.stringify(repoNames);
  core.info(repoNamesString);
  core.setOutput('repos', repoNamesString);
  return repoNames;
};

export default run;
