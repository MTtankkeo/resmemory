import Posts from './db/posts.db';
import Comments from './db/comments.db';
import postModule from './posts.module';
import dotenv from 'dotenv';

dotenv.config();

const onRequest = async (res, method, pathname, params, key, cb) => {
  let responseData = {};

  switch (method) {
    case 'POST':
      // 게시글 작성
      if (pathname === '/posts') {
        try {
          const { title, content, annualCategory, img } = params.bodies;

          if (!params.userId) {
            responseData = { code: 345 };
          } else if (!title) {
            responseData = { code: 342 };
          } else if (!content) {
            responseData = { code: 343 };
          } else if (!annualCategory) {
            responseData = { code: 344 };
          } else {
            await Posts.create({ title, content, annualCategory, img, userId: params.userId });
            responseData = { code: 341 };
          }
        } catch (err) {
          responseData = { code: 340 };
        }
      }

      // 댓글 작성
      if (pathname === '/comments') {
        try {
          const { userId } = params;
          const { content, postId } = params.bodies;
          const result = await Posts.findByPk(postId);

          if (!params.userId) {
            responseData = { code: 414 };
          } else if (!content) {
            responseData = { code: 412 };
          } else if (!result) {
            responseData = { code: 413 };
          } else {
            await Comments.create({ content, postId, userId });
            responseData = { code: 411 };
          }
        } catch (err) {
          responseData = { code: 410 };
        }
      }

      return post(
        method,
        pathname,
        params,
        key,
        (response) => {
          process.nextTick(cb, res, response);
        },
        responseData,
      );

    case 'GET':
      // 게시글 전체 조회
      if (pathname === '/posts' && params.query.pageNum) {
        try {
          const { pageNum } = params.query;
          const result = await Posts.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: (pageNum - 1) * 10,
            raw: true,
          });

          const userId = result.map((post) => post.userId);

          postModule.connectToAllUsers(
            process.env.HOST,
            process.env.USERS_PORT,
            (data) => {
              postModule.nickname = data.responseData.bodies;
            },
            userId,
          );
          const bodies = postModule.nickname;

          responseData = result.map((post) => {
            const nickname = bodies.filter((nickname) => nickname.userId == post.userId);
            return { ...post, nickname: nickname[0].nickname };
          });
        } catch (err) {
          responseData = { code: 310 };
        }
      }

      // 게시글 전체 조회(북마크 조회용)
      if (pathname === '/posts' && params.query.userId) {
        try {
          const { userId } = params.query;
          const result = await Posts.findAll({ where: { userId }, raw: true });
          responseData = { bodies: result };
        } catch (err) {
          responseData = { code: 310 };
        }
      }

      // 연도별 게시글 조회
      if (pathname === '/posts' && params.query.annualCategory) {
        try {
          const { annualCategory, pageNum } = params.query;
          const result = await Posts.findAll({
            where: { annualCategory },
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: (pageNum - 1) * 10,
            raw: true,
          });

          const userId = result.map((post) => post.userId);

          postModule.connectToAllUsers(
            process.env.HOST,
            process.env.USERS_PORT,
            (data) => {
              postModule.nickname = data.responseData.bodies;
            },
            userId,
          );
          const bodies = postModule.nickname;

          responseData = result.map((post) => {
            const nickname = bodies.filter((nickname) => nickname.userId == post.userId);
            return { ...post, nickname: nickname[0].nickname };
          });
        } catch (err) {
          responseData = { code: 320 };
        }
      }

      // 게시글 상세 조회
      if (pathname === '/posts' && params.query.postId) {
        try {
          const { postId } = params.query;
          const result = await Posts.findByPk(postId, { raw: true });

          postModule.connectToUsers(
            process.env.HOST,
            process.env.USERS_PORT,
            (data) => {
              postModule.nickname = data;
            },
            result.userId,
          );
          result.nickname = postModule.nickname.responseData.bodies.nickname;

          await Posts.update({ viewCount: result.viewCount + 1 }, { where: { postId } });
          responseData = { result };
        } catch (err) {
          responseData = { code: 330 };
        }
      }

      // 댓글 조회
      if (pathname === '/comments') {
        try {
          const { postId } = params.query;
          const findPostData = await Posts.findByPk(postId);
          if (!findPostData) {
            responseData = { code: 421 };
          } else {
            let result = await Comments.findAll({
              where: { postId },
              raw: true,
            });

            const userId = result.map((comment) => comment.userId);

            postModule.connectToAllUsers(
              process.env.HOST,
              process.env.USERS_PORT,
              (data) => {
                postModule.nickname = data.responseData.bodies;
              },
              userId,
            );
            const bodies = postModule.nickname;

            responseData = result.map((comment) => {
              const nickname = bodies.filter((nickname) => nickname.userId == comment.userId);
              return { ...comment, nickname: nickname[0].nickname };
            });
          }
        } catch (err) {
          responseData = { code: 420 };
        }
      }

      return get(
        method,
        pathname,
        params,
        key,
        (response) => {
          process.nextTick(cb, res, response);
        },
        responseData,
      );

    case 'PATCH':
      // 게시글 수정
      if (pathname === '/posts') {
        try {
          const { title, content, annualCategory, img } = params.bodies;
          const postId = params.params;
          const findPostData = await Posts.findByPk(postId);

          if (!findPostData) {
            responseData = { code: 352 };
          } else if (!params.userId) {
            responseData = { code: 353 };
          } else if (params.userId !== findPostData.userId) {
            responseData = { code: 354 };
          } else if (!title) {
            responseData = { code: 355 };
          } else if (!content) {
            responseData = { code: 356 };
          } else if (!annualCategory) {
            responseData = { code: 357 };
          } else {
            await Posts.update({ title, content, annualCategory, img }, { where: { postId } });
            responseData = { code: 351 };
          }
        } catch (err) {
          responseData = { code: 350 };
        }
      }

      // 댓글 수정
      if (pathname === '/comments') {
        try {
          const { postId, content } = params.bodies;
          const commentId = params.params;
          const findCommentData = await Comments.findByPk(commentId);

          if (!findCommentData) {
            responseData = { code: 432 };
          } else if (!params.userId) {
            responseData = { code: 433 };
          } else if (params.userId !== findCommentData.userId) {
            responseData = { code: 434 };
          } else if (!content) {
            responseData = { code: 435 };
          } else {
            await Comments.update({ content }, { where: { postId, commentId } });
            responseData = { code: 431 };
          }
        } catch (err) {
          responseData = { code: 430 };
        }
      }

      return patch(
        method,
        pathname,
        params,
        key,
        (response) => {
          process.nextTick(cb, res, response);
        },
        responseData,
      );

    case 'DELETE':
      // 게시글 삭제
      if (pathname === '/posts' && params.params !== 'admin') {
        try {
          const postId = params.params;
          const findPostData = await Posts.findByPk(postId);

          if (!findPostData) {
            responseData = { code: 362 };
          } else if (!params.userId) {
            responseData = { code: 363 };
          } else if (params.userId !== findPostData.userId) {
            responseData = { code: 364 };
          } else {
            await Posts.destroy({ where: { postId } });
            responseData = { code: 361 };
          }
        } catch (err) {
          responseData = { code: 360 };
        }
      }

      // 게시글 완전 삭제(게시글이 삭제된지 오래되었을 때 DB 데이터 삭제)
      if (pathname === '/posts' && params.params === 'admin') {
        try {
          const { contentId } = params.bodies;

          const result = await Posts.destroy({ where: { postId: contentId }, force: true });
          responseData = { code: 371, result };
        } catch (err) {
          responseData = { code: 370, err };
        }
      }

      // 댓글 삭제
      if (pathname === '/comments' && params.params !== 'admin') {
        try {
          const { postId } = params.bodies;
          const commentId = params.params;
          const findCommentData = await Comments.findByPk(commentId);

          if (!findCommentData) {
            responseData = { code: 442 };
          } else if (params.userId !== findCommentData.userId) {
            responseData = { code: 443 };
          } else {
            await Comments.destroy({ where: { postId, commentId } });
            responseData = { code: 441 };
          }
        } catch (err) {
          responseData = { code: 440 };
        }
      }

      // 댓글 완전 삭제(삭제된 댓글이 오래되었을 때 DB 데이터 삭제)
      if (pathname === '/comments' && params.params === 'admin') {
        try {
          const { contentId } = params.bodies;

          const result = await Comments.destroy({ where: { commentId: contentId }, force: true });
          responseData = { code: 451, result };
        } catch (err) {
          responseData = { code: 450, err };
        }
      }

      return remove(
        method,
        pathname,
        params,
        key,
        (response) => {
          process.nextTick(cb, res, response);
        },
        responseData,
      );
  }
};

function post(method, pathname, params, key, cb, responseData) {
  const response = {
    key,
    errorCode: 0,
    errormessage: 'success',
    responseData,
  };
  cb(response);
}

function get(method, pathname, params, key, cb, responseData) {
  const response = {
    key,
    errorCode: 0,
    errormessage: 'success',
    responseData,
  };
  cb(response);
}

function patch(method, pathname, params, key, cb, responseData) {
  const response = {
    key,
    errorCode: 0,
    errormessage: 'success',
    responseData,
  };
  cb(response);
}

function remove(method, pathname, params, key, cb, responseData) {
  const response = {
    key,
    errorCode: 0,
    errormessage: 'success',
    responseData,
  };
  cb(response);
}

export default onRequest;
