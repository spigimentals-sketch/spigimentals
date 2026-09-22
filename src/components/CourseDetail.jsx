import React from 'react';
import { X, GraduationCap, PlayCircle, CheckCircle2 } from 'lucide-react';
import { C, FONT } from '../lib/theme';
import { useCart } from '../contexts/CartContext';

export default function CourseDetail({ course, onClose }) {
  const { addItem } = useCart();

  const handleEnroll = () => {
    addItem({ type: 'course', id: course.id, title: course.title, price: course.price });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          width: '100%',
          background: C.bg2,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 32,
          animation: 'scaleIn 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'rgba(255,85,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={22} color={C.orange} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: 4 }}
          >
            <X />
          </button>
        </div>

        <h2
          id="course-detail-title"
          style={{ fontFamily: FONT, fontSize: 24, color: C.text, margin: '0 0 6px', fontWeight: 800 }}
        >
          {course.title}
        </h2>
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.textMute, marginBottom: 16 }}>
          Taught by {course.instructor} · {course.level}
        </div>

        <p style={{ fontFamily: FONT, fontSize: 14, color: C.textDim, lineHeight: 1.6, marginBottom: 20 }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <PlayCircle size={14} color={C.orange} />
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.text }}>{course.lessons} video lessons</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: C.bg3,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.textDim }}>Full course access</span>
          <span style={{ fontFamily: FONT, fontSize: 22, color: C.text, fontWeight: 800 }}>${course.price}</span>
        </div>

        <button
          onClick={handleEnroll}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            background: C.orange,
            color: C.bg,
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} /> Enroll — ${course.price}
        </button>
      </div>
    </div>
  );
}
