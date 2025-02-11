import * as core from '@actions/core';
import * as github from '@actions/github';
// import http from '@actions/http-client';

const token = core.getInput('token', { trimWhitespace: true, required: true });

const octokit = github.getOctokit(token);
const VERSION_PATTERN = /[Vv](\d)+\.(\d)+\.(\d)+/;

const run = async () => {
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
    // .filter(t => !releasedOnly || t.released)
    .sort((x, y) => x.name.localeCompare(y.name));
  const releasedVersions = versions.filter(v => v.released);

  const last = versions[0];
  const previous = versions[1];
  const first = versions[versions.length - 1];
  const lastReleased = releasedVersions[0];
  const previousReleased = releasedVersions[1];
  const firstReleased = releasedVersions[releasedVersions.length - 1];

  // console.log(`List of version tags are ${versions.join('\n  ')}`);
  console.log(`Last version = ${JSON.stringify(last, null, 2)}`);
  console.log(`Previous version = ${JSON.stringify(previous, null, 2)}`);
  console.log(`First version = ${JSON.stringify(first, null, 2)}`);
  console.log(`Last released = ${JSON.stringify(lastReleased, null, 2)}`);
  console.log(
    `Previous released = ${JSON.stringify(previousReleased, null, 2)}`,
  );
  console.log(`First released ${JSON.stringify(firstReleased, null, 2)}`);
  console.log(`List of all versions = ${JSON.stringify(versions, null, 2)}`);

  core.setOutput('last', last);
  core.setOutput('previous', previous);
  core.setOutput('first', first);
  core.setOutput('lastReleased', lastReleased);
  core.setOutput('previousReleased', previousReleased);
  core.setOutput('firstReleased', firstReleased);
  core.setOutput('versions', versions);
  core.setOutput('releasedVersions', releasedVersions);
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
