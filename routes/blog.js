const express = require("express"); // 익스프레스 PKG require
const mongodb = require("mongodb"); // mongodb PKG require

const db = require("../data/database"); // DB 모듈 불러오기

const ObjectId = mongodb.ObjectId; // ObjectId 형태의 자료형

const router = express.Router(); // 라우터 모듈

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find({}, { title: 1, summary: 1, "author.name": 1 })
    .toArray();
  res.render("posts-list", { posts: posts });
});

// 새로운 포스트를 생성창으로 들어오는 get 요청 받음.
router.get("/new-post", async function (req, res) {
  const authors = await db.getDb().collection("authors").find().toArray(); // db 모듈을 이용하여 find메서드를 통해 'authors' 컬렉션에 접근. 배열 형태로 반환
  res.render("create-post", { authors: authors }); // create-post 템플릿에 배열 형태의 authors 전달 후 렌더.
});

// 새로운 포스트 생성, post 요청 받음.
router.post("/posts", async function (req, res) {
  const authorId = new ObjectId(req.body.author); // 작성자의 Id를 ObjectID 형태로 받음

  // authorID와 일치하는 author 문서에 접근
  const author = await db
    .getDb()
    .collection("authors")
    .findOne({ _id: authorId });

  // 요청의 파라미터들을 읽고 각각의 값을 posts 컬렉션 형태에 맞게 저장해서 javascript 객체 형태로 newPost에 담음.
  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: {
      id: authorId, // 전에 접근했었던 author 변수를 이용하여 author 중첩 컬렉션에 데이터 저장.
      name: author.name,
      email: author.email,
    },
  };

  // 위에서 만들어진 객체를 posts 컬렉션에 저장.
  const result = await db.getDb().collection("posts").insertOne(newPost);
  console.log(result);
  res.redirect("/posts");
});

router.get("/posts/:id", async function (req, res, next) {
  let postId = req.params.id;
  try{
    postId = new ObjectId(req.params.id);
  }
  catch(error){
    return next(error);
  }

  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) }, { summary: 0 });

  if (!post) {
    return res.status(404).render("404");
  }

  post.humanReadableData = post.date.toLocaleDateString("ko-KR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  post.date = post.date.toISOString();

  res.render("post-detail", { post: post });
});

router.get("/posts/:id/edit", async function (req, res) {
  const postId = new ObjectId(req.params.id);
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: postId }, { author: 0 });

  if (!post) {
    return res.status(404).render("404");
  }
  res.render("update-post", { post: post });
});

router.post("/posts/:id/edit", async function (req, res) {
  const postId = new ObjectId(req.params.id);

  const result = await db
    .getDb()
    .collection("posts")
    .updateOne(
      { _id: postId },
      {
        $set: {
          title: req.body.title,
          summary: req.body.summary,
          body: req.body.content,
          date: new Date()
        }
      }
    );

  res.redirect('/posts');
});

router.post("/posts/:id/delete", async function(req, res){
  const postId = new ObjectId(req.params.id);
  
  const result = await db.getDb().collection('posts').deleteOne({_id: postId});

  res.redirect('/posts');
});

module.exports = router;
