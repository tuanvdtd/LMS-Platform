import { hlsPlaylistKey, hlsPrefix, jobSettings, ladder } from './hls-job.js';

describe('ladder', () => {
  it('chọn mốc ≤ chiều cao nguồn, không upscale', () => {
    expect(ladder(2160).map((r) => r.height)).toEqual([1080, 720, 480]);
    expect(ladder(1440).map((r) => r.height)).toEqual([1080, 720, 480]);
    expect(ladder(1080).map((r) => r.height)).toEqual([1080, 720, 480]);
    expect(ladder(900).map((r) => r.height)).toEqual([720, 480]);
    expect(ladder(720).map((r) => r.height)).toEqual([720, 480]);
  });
});

describe('jobSettings', () => {
  const base = { roleArn: 'arn:aws:iam::1:role/mc', bucket: 'vb', inputKey: 'videos/u/a.mp4', assetId: 'a1' };

  it('đủ output theo thang, chỉ đặt Height, đích hls/<id>/index, metadata assetId', () => {
    const job = jobSettings({ ...base, height: 1080, hasAudio: true });
    expect(job.Role).toBe(base.roleArn);
    expect(job.UserMetadata).toEqual({ assetId: 'a1' });
    const input = job.Settings!.Inputs![0];
    expect(input.FileInput).toBe('s3://vb/videos/u/a.mp4');
    expect(input.VideoSelector?.Rotate).toBe('AUTO');
    expect(input.AudioSelectors).toBeDefined();
    const group = job.Settings!.OutputGroups![0];
    expect(group.OutputGroupSettings?.HlsGroupSettings?.Destination).toBe('s3://vb/hls/a1/index');
    const outs = group.Outputs!;
    expect(outs.map((o) => o.VideoDescription?.Height)).toEqual([1080, 720, 480]);
    expect(outs.every((o) => o.VideoDescription?.Width === undefined)).toBe(true);
    expect(outs.map((o) => o.NameModifier)).toEqual(['_1080p', '_720p', '_480p']);
    expect(outs.every((o) => o.AudioDescriptions?.length === 1)).toBe(true);
  });

  it('nguồn không có tiếng → không khai audio ở input lẫn output', () => {
    const job = jobSettings({ ...base, height: 720, hasAudio: false });
    expect(job.Settings!.Inputs![0].AudioSelectors).toBeUndefined();
    const outs = job.Settings!.OutputGroups![0].Outputs!;
    expect(outs).toHaveLength(2);
    expect(outs.every((o) => o.AudioDescriptions === undefined)).toBe(true);
  });

  it('key playlist', () => {
    expect(hlsPrefix('a1')).toBe('hls/a1/');
    expect(hlsPlaylistKey('a1')).toBe('hls/a1/index.m3u8');
  });
});
