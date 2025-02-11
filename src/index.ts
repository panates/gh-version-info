import * as core from '@actions/core';
import * as github from '@actions/github';
// import http from '@actions/http-client';

const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';

const octokit = github.getOctokit(token);
const VERSION_PATTERN = /[Vv](\d)+\.(\d)+\.(\d)+/;

const run = async () => {
  const releasedOnly = core.getInput('released-only') === 'true';

  const tagsRequest = await octokit.rest.repos.listTags({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });
  const releasesRequest = await octokit.rest.repos.listReleases({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  });

  const versions = tagsRequest.data
    .filter(t => VERSION_PATTERN.test(t.name))
    .map(t => {
      const o: any = {
        name: t.name,
        commit: t.commit.sha,
        released: false,
        release: null,
      };
      const release = releasesRequest.data.find(r => r.tag_name === t.name);
      if (release) {
        o.released = true;
        o.release = {
          id: release.id,
          url: release.url,
          draft: release.draft,
          prerelease: release.prerelease,
          published_at: release.published_at,
          notes: release.body,
        };
      }
      return o;
    })
    .filter(t => !releasedOnly || t.released)
    .sort((x, y) => x.name.localeCompare(y.name));

  const releases = releasesRequest.data;

  // console.log(`List of version tags are ${versions.join('\n  ')}`);
  console.log(
    `List of version tags are ${JSON.stringify(tagsRequest.data, null, 2)}`,
  );
  console.log(`List of releases are ${JSON.stringify(releases, null, 2)}`);

  // const nextVersionTag = getNextVersion(orderedTags[0]);
  // console.log(`next version is ${nextVersionTag}`);

  core.setOutput('count', versions.length);
  core.setOutput('items', versions);
  // core.setOutput('releases', releases);
  // core.setOutput('next', nextVersionTag);
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
