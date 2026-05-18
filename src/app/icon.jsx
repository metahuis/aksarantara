import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f2615',
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22">
          {/* Triangle */}
          <polygon points="11,2 21,20 1,20" fill="#58cc02" />
          {/* Square dot in center */}
          <rect x="8.5" y="12" width="5" height="5" fill="#0f2615" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
