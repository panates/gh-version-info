import * as core from '@actions/core';
import * as github from '@actions/github';

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
      if (!t) return null;
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
    .filter(x => x)
    .sort((x, y) => x.name.localeCompare(y.name))
    .reverse();
  const releasedVersions = versions.filter(v => v.released);

  const last = versions[0];
  const previous = versions[1];
  const released = releasedVersions[0];

  const output = {
    lastVersion: last?.name,
    lastSha: last?.commit,
    prevVersion: previous?.name,
    prevSha: previous?.commit,
    releasedVersion: released?.name,
    releasedSha: released?.commit,
    needRelease: last?.commit !== released.commit,
    last,
    previous,
    released,
    versions,
    releasedVersions,
  };

  for (const [k, v] of Object.entries(output)) {
    core.setOutput(k, v);
    if (Array.isArray(v))
      console.log(`${k} = ${v.map(x => x.name).join(', ')}`);
    else if (typeof v === 'object')
      console.log(`${k}: ${JSON.stringify(v, null, 2)}`);
    else console.log(`${k} = ${v}`);
  }
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
