import React from 'react';
import { useContent } from '../lib/useContent';
import PageHeader from '../components/PageHeader';
import PackCard from '../components/PackCard';

export default function PacksPage() {
  const { items: packs } = useContent('packs');

  return (
    <div>
      <PageHeader
        eyebrow="Sample packs"
        title="Sounds for your session."
        description="Drums, loops, and one-shots — royalty-free with any license tier, download instantly after checkout."
      />
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div
          className="stagger-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </div>
    </div>
  );
}
