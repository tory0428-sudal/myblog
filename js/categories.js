// 블로그 콘텐츠 카테고리 정의. index.html(히어로/내비), list.js, post.js가 공유한다.
var BLOG_CATEGORIES = [
  {
    slug: "home-building",
    label: "내 밥벌이 이야기",
    sub: "주택 건축",
    desc: "주택 건축 현장에서 있었던 하루하루의 일과 사진을 정리하는 페이지.",
    image: "images/categories/home-building.svg"
  },
  {
    slug: "computer",
    label: "내 취미 생활",
    sub: "컴퓨터 이야기",
    desc: "사용 중인 컴퓨터, 업그레이드, 뉴스, 게임 등 취미를 기록하는 페이지.",
    image: "images/categories/computer.svg"
  },
  {
    slug: "daily-life",
    label: "하루하루 삶",
    sub: "여행, 일상",
    desc: "가족과의 여행이나 일상 이벤트를 일기처럼 기록하는 페이지.",
    image: "images/categories/daily-life.svg"
  },
  {
    slug: "etc",
    label: "이것저것",
    sub: "아무거나 이것저것",
    desc: "주제에 얽매이지 않는 개인적인 수필, 사회 뉴스, 정치 등을 정리하는 페이지.",
    image: "images/categories/etc.svg"
  },
  {
    slug: "claude-life",
    label: "클로드 생활",
    sub: "클로드 정리",
    desc: "클로드를 공부하며 생긴 의문이나 사용 팁, 흔적을 정리하는 페이지.",
    image: "images/categories/claude-life.svg"
  }
];

function getCategoryBySlug(slug) {
  for (var i = 0; i < BLOG_CATEGORIES.length; i++) {
    if (BLOG_CATEGORIES[i].slug === slug) return BLOG_CATEGORIES[i];
  }
  return null;
}
