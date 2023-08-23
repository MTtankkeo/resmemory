import TcpServer from '../../classes/server';
import dotenv from 'dotenv';
import onRequest from './posts.service';

dotenv.config();

class PostsModule extends TcpServer {
  constructor() {
    // 부모 클래스 생성자 호출
    super('posts', process.env.POSTS_PORT ? Number(process.env.POSTS_PORT) : 3001, [
      'POST/posts',
      'GET/posts',
      'PATCH/posts',
      'POST/comments',
      'GET/comments',
      'PATCH/comments',
    ]);
    this.connectToDistributor(process.env.HOST, process.env.DIS_PORT, (data) => {
      console.log('Users Notification', data);
    });
  }

  // 클라이언트 요청에 따른 비즈니스 로직 호출
  onRead(socket, data) {
    console.log('onRead', socket.remoteAddress, socket.remotePort, data);
    onRequest(socket, data.method, data.uri, data.params, data.key, (s, packet) => {
      console.log(packet);
      socket.write(JSON.stringify(packet) + '¶');
    });
  }
}

const postModule = new PostsModule();
export default postModule;
