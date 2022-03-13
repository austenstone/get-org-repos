import * as core from '@actions/core';
import { context } from '@actions/github';
import { throttling } from '@octokit/plugin-throttling';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils'
type Octokit = InstanceType<typeof GitHub>;

interface Input {
  token: string;
  orgLogin: string;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  result.orgLogin = core.getInput('org');
  if (!result.orgLogin) throw Error(`No organization in event context.`)
  return result;
}

const createOctokit = (token: string): Octokit => {
  return new (GitHub.plugin(throttling))({
    ...getOctokitOptions(token),
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
}

const getRepoNames = async (octokit: Octokit, orgLogin: string): Promise<string[]> => {
  let repoNames: string[] = [];
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
      organization(login:"${orgLogin}") {
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
      .filter(name => name !== orgLogin);
    core.info(names.join('\n'));
    repoNames = repoNames.concat(names);
  }
  return repoNames;
}

const run = async (): Promise<void> => {
  try {
    const input = getInputs();
    const octokit = createOctokit(input.token);
    const repoNames = await core.group('Get Repo Names', () => getRepoNames(octokit, input.orgLogin)
      .then((repoNames) => {
        core.setOutput('repos', JSON.stringify(repoNames));
        return repoNames;
      })
    );
    core.info(`${repoNames.length} repositories found`);
    core.info(`Ouput 'repos' set\nAccess with $\{{ fromJson(needs.${context.job ? context.job : '<job_id>'}.outputs.repos) }}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
  }
};

export default run;
