import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '@mui/material';
import api from '../services/api';

const defaultBaseURL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:5000';

const AvatarWithFallback = ({ photo, firstName, size = 40, baseURL = defaultBaseURL, sx = {}, ...props }) => {
  const [imgError, setImgError] = useState(false);
  // Allow an optional cacheBust prop to be passed in via props (e.g. updatedAt) to force reload
  const { cacheBust } = props;

  // Normalize baseURL to avoid accidental double-slashes or missing slashes
  const cleanBase = (baseURL || defaultBaseURL).replace(/\/$/, '');

  const src = photo && !imgError ? `${cleanBase}/uploads/${photo}${cacheBust ? `?_=${encodeURIComponent(String(cacheBust))}` : ''}` : undefined;

  // If photo or cacheBust changes, reset any previous image error so new images can load
  React.useEffect(() => {
    setImgError(false);
  }, [photo, cacheBust]);

  // Debug: log computed src to help with runtime diagnostics and expose it via a data attribute
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('Avatar src computed:', src);
  }, [src]);

  return (
    <Avatar
      data-avatar-src={src}
      src={src}
      imgProps={{
        onError: (e) => {
          // Minimal debug output to help trace missing image issues in the wild
          // eslint-disable-next-line no-console
          console.debug('Avatar image failed to load:', src, e?.type);
          setImgError(true);
        },
        onLoad: () => {
          // eslint-disable-next-line no-console
          console.debug('Avatar image loaded:', src);
        },
        alt: firstName ? `${firstName} avatar` : undefined
      }}
      sx={{ width: size, height: size, bgcolor: src ? 'transparent' : 'primary.main', ...sx }}
      {...props}
    >
      {!src && (firstName?.charAt(0).toUpperCase() || '')}
    </Avatar>
  );
};

AvatarWithFallback.propTypes = {
  photo: PropTypes.string,
  firstName: PropTypes.string,
  size: PropTypes.number,
  baseURL: PropTypes.string,
  sx: PropTypes.object,
  cacheBust: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default AvatarWithFallback;
