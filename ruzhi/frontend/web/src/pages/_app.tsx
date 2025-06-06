import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // 预加载主要页面，提高导航响应速度
    void router.prefetch('/classics');
    void router.prefetch('/ocr');
    void router.prefetch('/learning');
    void router.prefetch('/tools');
    void router.prefetch('/user');
  }, [router]);

  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3a5485', // 靛青色
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#3a5485',
          borderRadius: 8,
        },
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  );
} 