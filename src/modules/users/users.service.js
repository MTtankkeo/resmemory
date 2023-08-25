import Users from './db/users.db';
import Bookmarks from './db/bookmarks.db';
import bcrypt from 'bcrypt';
import redisCli from '../../redis';
import jwt from 'jsonwebtoken';
import signup from './signup.service';
import usersmodule from './users.module';

const onRequest = async (res, method, pathname, params, key, cb) => {
  let token;
  let responseData = {};
  const query = params.query;

  // POST
  switch (method) {
    case 'POST':
      // 회원 가입
      if (pathname == '/mail' || pathname == '/verified' || pathname == '/signup') {
        responseData = await signup(pathname, params, responseData, token);
      }

      // 로그아웃
      if (pathname == '/logout') {
        responseData = { code: 131 };
      }

      // 로그인
      if (pathname == '/login') {
        try {
          const { email, password } = params.bodies;

          const user = await Users.findOne({ where: { email } });
          const isValidPassword = await bcrypt.compare(password, user.password);
          let refresh = params.bodies.refresh;
          const today = Date.now();

          if (!isValidPassword) {
            responseData = { code: 122 };
          } else if (refresh) {
            const verified = jwt.verify(refresh, process.env.JWT_SECRET_KEY_REFRESH);
            if (today - jwt.decode(refresh).expiresIn > 0) {
              if (verified && redisCli.get(`refresh_${user.userId}`) == refresh) {
                token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
                  expiresIn: process.env.JWT_EXPIRE_TIME,
                });
                responseData = { code: 121 };
              } else {
                responseData = { code: 122 };
              }
            } else {
              if (verified) {
                refresh = jwt.sign({ ok: 'ok' }, process.env.JWT_SECRET_KEY_REFRESH, {
                  expiresIn: process.env.JWT_EXPIRE_TIME_REFRESH,
                });
                token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
                  expiresIn: process.env.JWT_EXPIRE_TIME,
                });
                responseData = { code: 123, refresh, token };
              }
            }
          } else {
            refresh = jwt.sign({ ok: 'ok' }, process.env.JWT_SECRET_KEY_REFRESH, {
              expiresIn: process.env.JWT_EXPIRE_TIME_REFRESH,
            });
            token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
              expiresIn: process.env.JWT_EXPIRE_TIME,
            });
            redisCli.set(`refresh_${user.userId}`, `${refresh}`);
            responseData = { code: 123, refresh, token };
          }
        } catch (err) {
          responseData = { code: 120 };
        }
      }

      // 북마크 추가
      if (pathname == '/bookmarks') {
        try {
          const { postId } = params.bodies;
          const { userId } = params;

          const findbookmark = await Bookmarks.findOne({ where: { postId, userId } });
          if (findbookmark) {
            responseData = { code: 224 };
          } else {
            if (postId) {
              const result = await Bookmarks.create({ userId, postId });
              responseData = { code: 221 };
              if (!result) {
                responseData = { code: 223 };
              }
            } else {
              responseData = { code: 222 };
            }
          }
        } catch (err) {
          responseData = { code: 220 };
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

    // GET
    case 'GET':
      if (pathname == '/users' && query.userId) {
        try {
          if (query) {
            const result = await Users.findByPk(query.userId, {
              attributes: { exclude: ['password', 'kakaoId', 'deletedAt'] },
            });
            responseData = { bodies: result, code: 171 };
          } else {
            responseData = { code: 172 };
          }
        } catch (err) {
          responseData = { code: 170 };
        }
      }

      if (pathname == '/users') {
        try {
          const result = await Users.findAll({
            attributes: { exclude: ['password', 'kakaoId', 'deletedAt'] },
          });

          if (result) {
            responseData = { bodies: result, code: 191 };
          } else {
            responseData = { code: 192 };
          }
        } catch (err) {
          responseData = { code: 190 };
        }
      }

      if (pathname == '/bookmarks') {
        try {
          const { userId } = params;
          const bookmarks = await Bookmarks.findAll({ order: ['createdAt'], where: { userId } });

          usersmodule.connectToGetPosts(
            process.env.HOST,
            process.env.POSTS_PORT,
            (data) => {
              usersmodule.posts = data.responseData.bodies;
            },
            userId,
          );
          const bodies = bookmarks.map((bookmark) => {
            return usersmodule.posts.filter((post) => bookmark.postId == post.postId);
          });
          responseData = { code: 171, bodies };
        } catch (err) {
          responseData = { code: 170, bodies: null };
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
      if (params.params == 'nickname') {
        const { nickname } = params.bodies;
        const { userId } = params;
        if (!nickname) {
          responseData = { code: 153 };
        }
        const result = await Users.update(
          {
            nickname,
          },
          { where: { userId } },
        );
        if (result) {
          responseData = { code: 151 };
        } else {
          responseData = { code: 153 };
        }
      }
      if (params.params == 'password') {
        try {
          const { password, confirm } = params.bodies;
          const { userId } = params;
          if (!password || !confirm) {
            responseData = { code: 164 };
          } else if (password !== confirm) {
            responseData = { code: 163 };
          }
          const hashedPassword = await bcrypt.hash(password, 10);
          const result = await Users.update(
            {
              password: hashedPassword,
            },
            { where: { userId } },
          );
          if (result) {
            responseData = { code: 161 };
          } else {
            responseData = { code: 162 };
          }
        } catch (err) {
          responseData = { code: 160 };
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
      if (pathname == '/users') {
        try {
          const { message } = params.bodies;
          const { userId } = params;
          if (message == '회원 탈퇴를 희망합니다.') {
            const result = await Users.destroy({ where: { userId } });
            if (result) {
              responseData = { code: 141 };
            } else {
              responseData = { code: 143 };
            }
          } else {
            responseData = { code: 142 };
          }
        } catch (error) {
          responseData = { code: 140 };
        }
      }

      if (pathname == '/bookmarks') {
        try {
          const bookmarkId = params.params;
          const result = await Bookmarks.destroy({ where: { bookmarkId } });
          if (result) {
            responseData = { code: 231 };
          } else {
            responseData = { code: 232 };
          }
        } catch (err) {
          responseData = { code: 230 };
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
    default:
      return process.nextTick(cb, res, null);
  }
};

function get(method, pathname, params, key, cb, responseData) {
  const response = {
    key,
    errorCode: 0,
    errormessage: 'success',
    responseData,
  };

  cb(response);
}

function post(method, pathname, params, key, cb, responseData) {
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
