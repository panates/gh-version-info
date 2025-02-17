import * as core from '@actions/core';
import * as github from '@actions/github';
import { compareVersions } from 'compare-versions';

const token = core.getInput('token', { trimWhitespace: true, required: true });

const octokit = github.getOctokit(token);
const VERSION_PATTERN = /(\d+\.\d+\.\d+)/;

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
    .sort((x, y) => {
      const v1 = extractVersion(y.name);
      const v2 = extractVersion(x.name);
      if (!(v1 && v2)) return -1;
      const r = compareVersions(v1, v2);
      if (r === 0) {
        if (y.released && !x.released) return 1;
        if (x.released && !y.released) return -1;
      }
      return r;
    });
  const releasedVersions = versions.filter(v => v.released);

  const last = versions[0];
  const previous =
    last &&
    versions.find(x => extractVersion(x.name) !== extractVersion(last.name));
  const released = releasedVersions[0];

  const output = {
    lastVersion: last?.name,
    lastSha: last?.commit,
    prevVersion: previous?.name,
    prevSha: previous?.commit,
    releasedVersion: released?.name,
    releasedSha: released?.commit,
    needRelease: !released || last?.commit !== released.commit,
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

function extractVersion(s: string) {
  const m = VERSION_PATTERN.exec(s);
  return m ? m[1] : undefined;
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
