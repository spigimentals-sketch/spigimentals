import React from 'react';
import { GraduationCap, PlayCircle } from 'lucide-react';
import { C, FONT } from '../lib/theme';

export default function CourseCard({ course, onOpen }) {
  return (
    <button
      onClick={() => onOpen(course)}
      className="hover-lift"
      style={{
        textAlign: 'left',
        padding: 20,
        borderRadius: 8,
        background: C.bg2,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        color: 'inherit',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: 'rgba(255,85,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GraduationCap size={20} color={C.orange} />
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.text }}>{course.title}</div>
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: 0 }}>
        {course.description}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 8,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT,
            fontSize: 11,
            color: C.textMute,
          }}
        >
          <PlayCircle size={12} /> {course.lessons} lessons · {course.level}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: C.text }}>${course.price}</span>
      </div>
    </button>
  );
}
