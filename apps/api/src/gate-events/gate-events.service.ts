import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGateEventDto } from './dto/create-gate-event.dto';
import { GateType, TripStatus } from '@prisma/client';


@Injectable()
export class GateEventsService {

constructor(
 private prisma: PrismaService,
){}



async create(dto: CreateGateEventDto){

 return this.prisma.$transaction(async(tx)=>{


  const trip = await tx.trip.findUnique({
   where:{
    id:dto.tripId
   }
  });


  if(!trip){
   throw new BadRequestException(
    'Trip not found'
   );
  }



  const dispatcher =
   await tx.dispatcherProfile.findUnique({
    where:{
     id:dto.dispatcherId
    }
   });



  if(!dispatcher){
   throw new BadRequestException(
    'Dispatcher not found'
   );
  }




  const event =
   await tx.gateEvent.create({

    data:{
     tripId:dto.tripId,
     dispatcherId:dto.dispatcherId,
     gateType:dto.gateType,
     remarks:dto.remarks
    }

   });



  if(dto.gateType === GateType.OUTBOUND){

 await this.prisma.trip.update({
  where:{
   id:dto.tripId,
  },
  data:{
   status:TripStatus.EN_ROUTE,
   departedAt:new Date(),
  },
 });

}




  if(dto.gateType === GateType.INBOUND){

   await tx.trip.update({

    where:{
     id:dto.tripId
    },

    data:{
     status:TripStatus.DOCKED,
     arrivedAt:new Date()
    }

   });

  }



  return event;


 });

}




findTripEvents(id:string){

 return this.prisma.gateEvent.findMany({

  where:{
   tripId:id
  },

  orderBy:{
   scannedAt:'desc'
  }

 });

}


}