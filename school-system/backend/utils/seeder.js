require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Subject, Class } = require('../models/AcademicModels');
const { News, Announcement } = require('../models/ContentModels');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear
  await Promise.all([User.deleteMany(), Student.deleteMany(), Teacher.deleteMany(), Subject.deleteMany(), Class.deleteMany(), News.deleteMany(), Announcement.deleteMany()]);
  console.log('Cleared existing data');

  // Admin
  const admin = await User.create({ name: 'Admin User', email: 'admin@school.edu', password: 'Admin@123', role: 'admin', isActive: true });

  // Teacher
  const teacherUser = await User.create({ name: 'Ramesh Kumar', email: 'teacher@school.edu', password: 'Teacher@123', role: 'teacher', isActive: true });
  const teacher = await Teacher.create({ user: teacherUser._id, employeeId: 'EMP001', qualification: 'M.Sc Mathematics', experience: 8 });
  teacherUser.teacherProfile = teacher._id;
  await teacherUser.save({ validateBeforeSave: false });

  // Subjects
  const subjects = await Subject.insertMany([
    { name: 'Mathematics', code: 'MATH10', teacher: teacher._id, maxMarks: 100, passingMarks: 35 },
    { name: 'Science', code: 'SCI10', teacher: teacher._id, maxMarks: 100, passingMarks: 35 },
    { name: 'English', code: 'ENG10', maxMarks: 100, passingMarks: 35 },
    { name: 'Telugu', code: 'TEL10', maxMarks: 100, passingMarks: 35 },
    { name: 'Social Studies', code: 'SS10', maxMarks: 100, passingMarks: 35 },
  ]);

  // Class
  const cls = await Class.create({
    name: 'Class 10', section: 'A', academicYear: '2024-25',
    classTeacher: teacher._id, subjects: subjects.map(s => s._id), room: 'Room 101'
  });
  await Subject.updateMany({ _id: { $in: subjects.map(s => s._id) } }, { class: cls._id });
  teacher.assignedClasses = [cls._id];
  teacher.subjects = subjects.map(s => s._id);
  await teacher.save();

  // Students
  const studentNames = [
    ['Arjun Sharma', 'student@school.edu', 'Student@123'],
    ['Priya Reddy', 'priya@school.edu', 'Student@123'],
    ['Kiran Kumar', 'kiran@school.edu', 'Student@123'],
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const [name, email, password] = studentNames[i];
    const su = await User.create({ name, email, password, role: 'student', isActive: true });
    const s = await Student.create({
      user: su._id, rollNumber: `STU10A00${i+1}`, admissionNumber: `ADM2024${String(i+1).padStart(3,'0')}`,
      class: cls._id, section: 'A', gender: i === 1 ? 'female' : 'male',
      parentName: `Parent of ${name}`, parentPhone: `9876543${200+i}`, academicYear: '2024-25'
    });
    su.studentProfile = s._id;
    await su.save({ validateBeforeSave: false });
    cls.students.push(s._id);
  }
  await cls.save();

  // News
  await News.insertMany([
    { title: 'Annual Sports Day Announced', content: 'The school annual sports day will be held on 15th February 2025. All students are requested to participate.', category: 'education', isTopNews: true, postedBy: admin._id, summary: 'Annual sports day on Feb 15th' },
    { title: 'Science Exhibition Winners', content: 'Congratulations to all students who won prizes in the inter-school science exhibition.', category: 'education', isTopNews: true, postedBy: admin._id },
    { title: 'Board Exam Schedule Released', content: 'The board has released the examination schedule for Class 10 and 12. Students can download the timetable from the school website.', category: 'education', isTopNews: true, postedBy: admin._id },
    { title: 'India Wins Cricket Series', content: 'Team India won the ODI cricket series against Australia 3-2.', category: 'sports', isTopNews: false, postedBy: admin._id },
    { title: 'New Technology Policy for Schools', content: 'Government announces new digital learning policy for government schools across Telangana.', category: 'science_technology', isTopNews: true, postedBy: admin._id },
  ]);

  // Announcements
  await Announcement.insertMany([
    { title: 'Mid-term Examinations', content: 'Mid-term examinations will be held from 20th to 25th January. All students must prepare well.', author: admin._id, targetRoles: ['student'], isUrgent: false },
    { title: '⚠️ Fee Payment Deadline', content: 'Last date for fee payment is 31st January. Kindly pay on time to avoid late fees.', author: admin._id, targetRoles: ['all'], isUrgent: true },
    { title: 'Staff Meeting', content: 'All teachers are requested to attend the staff meeting on Friday at 3 PM in the conference hall.', author: admin._id, targetRoles: ['teacher'], isUrgent: false },
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('\nDemo Credentials:');
  console.log('Admin:   admin@school.edu   / Admin@123');
  console.log('Teacher: teacher@school.edu / Teacher@123');
  console.log('Student: student@school.edu / Student@123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
