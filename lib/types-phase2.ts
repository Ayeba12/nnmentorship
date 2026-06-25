export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnail_url: string | null;
  author_id: number;
  status: 'pending' | 'published' | 'rejected';
  created_at: string;
  author?: { id: number; full_name: string; rank: string };
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: number;
  lesson_id: number;
  title: string;
  passing_score: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_index: number;
}

export interface Enrollment {
  id: number;
  course_id: number;
  user_id: number;
  status: 'in_progress' | 'completed';
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: Course;
}

export interface Certificate {
  id: number;
  enrollment_id: number;
  user_id: number;
  course_id: number;
  certificate_number: string;
  issued_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  cover_image: string | null;
  author_id: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  published_at: string | null;
  created_at: string;
  author?: { id: number; full_name: string; rank: string; avatar_url: string | null };
  comments?: BlogComment[];
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { id: number; full_name: string; rank: string; avatar_url: string | null };
}

export interface LibraryItem {
  id: number;
  title: string;
  description: string;
  category: string;
  format: 'pdf' | 'video' | 'audio' | 'document';
  file_url: string | null;
  external_link: string | null;
  author: string | null;
  rank_level: string;
  uploaded_by: number;
  downloads_count: number;
  created_at: string;
}

export interface ReadingList {
  id: number;
  title: string;
  description: string;
  category: string;
  curator_id: number;
  created_at: string;
  curator?: { id: number; full_name: string; rank: string };
  items?: ReadingListItem[];
}

export interface ReadingListItem {
  id: number;
  reading_list_id: number;
  library_item_id: number;
  order_index: number;
  item?: LibraryItem;
}
