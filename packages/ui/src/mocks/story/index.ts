import { Story } from "@storiny/types";

import { mockTags } from "../tag";
import { mockUsers, testUser } from "../user";

const getSplashId = (identifier: string): string => `${identifier}.jpg`;

export const testStory: Story = {
  splash_hex: "000000",
  splash_id: "/splash.ext",
  published_at: "2022-05-18T01:07:02.000Z",
  created_at: "2022-04-18T01:07:02.000Z",
  edited_at: null,
  title: "Test story",
  slug: "test-slug",
  word_count: 750,
  user: testUser,
  user_id: testUser.id,
  tags: [mockTags[0]],
  stats: {
    like_count: 1,
    read_count: 1
  },
  description: "Test description",
  id: "0"
};

export const mockStories: Story[] = [
  {
    splash_hex: "1c2025",
    splash_id: getSplashId("mGs7oMPLB-c"),
    created_at: "2022-05-18T01:07:02.000Z",
    title: "Finding Serenity in Chaos: Embracing Mindfulness in a Hectic World",
    slug: "finding-serenity-in-chaos-embracing-mindfulness-in-a-hectic-world",
    tags: [mockTags[0], mockTags[5]],
    user: mockUsers[0],
    user_id: mockUsers[0].id,
    word_count: 2004,
    stats: {
      like_count: 923,
      read_count: 20234
    },
    description:
      "The importance of mindfulness practices and practical tips on how to cultivate a sense of calm and peace in the midst of a busy and chaotic lifestyle.",
    id: "1632665205526338688",
    edited_at: null,
    deleted_at: null,
    published_at: "2022-05-18T01:07:02.000Z"
  },
  {
    splash_hex: "4e3d2d",
    splash_id: getSplashId("z6SXax6vhm0"),
    published_at: "2021-04-18T01:07:02.000Z",
    created_at: "2021-03-18T01:07:02.000Z",
    edited_at: "2023-04-18T01:07:02.000Z",
    deleted_at: null,
    title:
      "Exploring the Great Outdoors: A Journey into Nature's Healing Powers",
    slug: "exploring-the-great-outdoors-a-journey-into-natures-healing-powers",
    tags: [mockTags[8]],
    user: mockUsers[1],
    user_id: mockUsers[1].id,
    word_count: 2400,
    stats: {
      like_count: 249,
      read_count: 39842
    },
    description:
      "A virtual journey into the wonders of nature and the physical, mental, and emotional benefits of spending time outdoors.",
    id: "1638877680534708278"
  },
  {
    splash_hex: "312f29",
    splash_id: getSplashId("P-yzuyWFEIk"),
    published_at: "2021-02-18T01:07:02.000Z",
    created_at: "2021-02-18T01:07:02.000Z",
    edited_at: null,
    deleted_at: null,
    title: "From Clutter to Zen: Decluttering Your Space for Inner Peace",
    slug: "from-clutter-to-zen-decluttering-your-space-for-inner-peace",
    tags: [mockTags[1], mockTags[4], mockTags[7]],
    user: mockUsers[2],
    user_id: mockUsers[2].id,
    word_count: 991,
    stats: {
      like_count: 349,
      read_count: 48291
    },
    description:
      "Discover the transformative power of decluttering and organizing your physical environment.",
    id: "1637300061766836924"
  },
  {
    splash_hex: "a39756",
    splash_id: getSplashId("Z26qv5wkyZw"),
    published_at: "2022-03-24T01:07:02.000Z",
    created_at: "2022-02-24T01:07:02.000Z",
    edited_at: null,
    deleted_at: null,
    title: "Garden Delights: DIY Tips for a Thriving Vegetable Patch",
    slug: "garden-delights-diy-tips-for-a-thriving-vegetable-patch",
    tags: [],
    user: mockUsers[3],
    user_id: mockUsers[3].id,
    word_count: 3002,
    stats: {
      like_count: 954,
      read_count: 99214
    },
    description: null,
    id: "1662662558539886592"
  },
  {
    splash_hex: "2b3c46",
    splash_id: null,
    published_at: "2022-01-24T01:07:02.000Z",
    created_at: "2022-01-22T01:07:02.000Z",
    edited_at: null,
    deleted_at: null,
    title: "Office Shenanigans: Pranks, Memes, and Workplace Woes",
    slug: "office-shenanigans-pranks-memes-and-workplace-woes",
    tags: [mockTags[9]],
    user: mockUsers[4],
    user_id: mockUsers[4].id,
    word_count: 293,
    stats: {
      like_count: 402,
      read_count: 13492
    },
    description:
      "Unleash your green thumb with these expert tips and step-by-step instructions to create a bountiful vegetable patch in your own backyard.",
    id: "1662482155938364800"
  },
  {
    splash_hex: "b3a494",
    splash_id: getSplashId("lq-w5bRrNcc"),
    published_at: "2023-02-03T01:07:02.000Z",
    created_at: "2022-02-03T01:07:02.000Z",
    edited_at: "2023-04-03T01:07:02.000Z",
    deleted_at: null,
    title: "Pets Gone Wild: The Funniest Antics of Our Furry Friends",
    slug: "pets-gone-wild-the-funniest-antics-of-our-furry-friends",
    tags: [mockTags[2], mockTags[1], mockTags[3], mockTags[7], mockTags[4]],
    user: mockUsers[5],
    user_id: mockUsers[5].id,
    word_count: 4511,
    stats: {
      like_count: 49592,
      read_count: 3952915
    },
    description:
      "Prepare for a dose of cuteness overload and uncontrollable laughter as we showcase the hilarious and adorable antics of pets that prove they rule the internet.",
    id: "1662654838398690172"
  },
  {
    splash_hex: "8a8a92",
    splash_id: getSplashId("jNpvVRvFcrI"),
    published_at: "2022-11-23T01:07:02.000Z",
    created_at: "2021-11-23T01:07:02.000Z",
    edited_at: "2023-11-23T01:07:02.000Z",
    deleted_at: null,
    title: "Wanderlust Chronicles: Tales from Around the Globe",
    slug: "wanderlust-chronicles-tales-from-around-the-globe",
    tags: [mockTags[2], mockTags[6], mockTags[1]],
    user: mockUsers[6],
    user_id: mockUsers[6].id,
    word_count: 1239,
    stats: {
      like_count: 395,
      read_count: 94532
    },
    description:
      "Embark on a virtual journey as we share captivating travel stories, hidden gems, and insider tips from our adventures around the world.",
    id: "1222640969630781442"
  },
  {
    splash_hex: "455f75",
    splash_id: getSplashId("d2YMQ-hZ3og"),
    published_at: "2021-09-04T01:07:02.000Z",
    created_at: "2021-09-02T01:07:02.000Z",
    edited_at: null,
    deleted_at: null,
    title: "Beyond the Stars: Exploring the Mysteries of Deep Space",
    slug: "beyond-the-stars-exploring-the-mysteries-of-deep-space",
    tags: [],
    user: mockUsers[7],
    user_id: mockUsers[7].id,
    word_count: 1342,
    stats: {
      like_count: 210,
      read_count: 902349
    },
    description:
      "A cosmic journey into the enigmatic wonders of deep space, uncovering the mysteries of black holes, distant galaxies, and the birth of stars.",
    id: "1662643586867775488"
  },
  {
    splash_hex: "71b343",
    splash_id: getSplashId("HWQXIYbs8PM"),
    published_at: "2022-07-13T01:07:02.000Z",
    created_at: "2022-06-13T01:07:02.000Z",
    edited_at: null,
    deleted_at: null,
    title:
      "The Search for Extraterrestrial Life: Are We Alone in the Universe?",
    slug: "the-search-for-extraterrestrial-life-are-we-alone-in-the-universe",
    tags: [mockTags[7]],
    user: mockUsers[8],
    user_id: mockUsers[8].id,
    word_count: 3540,
    stats: {
      like_count: 109,
      read_count: 93592
    },
    description:
      "Dive into the captivating quest for extraterrestrial life as we explore the latest discoveries, scientific theories, and the ongoing efforts to find signs of life beyond Earth.",
    id: "1663597389759266819"
  },
  {
    splash_hex: "191d24",
    splash_id: getSplashId("uKJ56vo9k3U"),
    published_at: "2021-08-08T01:07:02.000Z",
    created_at: "2021-05-08T01:07:02.000Z",
    edited_at: "2021-11-08T01:07:02.000Z",
    deleted_at: null,
    title: "Unusual Travel Tales: Strange Adventures and Bizarre Encounters",
    slug: "unusual-travel-tales-strange-adventures-and-bizarre-encounters",
    tags: [mockTags[1], mockTags[8]],
    user: mockUsers[9],
    user_id: mockUsers[9].id,
    word_count: 992,
    stats: {
      like_count: 3495,
      read_count: 924915
    },
    description:
      "Embark on an offbeat journey as we share bizarre travel tales, strange encounters, and unexpected adventures that will make you question the sanity of the world.",
    id: "1662662933439431056"
  }
];
