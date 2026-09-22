import React, { useState } from 'react';
import { useContent } from '../lib/useContent';
import PageHeader from '../components/PageHeader';
import CourseCard from '../components/CourseCard';
import CourseDetail from '../components/CourseDetail';

// NOTE: this is the course catalog + enroll flow only. The community feed
// (classroom_posts / post_comments / post_ratings in server/schema.sql) isn't
// wired up yet — it needs file upload storage for post media, which is out
// of scope for this pass.
export default function ClassroomPage() {
  const { items: courses } = useContent('courses');
  const [openCourse, setOpenCourse] = useState(null);

  return (
    <div>
      <PageHeader
        eyebrow="Classroom"
        title="Learn the craft."
        description="Short, focused courses on mixing, drum programming, vocal recording, and mastering."
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
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onOpen={setOpenCourse} />
          ))}
        </div>
      </div>

      {openCourse && <CourseDetail course={openCourse} onClose={() => setOpenCourse(null)} />}
    </div>
  );
}
