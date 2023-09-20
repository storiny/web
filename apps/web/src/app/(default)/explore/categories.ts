import { StoryCategory } from "@storiny/shared";

export const CATEGORIES: Array<{
  id: StoryCategory | "all";
  title: string;
}> = [
  {
    id: "all",
    title: "All categories"
  },
  {
    id: StoryCategory.SCIENCE_AND_TECHNOLOGY,
    title: "Science & technology"
  },
  {
    id: StoryCategory.PROGRAMMING,
    title: "Programming"
  },
  {
    id: StoryCategory.LIFESTYLE,
    title: "Lifestyle"
  },
  {
    id: StoryCategory.HEALTH_AND_WELLNESS,
    title: "Health & wellness"
  },
  {
    id: StoryCategory.ENTERTAINMENT,
    title: "Entertainment"
  },
  {
    id: StoryCategory.DIGITAL_GRAPHICS,
    title: "Digital graphics"
  },
  {
    id: StoryCategory.TRAVEL,
    title: "Travel"
  },
  {
    id: StoryCategory.DIY,
    title: "DIY"
  },
  {
    id: StoryCategory.NEWS,
    title: "News"
  },
  {
    id: StoryCategory.SPORTS,
    title: "Sports"
  },
  {
    id: StoryCategory.GAMING,
    title: "Gaming"
  },
  {
    id: StoryCategory.MUSIC,
    title: "Music"
  },
  {
    id: StoryCategory.LEARNING,
    title: "Learning"
  },
  {
    id: StoryCategory.BUSINESS_AND_FINANCE,
    title: "Business & finance"
  }
];
