import {
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import {
  Server,
} from "socket.io";

import {
  LiveVehicle,
} from "./tracking.service";


@WebSocketGateway({
  namespace: "/tracking",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TrackingGateway {
  @WebSocketServer()
  server!: Server;


  broadcastVehicle(
    vehicle: LiveVehicle,
  ) {
    this.server.emit(
      "vehicle:location",
      vehicle,
    );
  }


  broadcastVehicleRemoved(
    tripId: string,
  ) {
    this.server.emit(
      "vehicle:removed",
      {
        tripId,
      },
    );
  }
}