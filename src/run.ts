import * as core from '@actions/core';
import * as github from '@actions/github';

interface Input {
  token: string;
  orgLogin: string;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  result.orgLogin = github.context.payload.organization?.login || core.getInput('org');
  if (!result.orgLogin) throw Error(`No organization login in event context.`)
  return result;
}

const run = async (): Promise<string[]> => {
  let repos: string[] = [];
  try {
    const input = getInputs();
    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    let hasNextPage = false;
    while (hasNextPage) {
      const { organization: {
          repoResponse
        }
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
      hasNextPage = repoResponse.pageInfo.hasNextPage;
      repos = [...repoResponse.nodes
        .map(repo => repo.name)
        .filter(name => name !== input.orgLogin)]
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
  return repos;
};

export default run;
