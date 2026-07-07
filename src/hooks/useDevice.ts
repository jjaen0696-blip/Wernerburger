import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOS = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export interface DeviceProfile {
  deviceType: DeviceType;
  os: DeviceOS;
  browser: string;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  userAgent: string;
}

function detectDevice(): DeviceProfile {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const lowerAgent = userAgent.toLowerCase();
  const hasTouch = typeof navigator !== 'undefined' && ('maxTouchPoints' in navigator ? navigator.maxTouchPoints > 0 : /touch|mobile|tablet/.test(lowerAgent));
  const isAndroid = /android/.test(lowerAgent);
  const isIos = /iphone|ipad|ipod/.test(lowerAgent) || (/macintosh/.test(lowerAgent) && typeof navigator !== 'undefined' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1);
  const isTablet = /ipad|tablet/.test(lowerAgent) || (isAndroid && !/mobile/.test(lowerAgent));
  const isMobile = !isTablet && (isAndroid || isIos || /mobile/.test(lowerAgent) || (hasTouch && typeof window !== 'undefined' && window.innerWidth <= 900));
  const deviceType: DeviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  const os: DeviceOS = isIos
    ? 'ios'
    : isAndroid
      ? 'android'
      : /windows/.test(lowerAgent)
        ? 'windows'
        : /mac os|macintosh/.test(lowerAgent)
          ? 'macos'
          : /linux/.test(lowerAgent)
            ? 'linux'
            : 'unknown';
  const browser = typeof navigator !== 'undefined' ? navigator.appVersion || 'browser' : 'browser';
  const orientation = typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait';

  return {
    deviceType,
    os,
    browser,
    isTouch: hasTouch,
    orientation,
    userAgent,
  };
}

export default function useDevice() {
  const [device, setDevice] = useState<DeviceProfile>(() => detectDevice());

  useEffect(() => {
    const update = () => setDevice(detectDevice());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return device;
}
