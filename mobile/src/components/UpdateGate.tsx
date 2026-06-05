import React, { useState } from 'react';

import { ForceUpdateScreen } from './ForceUpdateScreen';
import { UpdateModal } from './UpdateModal';
import { useAppVersion } from '../hooks/useAppVersion';

/**
 * UpdateGate — wraps the app children.
 * - If forced update: renders ForceUpdateScreen instead of children
 * - If optional update: shows UpdateModal over children (dismissible)
 * - Otherwise: renders children normally
 */
export function UpdateGate({ children }: { children: React.ReactNode }) {
  const { updateStatus, remoteVersion } = useAppVersion();
  const [modalDismissed, setModalDismissed] = useState(false);

  // Forced update — block everything
  if (updateStatus === 'forced' && remoteVersion) {
    return <ForceUpdateScreen remoteVersion={remoteVersion} />;
  }

  return (
    <>
      {children}
      {updateStatus === 'optional' && remoteVersion && !modalDismissed && (
        <UpdateModal
          visible
          remoteVersion={remoteVersion}
          onDismiss={() => setModalDismissed(true)}
        />
      )}
    </>
  );
}
