const { completeLesson } = require('../controllers/learningController');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => ({
  lesson: { findUnique: jest.fn(), count: jest.fn() },
  enrollment: { findFirst: jest.fn(), findUnique: jest.fn() },
  lessonCompletion: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn()
  },
  course: { findUnique: jest.fn() },
  certificate: { findUnique: jest.fn(), create: jest.fn() }
}));

describe('Kiểm thử Điều kiện Hoàn thành Bài học (Learning Controller)', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: 1 }, params: { lessonId: 10 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    prisma.lessonCompletion.findFirst.mockResolvedValue({ lesson: { id: 1, title: 'Test' } });
    jest.clearAllMocks();
  });

  it('Phải chặn hoàn thành bài học Video nếu thời gian xem chưa đạt 90%', async () => {
    // Mock getLessonWithCourse
    prisma.lesson.findUnique.mockResolvedValue({
      id: 10,
      contentType: 'video',
      durationSeconds: 100,
      section: {
        course: { id: 1, status: 'published', deletedAt: null }
      }
    });

    // Mock active enrollment
    prisma.enrollment.findFirst.mockResolvedValue({ id: 1, status: 'active', courseId: 1 });
    prisma.enrollment.findUnique.mockResolvedValue({ id: 1, status: 'active', courseId: 1 });

    // Mock progress user's current progress: 50 seconds (less than 90% of 100)
    prisma.lessonCompletion.findUnique.mockResolvedValue({
      lastCheckpointTime: 50
    });

    await completeLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Bạn cần xem ít nhất 90% video')
    }));
  });

  it('Phải cho phép hoàn thành bài học Video nếu thời gian xem đạt >= 90%', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 10,
      contentType: 'video',
      durationSeconds: 100,
      section: {
        course: { id: 1, status: 'published', deletedAt: null }
      }
    });

    prisma.enrollment.findFirst.mockResolvedValue({ id: 1, status: 'active', courseId: 1 });
    
    // User watched 95 seconds
    prisma.lessonCompletion.findUnique.mockResolvedValue({
      lastCheckpointTime: 95
    });

    // Mock course progress calculation for upsert returns
    prisma.lesson.count = jest.fn().mockResolvedValue(10);
    prisma.lessonCompletion.count.mockResolvedValue(5);
    prisma.lessonCompletion.upsert.mockResolvedValue({
      completedAt: new Date()
    });

    await completeLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });

  it('Phải cho phép hoàn thành bài học Text/Document mà không bị chặn bởi lastCheckpointTime', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 10,
      contentType: 'document',
      durationSeconds: 30,
      section: {
        course: { id: 1, status: 'published', deletedAt: null }
      }
    });

    prisma.enrollment.findFirst.mockResolvedValue({ id: 1, status: 'active', courseId: 1 });
    
    // User progress is undefined (hasn't recorded checkpoint)
    prisma.lessonCompletion.findUnique.mockResolvedValue(null);

    prisma.lesson.count = jest.fn().mockResolvedValue(10);
    prisma.lessonCompletion.count.mockResolvedValue(5);
    prisma.lessonCompletion.upsert.mockResolvedValue({
      completedAt: new Date()
    });

    await completeLesson(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
