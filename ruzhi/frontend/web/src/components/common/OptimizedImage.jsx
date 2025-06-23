/**
 * 优化的图片组件
 * 支持懒加载、WebP格式、响应式图片、错误处理等
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useLazyLoading, useImageLazyLoading } from '../../hooks/usePerformance';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  lazy = true,
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  format = 'webp',
  fallbackFormat = 'jpg',
  className,
  style,
  onLoad,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { elementRef, hasIntersected } = useLazyLoading(0.1, '50px');
  const { loadImage, isImageLoaded, isImageLoading } = useImageLazyLoading();

  // 生成响应式图片源
  const imageSources = useMemo(() => {
    if (!src) return [];

    const baseSrc = src.replace(/\.[^/.]+$/, ''); // 移除扩展名
    const sources = [];

    // WebP格式（现代浏览器）
    if (format === 'webp') {
      sources.push({
        srcSet: generateSrcSet(baseSrc, 'webp', quality),
        type: 'image/webp'
      });
    }

    // AVIF格式（最新浏览器）
    if (format === 'avif') {
      sources.push({
        srcSet: generateSrcSet(baseSrc, 'avif', quality),
        type: 'image/avif'
      });
    }

    // 回退格式
    sources.push({
      srcSet: generateSrcSet(baseSrc, fallbackFormat, quality),
      type: `image/${fallbackFormat}`
    });

    return sources;
  }, [src, format, fallbackFormat, quality]);

  // 生成srcSet字符串
  const generateSrcSet = useCallback((baseSrc, format, quality) => {
    const sizes = [480, 768, 1024, 1280, 1920];
    return sizes
      .map(size => `${baseSrc}_${size}w.${format}?q=${quality} ${size}w`)
      .join(', ');
  }, []);

  // 处理图片加载
  const handleImageLoad = useCallback((event) => {
    setImageLoaded(true);
    onLoad?.(event);
  }, [onLoad]);

  // 处理图片错误
  const handleImageError = useCallback((event) => {
    setImageError(true);
    onError?.(event);
  }, [onError]);

  // 预加载图片（高优先级图片）
  React.useEffect(() => {
    if (priority && src) {
      loadImage(src);
    }
  }, [priority, src, loadImage]);

  // 懒加载图片
  React.useEffect(() => {
    if (!lazy || priority) return;
    
    if (hasIntersected && src && !isImageLoaded(src) && !isImageLoading(src)) {
      loadImage(src);
    }
  }, [hasIntersected, src, lazy, priority, loadImage, isImageLoaded, isImageLoading]);

  // 是否应该显示图片
  const shouldShowImage = priority || !lazy || hasIntersected;

  // 占位符组件
  const PlaceholderComponent = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <Box
          component="img"
          src={blurDataURL}
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      );
    }

    if (placeholder === 'skeleton') {
      return (
        <Skeleton
          variant="rectangular"
          width={width || '100%'}
          height={height || 200}
          animation="wave"
        />
      );
    }

    return (
      <Box
        sx={{
          width: width || '100%',
          height: height || 200,
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'grey.500',
          fontSize: '14px'
        }}
      >
        加载中...
      </Box>
    );
  };

  // 错误状态组件
  const ErrorComponent = () => (
    <Box
      sx={{
        width: width || '100%',
        height: height || 200,
        backgroundColor: 'grey.100',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'grey.500',
        fontSize: '14px',
        border: '1px dashed',
        borderColor: 'grey.300'
      }}
    >
      <Box sx={{ fontSize: '24px', mb: 1 }}>🖼️</Box>
      <Box>图片加载失败</Box>
    </Box>
  );

  // 如果图片加载失败，显示错误状态
  if (imageError) {
    return <ErrorComponent />;
  }

  return (
    <Box
      ref={elementRef}
      className={className}
      style={style}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      {/* 占位符 */}
      {!imageLoaded && shouldShowImage && <PlaceholderComponent />}

      {/* 实际图片 */}
      {shouldShowImage && src && (
        <picture>
          {imageSources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              type={source.type}
              sizes={sizes}
            />
          ))}
          <Box
            component="img"
            src={src}
            alt={alt}
            loading={lazy && !priority ? 'lazy' : 'eager'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              width: width || '100%',
              height: height || 'auto',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease',
              opacity: imageLoaded ? 1 : 0,
              position: imageLoaded ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              zIndex: 2
            }}
          />
        </picture>
      )}

      {/* 加载指示器 */}
      {isImageLoading(src) && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              border: '2px solid',
              borderColor: 'primary.main',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

// 预设的图片组件变体
export const AvatarImage = (props) => (
  <OptimizedImage
    {...props}
    style={{
      borderRadius: '50%',
      ...props.style
    }}
    placeholder="skeleton"
  />
);

export const HeroImage = (props) => (
  <OptimizedImage
    {...props}
    priority={true}
    quality={90}
    placeholder="blur"
  />
);

export const ThumbnailImage = (props) => (
  <OptimizedImage
    {...props}
    quality={60}
    placeholder="skeleton"
    lazy={true}
  />
);

export const BackgroundImage = ({ src, children, ...props }) => (
  <Box
    sx={{
      position: 'relative',
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Box>
);

// 图片预加载工具函数
export const preloadImages = (urls) => {
  return Promise.all(
    urls.map(url => 
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      })
    )
  );
};

// 图片压缩工具函数
export const compressImage = (file, quality = 0.8, maxWidth = 1920) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 检测WebP支持
export const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// 检测AVIF支持
export const supportsAVIF = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
};

export default OptimizedImage;
