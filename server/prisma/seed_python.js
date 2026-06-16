require('dotenv').config();
const prisma = require('../lib/prisma.js');

async function main() {
  console.log('--- Bắt đầu seed khóa học Python Cơ Bản ---');

  // 1. Tìm người dùng Admin làm người tạo khóa học
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (!admin) {
    console.error('❌ LỖI: Không tìm thấy tài khoản admin trong database. Hãy chạy seed.js chính trước!');
    process.exit(1);
  }

  // 2. Tìm danh mục Data Science hoặc tạo mới một danh mục Lập trình
  let category = await prisma.category.findFirst({
    where: { slug: 'data-science' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Lập trình Python',
        slug: 'python-programming',
        description: 'Các khóa học liên quan đến ngôn ngữ Python'
      }
    });
  }

  // 3. Xóa khóa học Python cũ nếu trùng slug để tránh lỗi unique constraint
  const oldCourse = await prisma.course.findFirst({
    where: { slug: 'python-co-ban' }
  });
  if (oldCourse) {
    console.log('Đang dọn dẹp khóa học Python cũ...');
    // Do cascade delete, xóa course sẽ xóa sạch sections, lessons, quizzes liên quan
    await prisma.course.delete({ where: { id: oldCourse.id } });
  }

  // 4. Tạo khóa học Python Cơ Bản mới
  console.log('Đang tạo khóa học...');
  const course = await prisma.course.create({
    data: {
      title: 'Lập trình Python Cơ Bản cho Người Mới Bắt Đầu',
      slug: 'python-co-ban',
      shortDescription: 'Khóa học lập trình Python toàn diện từ con số 0, phù hợp cho người mới bắt đầu.',
      fullDescription: 'Khóa học này được thiết kế chi tiết nhằm giúp bạn làm quen với tư duy lập trình và làm chủ cú pháp Python cơ bản. Khóa học có tích hợp video hướng dẫn trực quan, bài đọc tài liệu chất lượng và hệ thống bài kiểm tra trắc nghiệm chấm điểm tự động.',
      level: 'beginner',
      price: 199000,
      discountPrice: 99000,
      status: 'published',
      categoryId: category.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
    }
  });
  console.log(`✅ Khóa học đã tạo thành công: ${course.title} (ID: ${course.id})`);

  // 5. Tạo Chương 1: Giới thiệu & Cài đặt môi trường
  console.log('Tạo Chương 1...');
  const section1 = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Chương 1: Giới thiệu & Cài đặt môi trường',
      orderIndex: 1
    }
  });

  // Bài 1 (Video - Preview): Chào mừng
  await prisma.lesson.create({
    data: {
      sectionId: section1.id,
      title: 'Bài 1: Giới thiệu về khóa học & Ngôn ngữ Python',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', // Python tutorial video
      durationSeconds: 120, // 2 phút
      isPreview: true,
      orderIndex: 1
    }
  });

  // Bài 2 (Text): Cài đặt
  await prisma.lesson.create({
    data: {
      sectionId: section1.id,
      title: 'Bài 2: Hướng dẫn cài đặt Python và Visual Studio Code',
      contentType: 'text',
      contentUrl: `HƯỚNG DẪN CÀI ĐẶT MÔI TRƯỜNG LẬP TRÌNH PYTHON:

Bước 1: Cài đặt Python SDK
1. Truy cập trang web chính thức: https://www.python.org/downloads/
2. Tải phiên bản mới nhất dành cho Hệ điều hành của bạn (Windows / macOS / Linux).
3. Khi chạy file cài đặt, nhớ TÍCH CHỌN vào ô "Add Python to PATH" trước khi nhấn Install.

Bước 2: Cài đặt Visual Studio Code (VS Code)
1. Truy cập: https://code.visualstudio.com/
2. Tải và cài đặt VS Code.
3. Mở VS Code, truy cập mục Extensions (phím tắt Ctrl+Shift+X) và tìm kiếm cài đặt tiện ích mở rộng có tên "Python" do Microsoft phát hành.

Bước 3: Chạy chương trình đầu tiên
1. Tạo một thư mục mới trên máy tính.
2. Mở thư mục đó bằng VS Code.
3. Tạo file mới tên là 'hello.py'.
4. Viết dòng lệnh: print("Hello World từ Elevate!")
5. Nhấn nút Run ở góc trên bên phải để chạy. Chúc mừng bạn đã hoàn thành cài đặt!`,
      durationSeconds: 15, // Đọc trong 15 giây
      isPreview: false,
      orderIndex: 2
    }
  });

  // 6. Tạo Chương 2: Cú pháp cơ bản & Biến số
  console.log('Tạo Chương 2...');
  const section2 = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Chương 2: Cú pháp cơ bản & Biến số',
      orderIndex: 2
    }
  });

  // Bài 3 (Video): Biến và Kiểu dữ liệu
  await prisma.lesson.create({
    data: {
      sectionId: section2.id,
      title: 'Bài 3: Cách khai báo Biến và các Kiểu dữ liệu cơ bản',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=SgQ1GvL9Cok',
      durationSeconds: 180, // 3 phút
      isPreview: false,
      orderIndex: 1
    }
  });

  // Bài 4 (Text): Print & Input
  await prisma.lesson.create({
    data: {
      sectionId: section2.id,
      title: 'Bài 4: Xuất nhập dữ liệu với hàm print() và input()',
      contentType: 'text',
      contentUrl: `XUẤT NHẬP DỮ LIỆU TRONG PYTHON:

1. Xuất dữ liệu bằng hàm print():
Hàm print() dùng để in dữ liệu ra cửa sổ Terminal. Bạn có thể in chuỗi, số hoặc giá trị của biến.
Ví dụ:
name = "Tuấn"
print("Xin chào", name)

2. Nhập dữ liệu bằng hàm input():
Hàm input() cho phép chương trình dừng lại và đợi người dùng nhập dữ liệu từ bàn phím.
Lưu ý: Mọi dữ liệu nhận được từ hàm input() đều có kiểu dữ liệu là chuỗi (string - str). Nếu muốn tính toán số học, bạn cần ép kiểu (Type Casting).
Ví dụ:
age_str = input("Nhập tuổi của bạn: ")
age = int(age_str) # Ép kiểu sang số nguyên`,
      durationSeconds: 20, // Đọc trong 20 giây
      isPreview: false,
      orderIndex: 2
    }
  });

  // Bài 5 (Quiz): Bài tập trắc nghiệm Chương 2
  const quizLesson = await prisma.lesson.create({
    data: {
      sectionId: section2.id,
      title: 'Bài 5: Bài kiểm tra trắc nghiệm Chương 2',
      contentType: 'quiz',
      durationSeconds: 0,
      isPreview: false,
      orderIndex: 3
    }
  });

  // Tạo Quiz đính kèm bài 5
  const quiz = await prisma.quiz.create({
    data: {
      lessonId: quizLesson.id,
      title: 'Trắc nghiệm Cú pháp & Kiểu dữ liệu',
      description: 'Làm bài trắc nghiệm này để củng cố kiến thức về biến số, in/nhập dữ liệu và ép kiểu.',
      passingScore: 80, // Đạt 80% trở lên
      timeLimitMinutes: 5, // 5 phút làm bài
      maxAttempts: 0 // Không giới hạn lượt làm
    }
  });

  // Câu hỏi 1 của Quiz
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'Kiểu dữ liệu nào dùng để lưu trữ một số thực (số thập phân) trong Python?',
      questionType: 'single_choice',
      orderIndex: 1
    }
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: q1.id, optionText: 'int', isCorrect: false, orderIndex: 1 },
      { questionId: q1.id, optionText: 'float', isCorrect: true, orderIndex: 2 },
      { questionId: q1.id, optionText: 'str', isCorrect: false, orderIndex: 3 },
      { questionId: q1.id, optionText: 'boolean', isCorrect: false, orderIndex: 4 }
    ]
  });

  // Câu hỏi 2 của Quiz
  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'Giá trị trả về của hàm input() mặc định thuộc kiểu dữ liệu nào?',
      questionType: 'single_choice',
      orderIndex: 2
    }
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: q2.id, optionText: 'int (Số nguyên)', isCorrect: false, orderIndex: 1 },
      { questionId: q2.id, optionText: 'str (Chuỗi ký tự)', isCorrect: true, orderIndex: 2 },
      { questionId: q2.id, optionText: 'float (Số thực)', isCorrect: false, orderIndex: 3 },
      { questionId: q2.id, optionText: 'list (Danh sách)', isCorrect: false, orderIndex: 4 }
    ]
  });

  // Câu hỏi 3 của Quiz
  const q3 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'Cách khai báo biến nào sau đây là SAI tiêu chuẩn đặt tên trong Python?',
      questionType: 'single_choice',
      orderIndex: 3
    }
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: q3.id, optionText: 'my_variable = 10', isCorrect: false, orderIndex: 1 },
      { questionId: q3.id, optionText: 'variable1 = 20', isCorrect: false, orderIndex: 2 },
      { questionId: q3.id, optionText: '1_variable = 30', isCorrect: true, orderIndex: 3 },
      { questionId: q3.id, optionText: '_variable = 40', isCorrect: false, orderIndex: 4 }
    ]
  });

  // 7. Tạo Chương 3: Cấu trúc rẽ nhánh & Vòng lặp
  console.log('Tạo Chương 3...');
  const section3 = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Chương 3: Cấu trúc rẽ nhánh & Vòng lặp',
      orderIndex: 3
    }
  });

  // Bài 6 (Video): Câu lệnh if-elif-else
  await prisma.lesson.create({
    data: {
      sectionId: section3.id,
      title: 'Bài 6: Cấu trúc điều kiện rẽ nhánh if - elif - else',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=DZwmegkFxFc',
      durationSeconds: 150,
      isPreview: false,
      orderIndex: 1
    }
  });

  // Bài 7 (Video): Vòng lặp For & While
  await prisma.lesson.create({
    data: {
      sectionId: section3.id,
      title: 'Bài 7: Vòng lặp for và vòng lặp while trong Python',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=9LgyKqd71gU',
      durationSeconds: 200,
      isPreview: false,
      orderIndex: 2
    }
  });

  // Bài 8 (Quiz): Bài kiểm tra trắc nghiệm Chương 3
  const quizLesson3 = await prisma.lesson.create({
    data: {
      sectionId: section3.id,
      title: 'Bài 8: Bài tập trắc nghiệm Chương 3',
      contentType: 'quiz',
      durationSeconds: 0,
      isPreview: false,
      orderIndex: 3
    }
  });

  // Tạo Quiz đính kèm bài 8
  const quiz3 = await prisma.quiz.create({
    data: {
      lessonId: quizLesson3.id,
      title: 'Trắc nghiệm Câu lệnh điều kiện & Vòng lặp',
      description: 'Làm bài trắc nghiệm này để chứng minh bạn đã làm chủ cấu trúc điều khiển trong Python.',
      passingScore: 100, // Đạt 100% (cần đúng cả 2 câu)
      timeLimitMinutes: 3,
      maxAttempts: 0
    }
  });

  // Câu hỏi 1 của Quiz 3
  const q3_1 = await prisma.question.create({
    data: {
      quizId: quiz3.id,
      questionText: 'Để so sánh bằng giữa hai giá trị trong câu lệnh điều kiện, ta dùng toán tử nào?',
      questionType: 'single_choice',
      orderIndex: 1
    }
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: q3_1.id, optionText: '=', isCorrect: false, orderIndex: 1 },
      { questionId: q3_1.id, optionText: '==', isCorrect: true, orderIndex: 2 },
      { questionId: q3_1.id, optionText: '===', isCorrect: false, orderIndex: 3 },
      { questionId: q3_1.id, optionText: 'is', isCorrect: false, orderIndex: 4 }
    ]
  });

  // Câu hỏi 2 của Quiz 3
  const q3_2 = await prisma.question.create({
    data: {
      quizId: quiz3.id,
      questionText: 'Cú pháp nào dùng để dừng vòng lặp ngay lập tức trong Python?',
      questionType: 'single_choice',
      orderIndex: 2
    }
  });
  await prisma.questionOption.createMany({
    data: [
      { questionId: q3_2.id, optionText: 'continue', isCorrect: false, orderIndex: 1 },
      { questionId: q3_2.id, optionText: 'break', isCorrect: true, orderIndex: 2 },
      { questionId: q3_2.id, optionText: 'stop', isCorrect: false, orderIndex: 3 },
      { questionId: q3_2.id, optionText: 'exit', isCorrect: false, orderIndex: 4 }
    ]
  });

  console.log('--- Hoàn tất seeding khóa học Python Cơ Bản! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seed_python:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
