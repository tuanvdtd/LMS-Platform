import type { CreateJobCommandInput } from '@aws-sdk/client-mediaconvert';

// Thang HLS: mỗi mốc ≤ chiều cao nguồn (không upscale). QVBR giữ chất lượng đều, MaxBitrate chặn trần cho mạng yếu.
const RUNGS = [
  { height: 1080, maxBitrate: 5_000_000 },
  { height: 720, maxBitrate: 3_000_000 },
  { height: 480, maxBitrate: 1_200_000 },
];

export const ladder = (sourceHeight: number) => RUNGS.filter((r) => r.height <= sourceHeight);
export const hlsPrefix = (assetId: string) => `hls/${assetId}/`;
export const hlsPlaylistKey = (assetId: string) => `${hlsPrefix(assetId)}index.m3u8`;

type JobInput = {
  roleArn: string;
  bucket: string;
  inputKey: string;
  assetId: string;
  height: number;
  hasAudio: boolean;
};

// Một output group HLS, segment 6 giây; master playlist ra hls/<assetId>/index.m3u8.
// Chỉ đặt Height: MediaConvert tự tính width theo tỉ lệ gốc (16:9, 16:10, 4:3 đều giữ nguyên, không viền đen).
// Nguồn không có tiếng thì không khai audio (khai audio cho input không có tiếng làm job lỗi).
export function jobSettings(o: JobInput): CreateJobCommandInput {
  const audio = o.hasAudio
    ? [
        {
          AudioSourceName: 'Audio Selector 1',
          CodecSettings: {
            Codec: 'AAC' as const,
            AacSettings: { Bitrate: 128_000, CodingMode: 'CODING_MODE_2_0' as const, SampleRate: 48_000 },
          },
        },
      ]
    : undefined;
  return {
    Role: o.roleArn,
    UserMetadata: { assetId: o.assetId },
    Settings: {
      Inputs: [
        {
          FileInput: `s3://${o.bucket}/${o.inputKey}`,
          VideoSelector: { Rotate: 'AUTO' },
          ...(o.hasAudio ? { AudioSelectors: { 'Audio Selector 1': { DefaultSelection: 'DEFAULT' as const } } } : {}),
        },
      ],
      OutputGroups: [
        {
          Name: 'HLS',
          OutputGroupSettings: {
            Type: 'HLS_GROUP_SETTINGS',
            HlsGroupSettings: {
              Destination: `s3://${o.bucket}/${hlsPrefix(o.assetId)}index`,
              SegmentLength: 6,
              MinSegmentLength: 0,
            },
          },
          Outputs: ladder(o.height).map((r) => ({
            NameModifier: `_${r.height}p`,
            ContainerSettings: { Container: 'M3U8' as const },
            VideoDescription: {
              Height: r.height,
              ScalingBehavior: 'DEFAULT' as const,
              CodecSettings: {
                Codec: 'H_264' as const,
                H264Settings: {
                  RateControlMode: 'QVBR' as const,
                  QvbrSettings: { QvbrQualityLevel: 7 },
                  MaxBitrate: r.maxBitrate,
                  SceneChangeDetect: 'TRANSITION_DETECTION' as const,
                },
              },
            },
            AudioDescriptions: audio,
          })),
        },
      ],
    },
  };
}
