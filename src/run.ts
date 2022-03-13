import * as core from '@actions/core';
import { context } from '@actions/github';
import { throttling } from '@octokit/plugin-throttling';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils'

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

const getRepoNames = async (): Promise<string[]> => {
  let repoNames: string[] = [];
  const input = getInputs();
  const octokit = new (GitHub.plugin(throttling))({
    ...getOctokitOptions(input.token),
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

  let _hasNextPage = true;
  let _endCursor = null;
  while (_hasNextPage) {
    const {
      organization: { 
        repositories: {
          nodes: repositories,
          pageInfo: {
            hasNextPage,
            endCursor
          }
        }
      }
    } = await octokit.graphql(`{ 
      organization(login:"${input.orgLogin}") {
        repositories(first:100, after:${JSON.stringify(_endCursor)}) {
          nodes {
            name
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`);
    _hasNextPage = hasNextPage;
    _endCursor = endCursor;
    const names: string[] = repositories
      .map(repo => repo.name)
      .filter(name => name !== input.orgLogin);
    core.info(names.join('\n'));
    repoNames = repoNames.concat(names);
  }
  return repoNames;
}

const run = async (): Promise<void> => {
  try {
    return core.group('Get Repo Names', () => getRepoNames()).then((repoNames) => {
      core.setOutput('repos', JSON.stringify(repoNames));
    });
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
