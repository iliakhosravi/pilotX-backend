import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Drivers should connect with a socket and then send an event 'register' { driverId }.
 * The gateway maps driverId => socket for pushing jobs.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/drivers',
})
@Injectable()
export class DispatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DispatchGateway.name);

  // in-memory map: driverId -> socket.id
  private driverSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.on('register', (payload: { driverId: string }) => {
      if (payload?.driverId) {
        this.driverSockets.set(payload.driverId, client.id);
        client.data.driverId = payload.driverId;
        this.logger.log(`Driver ${payload.driverId} registered with socket ${client.id}`);
      }
    });

    client.on('disconnecting', () => {
      const driverId = client.data.driverId;
      if (driverId) {
        this.driverSockets.delete(driverId);
        this.logger.log(`Driver ${driverId} disconnected`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendJobToDriver(driverId: string, job: any) {
    const socketId = this.driverSockets.get(driverId);
    if (!socketId) return false;
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) return false;
    socket.emit('job_assigned', job);
    return true;
  }
}



// import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

// @WebSocketGateway()
// export class DispatchGateway {
//   @SubscribeMessage('message')
//   handleMessage(client: any, payload: any): string {
//     return 'Hello world!';
//   }
// }
