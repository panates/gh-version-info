import * as core from '@actions/core';
import * as github from '@actions/github';
// import http from '@actions/http-client';

const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';

const octokit = github.getOctokit(token);
const VERSION_PATTERN = /[Vv](\d)+\.(\d)+\.(\d)+/;

const run = async () => {
  const tagsRequest = await octokit.rest.repos.listTags({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });

  const versions = tagsRequest.data
    .filter(t => VERSION_PATTERN.test(t.name))
    .map(t => t.name)
    .sort((x, y) => x.localeCompare(y));

  // console.log(`List of version tags are ${versions.join('\n  ')}`);
  console.log(
    `List of version tags are ${JSON.stringify(tagsRequest.data, null, 2)}`,
  );

  const releasesRequest = await octokit.rest.repos.listReleases({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });

  const releases = releasesRequest.data;

  console.log(`List of releases are ${JSON.stringify(releases, null, 2)}`);

  // const nextVersionTag = getNextVersion(orderedTags[0]);
  // console.log(`next version is ${nextVersionTag}`);

  core.setOutput('versions', versions);
  core.setOutput('releases', releases);
  // core.setOutput('next', nextVersionTag);
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
