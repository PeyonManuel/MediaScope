import { MediaType } from '../../../shared/infraestructure/lib/types/media.types';
import { UserMediaLog } from '../../item/domain';
import { PaginationType } from '../../../shared/domain';

export interface ProfileFormData {
  username: string | null;
  bio: string | null;
  avatar_url?: string | null;
  user_id: string;
}

export interface ProfileResponse extends Omit<ProfileFormData, 'avatar_url'> {
  user_id: string;
  updated_at?: string;
  avatar_url: string | null;
  bio: string;
}
export type SortOptionValue =
  | 'release-desc'
  | 'release-asc'
  | 'name-asc'
  | 'name-desc'
  | 'avg-desc'
  | 'avg-asc'
  | 'rating-desc'
  | 'rating-asc'
  | 'watched-desc'
  | 'watched-asc';

export interface GetUserLogInput {
  profileId: string;
  type: string;
  page: number;
  sortBy?: SortOptionValue;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUserLogResponse {
  page: number;
  results: UserMediaLog[]; // Use the generic MediaItem
  total_pages: number;
  total_results: number;
  total_liked: number;
  overall_liked: number;
  average_rating: number;
}

export interface GetUserDiaryInput {
  profileId: string;
  amount?: number;
  page: number;
}

export interface DiaryEntry {
  watched_date: string;
  rating?: number;
  review?: string;
  title: string;
  external_id: string;
  media_type: MediaType;
  liked: boolean;
}
export interface GetUserDiaryResponse {
  entries: DiaryEntry[];
  pagination: PaginationType;
}
export interface UserPort {
  //   getUserProfile(userId: string): Promise<User>;
  updateUserProfile(formData: ProfileFormData): Promise<ProfileResponse>;
  getUserLog(input: GetUserLogInput): Promise<GetUserLogResponse>;
  getUserDiary(input: GetUserDiaryInput): Promise<GetUserDiaryResponse>;
}
