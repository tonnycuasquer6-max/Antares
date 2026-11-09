export function optimizeCloudinaryUrl(url: string, width?: number): string {
  try {
    const optimizedUrl = new URL(url);
    const hostname = optimizedUrl.hostname.toLowerCase();
    const isCloudinary = hostname === 'cloudinary.com' || hostname.endsWith('.cloudinary.com');

    if (!isCloudinary || !/\/upload\//.test(optimizedUrl.pathname)) {
      return url;
    }

    const transformations = ['f_auto', 'q_auto'];
    if (width !== undefined && Number.isFinite(width) && width > 0) {
      transformations.push(`w_${Math.round(width)}`, 'c_limit');
    }

    optimizedUrl.pathname = optimizedUrl.pathname.replace(
      '/upload/',
      `/upload/${transformations.join(',')}/`
    );

    return optimizedUrl.toString();
  } catch {
    return url;
  }
}
